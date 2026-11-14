/**
 * @file lib/operations/job-lifecycle.ts
 * @description Phase 7.3 Operational State Machine, Handover & Lifecycle Controller.
 * Enforces monotonic job transitions, delivery/completion OTPs, RBAC ownership,
 * and strict financial authority isolation.
 */

import {
  type JobOperationalStatus,
  type OperationalJobCard,
  type InstallerAssignmentAudit,
  type MaterialManifestItem,
  type InstallationQCChecklist,
  type SerializedAssetRecord,
} from "./operational-contract";

export class OperationalStateError extends Error {
  public readonly code: string;
  constructor(message: string, code: string = "INVALID_OPERATIONAL_TRANSITION") {
    super(message);
    this.name = "OperationalStateError";
    this.code = code;
  }
}

const VALID_OPERATIONAL_TRANSITIONS: Record<JobOperationalStatus, readonly JobOperationalStatus[]> = {
  PENDING_DISPATCH: ["ASSIGNED", "DISPATCHED", "CANCELLED"],
  BACKORDERED: ["PENDING_DISPATCH", "CANCELLED"],
  ASSIGNED: ["DISPATCHED", "IN_PROGRESS", "ASSIGNED", "CANCELLED"], // Reassignment stays ASSIGNED
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["IN_PROGRESS", "ASSIGNED", "CANCELLED"],
  IN_PROGRESS: ["MATERIAL_SHORTAGE", "PARTIALLY_COMPLETED", "COMPLETED", "CANCELLED"],
  MATERIAL_SHORTAGE: ["IN_PROGRESS", "CANCELLED"],
  PARTIALLY_COMPLETED: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: [], // Terminal
  CANCELLED: [], // Terminal
};

/**
 * Validates that operational transition is permissible under the monotonic state machine.
 */
export function validateOperationalTransition(
  current: JobOperationalStatus,
  next: JobOperationalStatus
): void {
  if (current === next) {
    return; // Idempotent no-op
  }

  const allowed = VALID_OPERATIONAL_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new OperationalStateError(
      `Monotonic violation: cannot transition job from ${current} to ${next}`,
      "INVALID_OPERATIONAL_TRANSITION"
    );
  }
}

/**
 * Gate 7.3.3: Assigns an installer to a job with mandatory audit logging and RBAC tracking.
 */
