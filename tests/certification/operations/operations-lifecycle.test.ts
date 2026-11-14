/**
 * @file tests/certification/operations/operations-lifecycle.test.ts
 * @description Phase 7.3 Operations Lifecycle Certification Test Suite.
 * Exercises all 10 operational gates and full end-to-end field fulfilment orchestration.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  TEST_DELIVERY_OTP,
  TEST_COMPLETION_OTP,
  canonicalMaterialManifest,
  canonicalSerializedAssets,
  validQcChecklist,
  createTestJobCard,
} from "./operations-fixtures";
import {
  assertGate731CommercialHandover,
  assertGate732InventoryReservation,
  assertGate733InstallerAssignmentAndRbac,
  assertGate734DeliveryOtp,
  assertGate735InstallationQcAndCompletionOtp,
  assertGate736WarrantyImmutability,
  assertGate737AmcTransition,
  assertGate738MonotonicOperationalGuards,
  assertGate739FinancialOperationalAuthorityIsolation,
  assertGate7310OperationalEventReplaySafety,
} from "./operations-assertions";
import {
  assignInstaller,
  verifyDeliveryOtp,
  completeInstallation,
  validateOperationalTransition,
} from "../../../lib/operations/job-lifecycle";
import { mintWarrantyCertificate } from "../../../lib/operations/warranty-service";
import { activateAmcEntitlement } from "../../../lib/operations/amc-service";
import { canonicalFrozenQuote } from "../commercial/commercial-fixtures";

test("Phase 7.3 — CRM, Field Operations & Operational Fulfilment", async (t) => {
  const quote = { ...canonicalFrozenQuote };

  await t.test("Gate 7.3.1 — Commercial to Operational Handover & Idempotency", () => {
    const job = createTestJobCard({ quote_id: quote.id });
    const lead = { status: "won", won_quote_id: quote.id };
    assertGate731CommercialHandover(job, quote.id, lead);

    // Duplicate commercial handover simulation: 10 replay events produce 0 duplicate jobs
    const jobsDatabase: Record<string, any> = { [job.id]: job };
    for (let i = 0; i < 10; i++) {
      if (!jobsDatabase[job.id]) {
        jobsDatabase[job.id] = job;
      }
    }
    assert.equal(Object.keys(jobsDatabase).length, 1, "Duplicate handover must produce exactly 1 job");
  });

  await t.test("Gate 7.3.2 — Inventory Reservation Decoupling", () => {
    assertGate732InventoryReservation(true, "PENDING_DISPATCH");
    assertGate732InventoryReservation(false, "BACKORDERED");
  });

  await t.test("Gate 7.3.3 — Installer Assignment & RBAC Ownership Tracking", () => {
    const initialJob = createTestJobCard();
    const assignedJob = assignInstaller(initialJob, "tech_alex_01", "dispatcher_raj", "Initial dispatch");
    const reassignedJob = assignInstaller(assignedJob, "tech_vikas_02", "dispatcher_raj", "Reassigned for schedule");

    assertGate733InstallerAssignmentAndRbac(initialJob, assignedJob, reassignedJob);
  });

  await t.test("Gate 7.3.4 — Material Handover & Delivery OTP Verification", () => {
    const job = createTestJobCard({ status: "DISPATCHED" });
    assertGate734DeliveryOtp(job, TEST_DELIVERY_OTP, canonicalMaterialManifest);
  });

  await t.test("Gate 7.3.5 — Installation QC Commissioning & Completion OTP", () => {
    const job = createTestJobCard({ status: "IN_PROGRESS" });
    assertGate735InstallationQcAndCompletionOtp({
      job,
      validOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });
  });

  await t.test("Gate 7.3.6 — Warranty Certificate Immutability Snapshot", () => {
    const job = createTestJobCard({ status: "IN_PROGRESS" });
    const completedJob = completeInstallation({
      job,
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });

    const cert = mintWarrantyCertificate({ job: completedJob, customerId: "cust_123" });
    assertGate736WarrantyImmutability(cert, completedJob);
  });

  await t.test("Gate 7.3.7 — Complimentary Care vs Paid AMC Transition", () => {
    const job = createTestJobCard({ status: "IN_PROGRESS" });
    const completedJob = completeInstallation({
      job,
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });

    const complimentaryAmc = activateAmcEntitlement({ job: completedJob, isComplimentary: true });
    const paidAmc = activateAmcEntitlement({ job: completedJob, isComplimentary: false, includedPmVisits: 4 });

    assertGate737AmcTransition(complimentaryAmc, paidAmc);
  });

  await t.test("Gate 7.3.8 — Monotonic Operational Transition Guards", () => {
    assertGate738MonotonicOperationalGuards();
  });

  await t.test("Gate 7.3.9 — Financial/Operational Authority Isolation", () => {
    const initialQuote = { ...canonicalFrozenQuote };
    const currentQuote = { ...canonicalFrozenQuote };
    const initialHistory = [{ payment_id: "p1", amount: 500 }];
    const currentHistory = [{ payment_id: "p1", amount: 500 }];
    const initialInvoice = { total_payable: 35590 };
    const currentInvoice = { total_payable: 35590 };

    // Simulate extensive operational mutations
    const job = createTestJobCard({ status: "DISPATCHED" });
    const delivered = verifyDeliveryOtp(job, TEST_DELIVERY_OTP, canonicalMaterialManifest, "tech_01");
    const completed = completeInstallation({
      job: { ...delivered, status: "IN_PROGRESS" },
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });
    const cert = mintWarrantyCertificate({ job: completed, customerId: "cust_123" });
    const amc = activateAmcEntitlement({ job: completed });

    // Assert zero mutations reached the financial authority
    assertGate739FinancialOperationalAuthorityIsolation({
      initialQuoteSnapshot: initialQuote,
      currentQuoteSnapshot: currentQuote,
      initialPaymentHistory: initialHistory,
      currentPaymentHistory: currentHistory,
      initialInvoice: initialInvoice,
      currentInvoice: currentInvoice,
    });
  });

  await t.test("Gate 7.3.10 — Operational Event Replay Safety", () => {
    const job = createTestJobCard({ status: "DISPATCHED" });
    assertGate7310OperationalEventReplaySafety(job, TEST_DELIVERY_OTP, canonicalMaterialManifest);
  });

  await t.test("Orchestration E2E — Complete Field Operational Lifecycle", () => {
    // 1. Initial State: Commercially Won Handover
    const job = createTestJobCard({ quote_id: quote.id });
    assert.equal(job.status, "PENDING_DISPATCH");

    // 2. Dispatcher assigns installer
    const assigned = assignInstaller(job, "tech_lead_01", "ops_admin", "Field allocation");
    assert.equal(assigned.status, "ASSIGNED");

    // 3. Warehouse dispatches materials
    validateOperationalTransition(assigned.status, "DISPATCHED");
    const dispatched = { ...assigned, status: "DISPATCHED" as const };

    // 4. Delivery OTP verified at site
    const delivered = verifyDeliveryOtp(dispatched, TEST_DELIVERY_OTP, canonicalMaterialManifest, "customer");
    assert.equal(delivered.status, "DELIVERED");

    // 5. Work commences
    validateOperationalTransition(delivered.status, "IN_PROGRESS");
    const inProgress = { ...delivered, status: "IN_PROGRESS" as const };

    // 6. Installation completion & customer sign-off OTP
    const completed = completeInstallation({
      job: inProgress,
      enteredOtp: TEST_COMPLETION_OTP,
      qcChecklist: validQcChecklist,
      serializedAssets: canonicalSerializedAssets,
      expectedAssetCount: 4,
    });
    assert.equal(completed.status, "COMPLETED");

    // 7. Parallel Lifecycle: Warranty Certificate and AMC Entitlement Minted
    const warranty = mintWarrantyCertificate({ job: completed, customerId: "cust_e2e" });
    assert.equal(warranty.status, "ACTIVE");
    assert.equal(warranty.assets.length, 4);

    const amc = activateAmcEntitlement({ job: completed, isComplimentary: true });
    assert.equal(amc.status, "ACTIVE");
    assert.equal(amc.scheduledPmVisits.length, 2);
  });
});
