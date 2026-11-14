/**
 * @file tests/certification/release-safety/release-identity.test.ts
 * @description Phase 6.3.1 Release Identity & Provenance Test Suite.
 * Validates deployment decoupling, release identity contracts, zero-secrets invariant,
 * and deterministic provenance binding to TEAM-CCTV-CERT-V1.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  CERTIFICATION_VERSION,
  PRICING_ENGINE_VERSION,
  PRICING_POLICY_VERSION,
  CERTIFICATION_TAG,
  CERTIFIED_BASELINE_COMMIT,
  MANIFEST_FROZEN_COMMIT,
  formatDeploymentVersion,
  validateDeploymentVersionFormat,
  parseDeploymentVersion,
  assertDecoupledIdentities,
  assertZeroSecrets,
} from "../../../lib/release/release-identity";
import {
  buildReleaseMetadata,
  verifyReleaseProvenance,
  loadFrozenManifestMetadata,
} from "../../../lib/release/release-metadata";
import { computeCalculationFingerprint } from "../../../lib/observability/calculation-fingerprint";

test("Phase 6.3.1 — Release Identity Contract & Invariants", async (t) => {
  await t.test("1. Deployment version standard format and parsing", () => {
    const fixedDate = new Date("2026-11-14T08:00:00.000Z");
    const testSha = "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc";

    const prodVer = formatDeploymentVersion(testSha, fixedDate, "production");
    assert.equal(prodVer, "prod-20261114-fbc4686");
    assert.equal(validateDeploymentVersionFormat(prodVer), true);

    const stagingVer = formatDeploymentVersion(testSha, fixedDate, "staging");
    assert.equal(stagingVer, "staging-20261114-fbc4686");
    assert.equal(validateDeploymentVersionFormat(stagingVer), true);

    const parsed = parseDeploymentVersion(prodVer);
    assert.deepEqual(parsed, {
      env: "production",
      dateStr: "20261114",
      shortSha: "fbc4686",
    });

    // Malformed formats must be rejected
    assert.equal(validateDeploymentVersionFormat("v1.0.0"), false);
    assert.equal(validateDeploymentVersionFormat("latest"), false);
    assert.equal(validateDeploymentVersionFormat("prod-2026-11-14-fbc4686"), false);
    assert.equal(validateDeploymentVersionFormat("TEAM-CCTV-CERT-V1"), false);
  });

  await t.test("2. Invariant 6.3.3: Strict Decoupling — Certification Tag != Deployment Tag", () => {
    // Attempting to use the certification baseline as a deployment version must throw
    assert.throws(
      () => assertDecoupledIdentities("TEAM-CCTV-CERT-V1", "TEAM-CCTV-CERT-V1"),
      /must NOT equal Certification baseline version/
    );

    // Arbitrary unformatted release tag must throw
    assert.throws(
      () => assertDecoupledIdentities("release-v1.0", "TEAM-CCTV-CERT-V1"),
      /does not conform to standard format/
    );

    // Tampered certification version must throw
    assert.throws(
      () => assertDecoupledIdentities("prod-20261114-fbc4686", "TEAM-CCTV-CERT-V2-FAKE"),
      /does not match the immutable baseline/
    );

    // Valid decoupled pair passes cleanly
    assert.doesNotThrow(() =>
      assertDecoupledIdentities("prod-20261114-fbc4686", "TEAM-CCTV-CERT-V1")
    );
  });

  await t.test("3. Invariant 6.3.12: Strict Zero Secrets Assertion", () => {
    // Clean metadata passes
    const cleanMeta = {
      deploymentVersion: "prod-20261114-fbc4686",
      gitSha: "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc",
      environment: "production",
    };
    assert.doesNotThrow(() => assertZeroSecrets(cleanMeta));

    // Secret keys must be blocked
    assert.throws(
      () => assertZeroSecrets({ ...cleanMeta, private_key: "-----BEGIN RSA PRIVATE KEY-----" }),
      /Sensitive secret key "private_key" detected/
    );
    assert.throws(
      () => assertZeroSecrets({ ...cleanMeta, cashfree_secret: "cfsk_live_1234567890abcdef" }),
      /Sensitive secret key "cashfree_secret" detected/
    );
    assert.throws(
      () => assertZeroSecrets({ ...cleanMeta, razorpay_key_secret: "secret_123" }),
      /Sensitive secret key "razorpay_key_secret" detected/
    );

    // Nested secrets must also be detected and blocked
    assert.throws(
      () =>
        assertZeroSecrets({
          deploymentVersion: "prod-20261114-fbc4686",
          nested: {
            auth: {
              api_key: "ai_1234567890",
            },
          },
        }),
      /Sensitive secret key "api_key" detected/
    );

    // Secret values in strings must be blocked even if key name is innocent
    assert.throws(
      () =>
        assertZeroSecrets({
          deploymentVersion: "prod-20261114-fbc4686",
          configNote: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.sig",
        }),
      /Sensitive credential pattern detected/
    );
  });

  await t.test("4. Release Metadata construction captures frozen V1 baseline and git provenance", () => {
    const fixedDate = new Date("2026-11-14T08:00:00.000Z");
    const testSha = "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc";

    const metadata = buildReleaseMetadata({
      gitSha: testSha,
      date: fixedDate,
      env: "production",
    });

    assert.equal(metadata.deploymentVersion, "prod-20261114-fbc4686");
    assert.equal(metadata.gitSha, testSha);
    assert.equal(metadata.gitShortSha, "fbc4686");
    assert.equal(metadata.certificationVersion, CERTIFICATION_VERSION);
    assert.equal(metadata.pricingEngineVersion, PRICING_ENGINE_VERSION);
    assert.equal(metadata.pricingPolicyVersion, PRICING_POLICY_VERSION);
    assert.equal(metadata.environment, "production");
    assert.equal(metadata.deployedAt, fixedDate.toISOString());

    // Hashes must match frozen manifest values
    const frozen = loadFrozenManifestMetadata();
    assert.equal(metadata.certificationManifestHash, frozen.manifestHash);
    assert.equal(metadata.catalogSnapshotHash, frozen.catalogSnapshotHash);
    assert.equal(metadata.provenance.certifiedBaselineTag, CERTIFICATION_TAG);
    assert.equal(metadata.provenance.certifiedBaselineCommit, CERTIFIED_BASELINE_COMMIT);
    assert.equal(metadata.provenance.manifestFrozenCommit, MANIFEST_FROZEN_COMMIT);
    assert.equal(metadata.provenance.decouplingEnforced, true);
  });

  await t.test("5. Release Provenance Verifier approves valid metadata and rejects tampering", () => {
    const metadata = buildReleaseMetadata({
      gitSha: "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc",
      env: "production",
    });

    const frozen = loadFrozenManifestMetadata();
    const result = verifyReleaseProvenance(metadata, frozen.manifestHash);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);

    // Tampered manifest hash
    const tamperedManifest = {
      ...metadata,
      certificationManifestHash: "0000000000000000000000000000000000000000000000000000000000000000",
    };
    const tamperedResult = verifyReleaseProvenance(tamperedManifest, frozen.manifestHash);
    assert.equal(tamperedResult.valid, false);
    assert.match(tamperedResult.errors[0], /Manifest hash mismatch/);

    // Mutated certification version
    const wrongCert = {
      ...metadata,
      certificationVersion: "UNOFFICIAL-V2",
    };
    const wrongCertResult = verifyReleaseProvenance(wrongCert);
    assert.equal(wrongCertResult.valid, false);
    assert.match(wrongCertResult.errors[0], /does not match certified baseline/);
  });

  await t.test("6. End-to-End Auditability: Release Metadata binds directly to Calculation Fingerprint", () => {
    const metadata = buildReleaseMetadata({
      gitSha: "fbc4686a7a11e829c1ce321aa47d22eb3cd21dbc",
      env: "production",
    });

    // Customer requirement
    const req = {
      camera_count: 4,
      outdoor_camera_count: 2,
      indoor_camera_count: 2,
      technology: "HD",
      resolution: "2MP",
      brand: "CP PLUS",
      storage_retention_days: 15,
      property_type: "home",
    };

    // Compute fingerprint using the release metadata's declared engine, policy, and catalog hash
    const fingerprint = computeCalculationFingerprint({
      requirement: req,
      engineVersion: metadata.pricingEngineVersion,
      catalogSnapshotHash: metadata.catalogSnapshotHash,
      pricingPolicyVersion: metadata.pricingPolicyVersion,
    });

    assert.equal(typeof fingerprint, "string");
    assert.equal(fingerprint.length, 64);

    // Exact deterministic recalculation
    const fingerprint2 = computeCalculationFingerprint({
      requirement: req,
      engineVersion: PRICING_ENGINE_VERSION,
      catalogSnapshotHash: metadata.catalogSnapshotHash,
      pricingPolicyVersion: PRICING_POLICY_VERSION,
    });

    assert.equal(fingerprint, fingerprint2);
  });
});