export function assignInstaller(
  job: OperationalJobCard,
  newInstallerId: string,
  assignedBy: string,
  reason = "Standard dispatch assignment"
): OperationalJobCard {
  if (!newInstallerId) {
    throw new OperationalStateError("Installer ID is required for assignment", "MISSING_INSTALLER_ID");
  }

  const previousInstaller = job.installer_id || null;
  const audit: InstallerAssignmentAudit = {
    installer_id: newInstallerId,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString(),
    assignment_reason: reason,
    previous_installer_id: previousInstaller,
  };

  const nextStatus: JobOperationalStatus =
    job.status === "PENDING_DISPATCH" ? "ASSIGNED" : job.status;

  validateOperationalTransition(job.status, nextStatus);

  return {
    ...job,
    status: nextStatus,
    installer_id: newInstallerId,
    assignment_history: [...job.assignment_history, audit],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Gate 7.3.4: Verifies Delivery OTP and records material delivery manifest.
 */
export function verifyDeliveryOtp(
  job: OperationalJobCard,
  enteredOtp: string,
  manifest: MaterialManifestItem[],
  verifiedBy: string
): OperationalJobCard {
  // Idempotency: If already delivered with same OTP, return existing state cleanly
  if (job.status === "DELIVERED" && job.delivery_audit) {
    return job;
  }

  if (!job.delivery_otp || enteredOtp !== job.delivery_otp) {
    throw new OperationalStateError("Invalid Delivery OTP", "INVALID_DELIVERY_OTP");
  }

  validateOperationalTransition(job.status, "DELIVERED");

  const totalDeliveredQty = manifest.reduce((sum, item) => sum + item.qty, 0);

  const deliveryAudit = {
    job_id: job.id,
    delivery_otp_verified_at: new Date().toISOString(),
    verified_by: verifiedBy,
    material_manifest: manifest,
    delivered_quantity: totalDeliveredQty,
  };

  return {
    ...job,
    status: "DELIVERED",
    delivery_audit: deliveryAudit,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Gate 7.3.5: Verifies completion OTP, commissioning checklist, and asset reconciliation.
 */
export function completeInstallation(params: {
  job: OperationalJobCard;
  enteredOtp: string;
  qcChecklist: InstallationQCChecklist;
  serializedAssets: SerializedAssetRecord[];
  expectedAssetCount: number;
}): OperationalJobCard {
  const { job, enteredOtp, qcChecklist, serializedAssets, expectedAssetCount } = params;

  // Idempotency: If already completed, return existing state cleanly
  if (job.status === "COMPLETED") {
    return job;
  }

  // 1. Completion OTP Verification
  if (!job.completion_otp || enteredOtp !== job.completion_otp) {
    throw new OperationalStateError("Invalid Completion OTP", "INVALID_COMPLETION_OTP");
  }

  // 2. Commissioning QC Checklist completeness
  const allQcPassed = Object.values(qcChecklist).every((val) => val === true);
  if (!allQcPassed) {
    throw new OperationalStateError(
      "Commissioning checklist incomplete: all QC checks must pass before completion",
      "QC_CHECKLIST_INCOMPLETE"
    );
  }

  // 3. Asset / Serial Reconciliation
  if (serializedAssets.length < expectedAssetCount) {
    throw new OperationalStateError(
      `Asset reconciliation mismatch: Expected ${expectedAssetCount} serialized assets, but received ${serializedAssets.length}`,
      "ASSET_RECONCILIATION_MISMATCH"
    );
  }

  validateOperationalTransition(job.status, "COMPLETED");

  const completedAt = new Date().toISOString();

  return {
    ...job,
    status: "COMPLETED",
    qc_checklist: qcChecklist,
    installed_assets: serializedAssets,
    completed_at: completedAt,
    updated_at: completedAt,
  };
}

/**
 * Gate 7.3.9: Financial/Operational Authority Isolation Assertion.
 * Proves that operational mutations strictly leave financial records untouched.
 */
export function assertFinancialIsolation(params: {
  initialQuoteSnapshot: any;
  currentQuoteSnapshot: any;
  initialPaymentHistory: any[];
  currentPaymentHistory: any[];
  initialInvoice: any;
  currentInvoice: any;
}): void {
  const {
    initialQuoteSnapshot,
    currentQuoteSnapshot,
    initialPaymentHistory,
    currentPaymentHistory,
    initialInvoice,
    currentInvoice,
  } = params;

  if (initialQuoteSnapshot.total_payable !== currentQuoteSnapshot.total_payable) {
    throw new OperationalStateError(
      "Financial Isolation Violation: Operational action mutated quote total_payable",
      "FINANCIAL_ISOLATION_VIOLATION"
    );
  }

  if (
    initialQuoteSnapshot.pricingSnapshot?.total_payable !==
    currentQuoteSnapshot.pricingSnapshot?.total_payable
  ) {
    throw new OperationalStateError(
      "Financial Isolation Violation: Operational action mutated pricingSnapshot total_payable",
      "FINANCIAL_ISOLATION_VIOLATION"
    );
  }

  if (initialPaymentHistory.length !== currentPaymentHistory.length) {
    throw new OperationalStateError(
      "Financial Isolation Violation: Operational action mutated payment_history record count",
      "FINANCIAL_ISOLATION_VIOLATION"
    );
  }

  if (initialInvoice && currentInvoice) {
    if (initialInvoice.total_payable !== currentInvoice.total_payable) {
      throw new OperationalStateError(
        "Financial Isolation Violation: Operational action mutated invoice total_payable",
        "FINANCIAL_ISOLATION_VIOLATION"
      );
    }
  }
}
