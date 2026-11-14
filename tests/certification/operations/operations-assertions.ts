/**
 * @file tests/certification/operations/operations-assertions.ts
 * @description Phase 7.3 Independent Operational Gate Assertions (Gates 7.3.1 to 7.3.10).
 * Independent, diagnosable test functions validating all 10 operational contracts.
 */

import assert from "node:assert/strict";
import {
  type OperationalJobCard,
  type WarrantyCertificateSnapshot,
  type AmcEntitlementRecord,
} from "../../../lib/operations/operational-contract";
import {
  assignInstaller,
  verifyDeliveryOtp,
  completeInstallation,
  validateOperationalTransition,
  assertFinancialIsolation,
  OperationalStateError,
} from "../../../lib/operations/job-lifecycle";
import { mintWarrantyCertificate } from "../../../lib/operations/warranty-service";
import { activateAmcEntitlement } from "../../../lib/operations/amc-service";

export function assertGate731CommercialHandover(
  job: OperationalJobCard,
  wonQuoteId: string,
  lead: { status: string; won_quote_id: string }
): void {
  assert.equal(job.quote_id, wonQuoteId, "Job card must strictly carry won_quote_id");
  assert.equal(lead.status, "won", "Lead must transition to won upon commercial handover");
  assert.equal(lead.won_quote_id, wonQuoteId, "Lead won_quote_id must be strictly bound");
}

export function assertGate732InventoryReservation(
  hasStock: boolean,
  status: string
): void {
  if (hasStock) {
    assert.equal(status, "PENDING_DISPATCH", "Sufficient inventory must result in PENDING_DISPATCH");
  } else {
    assert.equal(status, "BACKORDERED", "Insufficient inventory must result in BACKORDERED");
  }
}

export function assertGate733InstallerAssignmentAndRbac(
  job: OperationalJobCard,
  assignedJob: OperationalJobCard,
  reassignedJob: OperationalJobCard
): void {
  assert.equal(assignedJob.status, "ASSIGNED", "Status must transition to ASSIGNED");
  assert.equal(assignedJob.installer_id, "tech_alex_01");
  assert.equal(assignedJob.assignment_history.length, 1);
  assert.equal(assignedJob.assignment_history[0].assigned_by, "dispatcher_raj");

  // Reassignment
  assert.equal(reassignedJob.installer_id, "tech_vikas_02");
  assert.equal(reassignedJob.assignment_history.length, 2);
  assert.equal(reassignedJob.assignment_history[1].previous_installer_id, "tech_alex_01");
}

export function assertGate734DeliveryOtp(
  job: OperationalJobCard,
  validOtp: string,
  manifest: any[]
): void {
  // Wrong OTP throws
  assert.throws(
    () => {
      verifyDeliveryOtp(job, "000000", manifest, "customer");
    },
    (err: any) => err instanceof OperationalStateError && err.code === "INVALID_DELIVERY_OTP"
  );

  // Correct OTP succeeds
  const delivered = verifyDeliveryOtp(job, validOtp, manifest, "customer");
  assert.equal(delivered.status, "DELIVERED");
  assert.ok(delivered.delivery_audit);
  assert.equal(delivered.delivery_audit.material_manifest.length, manifest.length);
}

