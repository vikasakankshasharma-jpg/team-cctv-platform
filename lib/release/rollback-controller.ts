/**
 * @file lib/release/rollback-controller.ts
 * @description Phase 6.3.3 Deterministic Rollback Controller & Post-Rollback Validator.
 * Implements safe, auditable deployment rollback planning and verification.
 *
 * CRITICAL INVARIANT:
 * Rollback is a DEPLOYMENT SELECTION CHANGE, not a certification mutation.
 * An emergency rollback must never regenerate manifests, patch oracles,
 * replace snapshots, or mutate V1 business rules.
 */

import {
  CERTIFICATION_VERSION,
  CERTIFIED_BASELINE_COMMIT,
  MANIFEST_FROZEN_COMMIT,
  formatDeploymentVersion,
  validateDeploymentVersionFormat,
  type ReleaseEnvironment,
} from "./release-identity";

export type RollbackTargetType = "PREVIOUS_KNOWN_GOOD" | "CERTIFIED_BASELINE";

export interface RollbackRequest {
  currentDeploymentVersion: string;
  targetType: RollbackTargetType;
  targetGitSha?: string;
  targetDate?: Date;
  environment?: ReleaseEnvironment;
  reason: string;
  approvedBy: string;
}

export interface RollbackPlan {
  currentDeploymentVersion: string;
  targetDeploymentVersion: string;
  targetGitSha: string;
  targetType: RollbackTargetType;
  isCertifiedBaseline: boolean;
  certificationVersion: string;
  reason: string;
  approvedBy: string;
  plannedAt: string;
  executionCommands: string[];
  verificationChecklist: string[];
}

export interface RollbackCheckItem {
  name: string;
  passed: boolean;
  message: string;
}

export interface PostRollbackVerificationResult {
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: RollbackCheckItem[];
}

/**
 * Plans a deterministic deployment rollback.
 */
export function planRollback(request: RollbackRequest): RollbackPlan {
  if (!request.currentDeploymentVersion) {
    throw new Error("Rollback Error: currentDeploymentVersion is required");
  }
  if (!request.reason || request.reason.trim().length === 0) {
    throw new Error("Rollback Error: Audit reason is required for any deployment rollback");
  }
  if (!request.approvedBy || request.approvedBy.trim().length === 0) {
    throw new Error("Rollback Error: approvedBy author/lead is required for any deployment rollback");
  }

  let targetSha: string;
  let isBaseline = false;

  if (request.targetType === "CERTIFIED_BASELINE") {
    targetSha = CERTIFIED_BASELINE_COMMIT;
    isBaseline = true;
  } else {
    if (!request.targetGitSha || request.targetGitSha.trim().length < 7) {
      throw new Error(
        "Rollback Error: targetGitSha (min 7 hex characters) is required for PREVIOUS_KNOWN_GOOD rollback"
      );
    }
    targetSha = request.targetGitSha.trim().toLowerCase();
    isBaseline =
      targetSha === CERTIFIED_BASELINE_COMMIT ||
      targetSha === MANIFEST_FROZEN_COMMIT ||
      targetSha.startsWith(CERTIFIED_BASELINE_COMMIT) ||
      targetSha.startsWith(MANIFEST_FROZEN_COMMIT);
  }

  const env = request.environment || "production";
  const date = request.targetDate || new Date();
  const targetDeploymentVersion = formatDeploymentVersion(targetSha, date, env);

  const executionCommands = [
    `# 1. Fetch tags and target commit`,
    `git fetch origin --tags`,
    `# 2. Checkout target immutable SHA without branch tracking mutations`,
    `git checkout ${targetSha}`,
    `# 3. Verify clean manifest without re-generating V1`,
    `npm run cert:manifest:verify`,
    `# 4. Run certification regression`,
    `npm run cert:regression`,
    `# 5. Build production bundle`,
    `npm run build`,
    `# 6. Deploy artifact stamped with ${targetDeploymentVersion}`,
  ];

  const verificationChecklist = [
    "[CHECK 1] Git SHA matches intended release target",
    "[CHECK 2] Certification manifest verified (Tamper Guard)",
    "[CHECK 3] Production TypeScript clean (0 errors)",
    "[CHECK 4] Critical quotation calculation smoke test PASS",
    "[CHECK 5] API quotation generation (/api/quotes) returns 200",
    "[CHECK 6] Runtime safety boundary active (no NaN, zero [object Object])",
    "[CHECK 7] Request ID & Telemetry emission active",
    "[CHECK 8] V1 certification baseline files strictly untouched",
  ];

  return {
    currentDeploymentVersion: request.currentDeploymentVersion,
    targetDeploymentVersion,
    targetGitSha: targetSha,
    targetType: request.targetType,
    isCertifiedBaseline: isBaseline,
    certificationVersion: CERTIFICATION_VERSION,
    reason: request.reason,
    approvedBy: request.approvedBy,
    plannedAt: date.toISOString(),
    executionCommands,
    verificationChecklist,
  };
}

