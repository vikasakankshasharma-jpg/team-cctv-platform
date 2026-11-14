/**
 * @file tests/certification/pilot/pilot-assertions.ts
 * @description Phase 7.4 Independent Pilot Gate Assertions (Gates 7.4.1 to 7.4.7).
 * Independent, diagnosable test functions validating production readiness,
 * service-area eligibility, zero-secret security, and emergency rollback determinism.
 */

import assert from "node:assert/strict";
import { assertZeroSecrets } from "../../../lib/release/release-identity";
import { validateServiceAreaEligibility } from "../../../lib/pilot/pilot-geo-policy";
import {
  checkPilotOperationalCapacity,
  countActiveOperationalJobs,
  MAX_ACTIVE_PILOT_JOBS,
} from "../../../lib/pilot/pilot-controller";
import { planRollback, verifyPostRollbackState } from "../../../lib/release/rollback-controller";
import { type JobOperationalStatus } from "../../../lib/operations/operational-contract";

export function assertGate741HealthAndReleaseIdentity(health: any): void {
  assert.equal(health.status, "healthy");
  assert.equal(health.certificationVersion, "TEAM-CCTV-CERT-V1");
  assert.ok(health.deploymentVersion && health.deploymentVersion.startsWith("prod-"));
  assert.ok(health.gitSha && health.gitSha.length >= 7);
  assert.equal(health.systemMode, "LIVE");
  assert.equal(health.paymentsEnabled, true);
  assert.ok(health.timestamp);
}

export function assertGate742KillSwitchAndWebhookRetry(params: {
  maintenanceMode: boolean;
  paymentsDisabled: boolean;
  webhookSimResult: { statusCode: number; retryable: boolean };
  retriedSimResult: { statusCode: number; isDuplicate: boolean };
}): void {
  const { maintenanceMode, paymentsDisabled, webhookSimResult, retriedSimResult } = params;

  // Level 1: Maintenance Mode blocks new intake
  assert.equal(maintenanceMode, true, "System mode MAINTENANCE must be recognized");

  // Level 2: Payments Disabled returns HTTP 503 retryable to gateway
  assert.equal(paymentsDisabled, true, "Payments disabled must be recognized");
  assert.equal(webhookSimResult.statusCode, 503, "Webhook must receive HTTP 503 when payments disabled");
  assert.equal(webhookSimResult.retryable, true, "503 response must indicate retryable to gateway");

  // Webhook Retry: When kill switch lifted, retried webhook succeeds once
  assert.equal(retriedSimResult.statusCode, 200, "Retried webhook must succeed with 200 after recovery");
  assert.equal(retriedSimResult.isDuplicate, false, "Initial processed retry must be non-duplicate");
}

export function assertGate743JaipurServiceAreaEligibility(): void {
  // 1. Authorized allowlist pincodes
  const auth1 = validateServiceAreaEligibility("302001");
  assert.equal(auth1.eligible, true);
  assert.equal(auth1.code, "AUTHORIZED");

  const auth2 = validateServiceAreaEligibility(302020);
  assert.equal(auth2.eligible, true);
  assert.equal(auth2.code, "AUTHORIZED");

  // 2. Boundary pincode
  const boundary = validateServiceAreaEligibility("302039");
  assert.equal(boundary.eligible, true);
  assert.equal(boundary.code, "AUTHORIZED");

  // 3. Unauthorized out-of-area pincodes
  const unauthDelhi = validateServiceAreaEligibility("110001");
  assert.equal(unauthDelhi.eligible, false);
  assert.equal(unauthDelhi.code, "UNAUTHORIZED");

  const unauthMumbai = validateServiceAreaEligibility("400001");
  assert.equal(unauthMumbai.eligible, false);
  assert.equal(unauthMumbai.code, "UNAUTHORIZED");

  // 4. Invalid formats
  const invLength = validateServiceAreaEligibility("30200");
  assert.equal(invLength.eligible, false);
  assert.equal(invLength.code, "INVALID_FORMAT");

  const invChars = validateServiceAreaEligibility("JAIPUR");
  assert.equal(invChars.eligible, false);
  assert.equal(invChars.code, "INVALID_FORMAT");

  const invEmpty = validateServiceAreaEligibility("");
  assert.equal(invEmpty.eligible, false);
  assert.equal(invEmpty.code, "INVALID_FORMAT");
}