export function assertGate735InstallationQcAndCompletionOtp(params: {
  job: OperationalJobCard;
  validOtp: string;
  qcChecklist: any;
  serializedAssets: any[];
  expectedAssetCount: number;
}): void {
  const { job, validOtp, qcChecklist, serializedAssets, expectedAssetCount } = params;

  // 1. Wrong OTP throws
  assert.throws(
    () => {
      completeInstallation({
        job,
        enteredOtp: "000000",
        qcChecklist,
        serializedAssets,
        expectedAssetCount,
      });
    },
    (err: any) => err instanceof OperationalStateError && err.code === "INVALID_COMPLETION_OTP"
  );

  // 2. Incomplete QC checklist throws
  const incompleteQc = { ...qcChecklist, night_vision_tested: false };
  assert.throws(
    () => {
      completeInstallation({
        job,
        enteredOtp: validOtp,
        qcChecklist: incompleteQc,
        serializedAssets,
        expectedAssetCount,
      });
    },
    (err: any) => err instanceof OperationalStateError && err.code === "QC_CHECKLIST_INCOMPLETE"
  );

  // 3. Asset reconciliation mismatch throws (e.g. 3 assets instead of 4)
  assert.throws(
    () => {
      completeInstallation({
        job,
        enteredOtp: validOtp,
        qcChecklist,
        serializedAssets: serializedAssets.slice(0, 3),
        expectedAssetCount,
      });
    },
    (err: any) => err instanceof OperationalStateError && err.code === "ASSET_RECONCILIATION_MISMATCH"
  );

  // 4. Valid completion
  const completed = completeInstallation({
    job,
    enteredOtp: validOtp,
    qcChecklist,
    serializedAssets,
    expectedAssetCount,
  });
  assert.equal(completed.status, "COMPLETED");
  assert.ok(completed.completed_at);
}

export function assertGate736WarrantyImmutability(
  cert: WarrantyCertificateSnapshot,
  jobAfterIssuance: OperationalJobCard
): void {
  assert.ok(cert.id);
  assert.ok(cert.certNumber.startsWith("WARR-"));
  assert.equal(cert.status, "ACTIVE");
  assert.equal(cert.assets.length, 4);

  // Mutating job post-issuance does not alter certificate
  jobAfterIssuance.status = "CANCELLED";
  assert.equal(cert.status, "ACTIVE", "Warranty certificate status must remain ACTIVE independently of job");
  assert.equal(cert.assets.length, 4, "Certificate assets must remain immutable");
}

export function assertGate737AmcTransition(
  complimentaryAmc: AmcEntitlementRecord,
  paidAmc: AmcEntitlementRecord
): void {
  // Complimentary Care
  assert.equal(complimentaryAmc.isComplimentary, true);
  assert.equal(complimentaryAmc.includedPmVisits, 2);
  assert.equal(complimentaryAmc.scheduledPmVisits.length, 2);
  assert.equal(complimentaryAmc.status, "ACTIVE");

  // Paid AMC
  assert.equal(paidAmc.isComplimentary, false);
  assert.equal(paidAmc.includedPmVisits, 4);
  assert.equal(paidAmc.scheduledPmVisits.length, 4);
  assert.equal(paidAmc.status, "ACTIVE");
}

export function assertGate738MonotonicOperationalGuards(): void {
  // Completed jobs cannot regress
  assert.throws(
    () => {
      validateOperationalTransition("COMPLETED", "IN_PROGRESS");
    },
    (err: any) => err instanceof OperationalStateError && err.code === "INVALID_OPERATIONAL_TRANSITION"
  );

  assert.throws(
    () => {
      validateOperationalTransition("COMPLETED", "PENDING_DISPATCH");
    },
    (err: any) => err instanceof OperationalStateError && err.code === "INVALID_OPERATIONAL_TRANSITION"
  );
}

export function assertGate739FinancialOperationalAuthorityIsolation(params: {
  initialQuoteSnapshot: any;
  currentQuoteSnapshot: any;
  initialPaymentHistory: any[];
  currentPaymentHistory: any[];
  initialInvoice: any;
  currentInvoice: any;
}): void {
  assertFinancialIsolation(params);
}

export function assertGate7310OperationalEventReplaySafety(
  job: OperationalJobCard,
  deliveryOtp: string,
  manifest: any[]
): void {
  const firstDelivered = verifyDeliveryOtp(job, deliveryOtp, manifest, "customer");
  assert.equal(firstDelivered.status, "DELIVERED");

  // Replaying delivery OTP 10x
  for (let i = 0; i < 10; i++) {
    const replay = verifyDeliveryOtp(firstDelivered, deliveryOtp, manifest, "customer");
    assert.equal(replay.status, "DELIVERED", `Replay ${i + 1} must maintain DELIVERED state`);
    assert.equal(
      replay.delivery_audit?.delivery_otp_verified_at,
      firstDelivered.delivery_audit?.delivery_otp_verified_at,
      `Replay ${i + 1} must preserve original timestamp`
    );
  }
}