/**
 * Validates post-rollback runtime state against the 8 release safety checkpoints.
 */
export function verifyPostRollbackState(params: {
  expectedGitSha: string;
  actualGitSha: string;
  manifestHashMatched: boolean;
  typecheckErrors: number;
  quotationSmokePassed: boolean;
  apiHealthOk: boolean;
  runtimeSafetyActive: boolean;
  telemetryActive: boolean;
  v1FilesModified: boolean;
}): PostRollbackVerificationResult {
  const checks: RollbackCheckItem[] = [];

  // Check 1: Git SHA matches intended release
  const shaMatches =
    params.actualGitSha.toLowerCase().startsWith(params.expectedGitSha.toLowerCase()) ||
    params.expectedGitSha.toLowerCase().startsWith(params.actualGitSha.toLowerCase());
  checks.push({
    name: "Git SHA Match",
    passed: shaMatches,
    message: shaMatches
      ? `Active Git SHA (${params.actualGitSha.slice(0, 7)}) matches expected target (${params.expectedGitSha.slice(0, 7)})`
      : `Active Git SHA (${params.actualGitSha}) does not match expected target (${params.expectedGitSha})`,
  });

  // Check 2: Manifest Hash Matched
  checks.push({
    name: "Certification Manifest Integrity",
    passed: params.manifestHashMatched,
    message: params.manifestHashMatched
      ? "Manifest self-integrity hash strictly verified"
      : "Manifest verification failed or was tampered",
  });

  // Check 3: Production TypeScript
  checks.push({
    name: "TypeScript Compilation",
    passed: params.typecheckErrors === 0,
    message:
      params.typecheckErrors === 0
        ? "TypeScript compiled cleanly with 0 errors"
        : `TypeScript compilation failed with ${params.typecheckErrors} errors`,
  });

  // Check 4: Quotation Smoke
  checks.push({
    name: "Quotation Engine Smoke Test",
    passed: params.quotationSmokePassed,
    message: params.quotationSmokePassed
      ? "Quotation calculation smoke test executed and matched expected totals"
      : "Quotation calculation smoke test failed or drifted",
  });

  // Check 5: API Health
  checks.push({
    name: "API Quotations Route Health",
    passed: params.apiHealthOk,
    message: params.apiHealthOk
      ? "/api/quotes responded successfully with valid QuoteDelivery"
      : "/api/quotes endpoint failed or timed out",
  });

  // Check 6: Runtime Safety Boundary
  checks.push({
    name: "Runtime Safety Boundary Active",
    passed: params.runtimeSafetyActive,
    message: params.runtimeSafetyActive
      ? "validateMoneyIntegrity and error masking active; zero [object Object]"
      : "Runtime safety boundary is inactive",
  });

  // Check 7: Telemetry Emission
  checks.push({
    name: "Calculation Telemetry Active",
    passed: params.telemetryActive,
    message: params.telemetryActive
      ? "Telemetry event emission and deterministic fingerprinting active"
      : "Telemetry event bus failed to emit",
  });

  // Check 8: V1 Files Untouched
  checks.push({
    name: "V1 Certification Baseline Immutability",
    passed: !params.v1FilesModified,
    message: !params.v1FilesModified
      ? "V1 manifest, fixtures, oracle, and schema remain 100% frozen and unmodified"
      : "VIOLATION: V1 certification baseline files were mutated during rollback",
  });

  const passedChecks = checks.filter((c) => c.passed).length;
  const failedChecks = checks.filter((c) => !c.passed).length;

  return {
    passed: failedChecks === 0,
    totalChecks: checks.length,
    passedChecks,
    failedChecks,
    checks,
  };
}