export function assertGate744ZeroSecretRuntimeAudit(payloads: any[]): void {
  for (const payload of payloads) {
    // Throws if any sensitive token, secret, or private key is found
    assert.doesNotThrow(() => {
      assertZeroSecrets(payload);
    });
  }
}

export function assertGate745CatalogDriftAlertingAndSnapshotProtection(params: {
  driftAlertEmitted: boolean;
  originalQuoteSnapshot: any;
  quoteAfterCatalogPriceHike: any;
}): void {
  const { driftAlertEmitted, originalQuoteSnapshot, quoteAfterCatalogPriceHike } = params;

  assert.equal(driftAlertEmitted, true, "Catalog drift watcher must emit alert on price discrepancy");
  assert.equal(
    quoteAfterCatalogPriceHike.pricingSnapshot.total_payable,
    originalQuoteSnapshot.pricingSnapshot.total_payable,
    "Existing quote snapshot total_payable must remain 100% immutable"
  );
  assert.equal(
    quoteAfterCatalogPriceHike.calculation_fingerprint,
    originalQuoteSnapshot.calculation_fingerprint,
    "Calculation fingerprint must remain 100% immutable"
  );
}

export function assertGate746EmergencyStopAndRollbackDeterminism(): void {
  // Plan Tier 2 Certified Baseline Target Rollback
  const plan = planRollback({
    currentDeploymentVersion: "prod-20261114-c7a0b4c5",
    targetType: "CERTIFIED_BASELINE",
    approvedBy: "lead_devops_raj",
    reason: "Controlled pilot disaster recovery drill",
  });

  assert.equal(plan.targetType, "CERTIFIED_BASELINE");
  assert.equal(plan.certificationVersion, "TEAM-CCTV-CERT-V1");
  assert.ok(plan.targetGitSha);

  // Execute verification against the 8 release safety checkpoints
  const verification = verifyPostRollbackState({
    expectedGitSha: plan.targetGitSha,
    actualGitSha: plan.targetGitSha,
    manifestHashMatched: true,
    typecheckErrors: 0,
    quotationSmokePassed: true,
    apiHealthOk: true,
    runtimeSafetyActive: true,
    telemetryActive: true,
    v1FilesModified: false,
  });

  assert.equal(verification.passed, true);
  assert.equal(verification.passedChecks, 8);
  assert.equal(verification.checks.length, 8);
}

export function assertGate747ActiveJobConcurrencyCap(): void {
  const sampleJobs: Array<{ status: JobOperationalStatus }> = [
    { status: "PENDING_DISPATCH" },
    { status: "ASSIGNED" },
    { status: "DISPATCHED" },
    { status: "DELIVERED" },
    { status: "IN_PROGRESS" },
    { status: "IN_PROGRESS" },
    { status: "MATERIAL_SHORTAGE" },
    { status: "PARTIALLY_COMPLETED" },
  ];

  assert.equal(countActiveOperationalJobs(sampleJobs), 8);
  const status8 = checkPilotOperationalCapacity(8);
  assert.equal(status8.canAcceptNewJob, true);

  // Add 2 more active jobs to hit cap (10)
  sampleJobs.push({ status: "IN_PROGRESS" });
  sampleJobs.push({ status: "ASSIGNED" });
  assert.equal(countActiveOperationalJobs(sampleJobs), 10);
  const status10 = checkPilotOperationalCapacity(10);
  assert.equal(status10.canAcceptNewJob, false);
  assert.ok(status10.reason?.includes("cap"));

  // Add completed jobs (do NOT count towards active cap)
  sampleJobs.push({ status: "COMPLETED" });
  sampleJobs.push({ status: "CANCELLED" });
  assert.equal(countActiveOperationalJobs(sampleJobs), 10, "Completed/Cancelled jobs must not count towards active cap");
}
