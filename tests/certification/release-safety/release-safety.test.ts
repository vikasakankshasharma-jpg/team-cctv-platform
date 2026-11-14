/**
 * @file tests/certification/release-safety/release-safety.test.ts
 * @description Phase 6.3 Release Safety Integration Test Suite.
 * Validates deployment pipeline gates, rollback determinism, post-rollback verification,
 * and immutable V1 certification preservation.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  CERTIFICATION_VERSION,
  CERTIFIED_BASELINE_COMMIT,
  MANIFEST_FROZEN_COMMIT,
  formatDeploymentVersion,
  validateDeploymentVersionFormat,
} from "../../../lib/release/release-identity";
import {
  buildReleaseMetadata,
  verifyReleaseProvenance,
  getRuntimeReleaseMetadata,
  loadFrozenManifestMetadata,
} from "../../../lib/release/release-metadata";
import {
  planRollback,
  verifyPostRollbackState,
} from "../../../lib/release/rollback-controller";

test("Phase 6.3 — Release Safety & Deployment Gates", async (t) => {
  await t.test("1. Deployment pipeline gate contract: certification must precede build", () => {
    // Simulating deployment gate sequence:
    // Manifest Verify -> Certification Regression -> Build -> Deploy
    const manifestMeta = loadFrozenManifestMetadata();
    assert.equal(typeof manifestMeta.manifestHash, "string");
    assert.equal(manifestMeta.manifestHash.length, 64);

    // Any corrupted manifest blocks the release pipeline before build
    const tamperedManifestResult = verifyReleaseProvenance({
      deploymentVersion: "prod-20261114-fbc4686",
      gitSha: "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc",
      gitShortSha: "fbc4686",
      certificationVersion: CERTIFICATION_VERSION,
      pricingEngineVersion: "pricing-engine-1.0.0",
      pricingPolicyVersion: "TEAM-CCTV-PRICING-POLICY-V1",
      catalogSnapshotHash: manifestMeta.catalogSnapshotHash,
      certificationManifestHash: "corrupted_manifest_hash_0000000000000000000000000000000000000000",
      deployedAt: new Date().toISOString(),
      environment: "production",
      provenance: {
        isCertifiedBaseline: false,
        certifiedBaselineTag: "TEAM-CCTV-CERT-V1",
        certifiedBaselineCommit: CERTIFIED_BASELINE_COMMIT,
        manifestFrozenCommit: MANIFEST_FROZEN_COMMIT,
        decouplingEnforced: true,
      },
    }, manifestMeta.manifestHash);

    assert.equal(tamperedManifestResult.valid, false);
    assert.match(tamperedManifestResult.errors[0], /Manifest hash mismatch/);
  });

  await t.test("2. Rollback Planner: Certified Baseline Target resolves deterministically", () => {
    const plan = planRollback({
      currentDeploymentVersion: "prod-20261114-fbc4686",
      targetType: "CERTIFIED_BASELINE",
      reason: "Emergency recovery from pricing anomaly",
      approvedBy: "Engineering Lead",
      targetDate: new Date("2026-11-14T08:30:00.000Z"),
    });

    assert.equal(plan.targetType, "CERTIFIED_BASELINE");
    assert.equal(plan.targetGitSha, CERTIFIED_BASELINE_COMMIT);
    assert.equal(plan.isCertifiedBaseline, true);
    assert.equal(plan.targetDeploymentVersion, "prod-20261114-c34cbb1");
    assert.equal(plan.certificationVersion, CERTIFICATION_VERSION);

    // Verify non-destructive execution commands
    assert.ok(plan.executionCommands.some((cmd) => cmd.includes(`git checkout ${CERTIFIED_BASELINE_COMMIT}`)));
    assert.ok(plan.executionCommands.some((cmd) => cmd.includes("npm run cert:manifest:verify")));
    assert.ok(plan.executionCommands.some((cmd) => cmd.includes("npm run cert:regression")));
    assert.ok(plan.executionCommands.some((cmd) => cmd.includes("npm run build")));
  });

  await t.test("3. Rollback Planner: Previous Known-Good Target resolves correctly", () => {
    const knownGoodSha = "59c322ba63f0d5718a3832c32bb44e0586e9273c";
    const plan = planRollback({
      currentDeploymentVersion: "prod-20261114-fbc4686",
      targetType: "PREVIOUS_KNOWN_GOOD",
      targetGitSha: knownGoodSha,
      reason: "Infrastructure timeout on edge route",
      approvedBy: "DevOps Lead",
      targetDate: new Date("2026-11-14T08:30:00.000Z"),
    });

    assert.equal(plan.targetType, "PREVIOUS_KNOWN_GOOD");
    assert.equal(plan.targetGitSha, knownGoodSha);
    assert.equal(plan.targetDeploymentVersion, "prod-20261114-59c322b");
    assert.equal(plan.isCertifiedBaseline, false);
  });

  await t.test("4. Rollback Planner: Requires audit reason and approval author", () => {
    assert.throws(
      () =>
        planRollback({
          currentDeploymentVersion: "prod-20261114-fbc4686",
          targetType: "CERTIFIED_BASELINE",
          reason: "",
          approvedBy: "Lead",
        }),
      /Audit reason is required/
    );

    assert.throws(
      () =>
        planRollback({
          currentDeploymentVersion: "prod-20261114-fbc4686",
          targetType: "CERTIFIED_BASELINE",
          reason: "Testing",
          approvedBy: "",
        }),
      /approvedBy author\/lead is required/
    );
  });

  await t.test("5. Post-Rollback Verification: All 8 checkpoints succeed on valid state", () => {
    const result = verifyPostRollbackState({
      expectedGitSha: "c34cbb1c93f66fa2341b3cb49b3cdb33d9080026",
      actualGitSha: "c34cbb1c93f66fa2341b3cb49b3cdb33d9080026",
      manifestHashMatched: true,
      typecheckErrors: 0,
      quotationSmokePassed: true,
      apiHealthOk: true,
      runtimeSafetyActive: true,
      telemetryActive: true,
      v1FilesModified: false,
    });

    assert.equal(result.passed, true);
    assert.equal(result.totalChecks, 8);
    assert.equal(result.passedChecks, 8);
    assert.equal(result.failedChecks, 0);
  });

  await t.test("6. Post-Rollback Verification: Catches SHA mismatch and V1 mutation violations", () => {
    // SHA Mismatch
    const shaFail = verifyPostRollbackState({
      expectedGitSha: "c34cbb1",
      actualGitSha: "fbc4686",
      manifestHashMatched: true,
      typecheckErrors: 0,
      quotationSmokePassed: true,
      apiHealthOk: true,
      runtimeSafetyActive: true,
      telemetryActive: true,
      v1FilesModified: false,
    });
    assert.equal(shaFail.passed, false);
    assert.equal(shaFail.checks.find((c) => c.name === "Git SHA Match")?.passed, false);

    // Critical Invariant: V1 Mutation during rollback must fail Check 8
    const v1Mutated = verifyPostRollbackState({
      expectedGitSha: "c34cbb1",
      actualGitSha: "c34cbb1",
      manifestHashMatched: true,
      typecheckErrors: 0,
      quotationSmokePassed: true,
      apiHealthOk: true,
      runtimeSafetyActive: true,
      telemetryActive: true,
      v1FilesModified: true, // Emergency rollback attempted to mutate V1
    });
    assert.equal(v1Mutated.passed, false);
    const check8 = v1Mutated.checks.find((c) => c.name === "V1 Certification Baseline Immutability");
    assert.equal(check8?.passed, false);
    assert.match(check8!.message, /VIOLATION: V1 certification baseline files were mutated/);
  });

  await t.test("7. Runtime Release Metadata singleton adheres to zero secrets and clean provenance", () => {
    const runtimeMeta = getRuntimeReleaseMetadata();
    assert.ok(runtimeMeta);
    assert.equal(runtimeMeta.certificationVersion, CERTIFICATION_VERSION);
    assert.equal(typeof runtimeMeta.gitSha, "string");
    assert.equal(typeof runtimeMeta.deploymentVersion, "string");
    assert.equal(validateDeploymentVersionFormat(runtimeMeta.deploymentVersion), true);

    const validation = verifyReleaseProvenance(runtimeMeta);
    assert.equal(validation.valid, true);
    assert.equal(validation.errors.length, 0);
  });
});
