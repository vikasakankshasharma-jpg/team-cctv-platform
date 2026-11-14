/**
 * @file lib/release/release-identity.ts
 * @description Phase 6.3.1 Release Identity Contract & Invariants.
 * Defines the strict, decoupled release identity types and invariants for the TEAM CCTV Platform.
 *
 * CRITICAL INVARIANTS:
 * 1. Certification Identity != Deployment Identity.
 *    The certification baseline "TEAM-CCTV-CERT-V1" is immutable and must NEVER be moved
 *    or used as a mutable deployment tag.
 * 2. Standard Deployment Version Format:
 *    ^(prod|staging|test|dev)-\d{8}-[a-f0-9]{7,12}$
 * 3. Zero Secrets:
 *    Release metadata strictly excludes credentials, private keys, API secrets, and PII.
 */

import {
  PRICING_ENGINE_VERSION,
  PRICING_POLICY_VERSION,
  CERTIFICATION_VERSION,
} from "../observability/telemetry-types";

export { PRICING_ENGINE_VERSION, PRICING_POLICY_VERSION, CERTIFICATION_VERSION };

export const CERTIFICATION_TAG = "TEAM-CCTV-CERT-V1" as const;
export const CERTIFIED_BASELINE_COMMIT = "c34cbb1" as const;
export const MANIFEST_FROZEN_COMMIT = "a58f4c3" as const;

export type ReleaseEnvironment = "production" | "staging" | "test" | "development";

export interface ReleaseProvenance {
  isCertifiedBaseline: boolean;
  certifiedBaselineTag: string;
  certifiedBaselineCommit: string;
  manifestFrozenCommit: string;
  decouplingEnforced: boolean;
}

/**
 * Canonical Release Identity Contract.
 * Represents an immutable, auditable deployment artifact identity.
 */
export interface ReleaseIdentityContract {
  deploymentVersion: string;
  gitSha: string;
  gitShortSha: string;
  certificationVersion: string;
  pricingEngineVersion: string;
  pricingPolicyVersion: string;
  catalogSnapshotHash: string;
  certificationManifestHash: string;
  deployedAt: string;
  environment: ReleaseEnvironment;
  provenance: ReleaseProvenance;
}

export interface ReleaseValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Standard Deployment Version Regex:
 * Prefix (prod|staging|test|dev) + "-" + YYYYMMDD + "-" + 7-12 hex characters.
 * Example: prod-20261114-fbc4686
 */
export const DEPLOYMENT_VERSION_REGEX = /^(prod|staging|test|dev)-\d{8}-[a-f0-9]{7,12}$/;

/**
 * Formats a deterministic deployment version string from Git SHA, Date, and Environment.
 */
export function formatDeploymentVersion(
  gitSha: string,
  date: Date = new Date(),
  env: ReleaseEnvironment = "production"
): string {
  const cleanSha = String(gitSha || "").trim().toLowerCase();
  const shortSha = cleanSha.length >= 7 ? cleanSha.slice(0, 7) : "0000000";

  const prefix =
    env === "production"
      ? "prod"
      : env === "staging"
      ? "staging"
      : env === "test"
      ? "test"
      : "dev";

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}${mm}${dd}`;

  return `${prefix}-${dateStr}-${shortSha}`;
}

/**
 * Validates whether a version string matches standard deployment version format.
 */
export function validateDeploymentVersionFormat(version: string): boolean {
  if (!version || typeof version !== "string") return false;
  return DEPLOYMENT_VERSION_REGEX.test(version.trim());
}

/**
 * Parses a deployment version string into its constituent parts.
 */
export function parseDeploymentVersion(version: string): {
  env: ReleaseEnvironment;
  dateStr: string;
  shortSha: string;
} | null {
  if (!validateDeploymentVersionFormat(version)) return null;
  const parts = version.trim().split("-");
  const envMap: Record<string, ReleaseEnvironment> = {
    prod: "production",
    staging: "staging",
    test: "test",
    dev: "development",
  };
  return {
    env: envMap[parts[0]] || "production",
    dateStr: parts[1],
    shortSha: parts[2],
  };
}

/**
 * Enforces architectural decoupling between Deployment Version and Certification Baseline.
 * Throws an Error if decoupling is violated.
 */
export function assertDecoupledIdentities(
  deploymentVersion: string,
  certificationVersion: string = CERTIFICATION_VERSION
): void {
  if (!deploymentVersion || typeof deploymentVersion !== "string") {
    throw new Error("Release Safety Error: deploymentVersion must be a non-empty string");
  }

  // Invariant 6.3.3: Certification tag != Deployment tag
  if (deploymentVersion.trim() === certificationVersion.trim()) {
    throw new Error(
      `Release Safety Violation: Deployment version (${deploymentVersion}) must NOT equal ` +
        `Certification baseline version (${certificationVersion}). ` +
        `Certification baseline is immutable and cannot be moved or redeployed as a release tag.`
    );
  }

  if (!validateDeploymentVersionFormat(deploymentVersion)) {
    throw new Error(
      `Release Safety Violation: Deployment version "${deploymentVersion}" does not conform ` +
        `to standard format ^(prod|staging|test|dev)-\\d{8}-[a-f0-9]{7,12}$ (e.g. prod-20261114-fbc4686)`
    );
  }

  if (certificationVersion !== CERTIFICATION_VERSION) {
    throw new Error(
      `Release Safety Violation: Certification version "${certificationVersion}" does not match ` +
        `the immutable baseline "${CERTIFICATION_VERSION}".`
    );
  }
}

/**
 * Strict Zero Secrets Invariant (6.3.12):
 * Scans metadata keys and values recursively. Blocks any credentials, private keys, or API tokens.
 */
const SENSITIVE_KEY_REGEX =
  /(private_key|client_email|cashfree_secret|razorpay_key_secret|secret_key|api_key|service_account|password|auth_token)/i;

const SENSITIVE_VALUE_REGEX =
  /(BEGIN\s+(RSA\s+)?PRIVATE\s+KEY|Bearer\s+[a-zA-Z0-9_\-\.]+|sk_[a-zA-Z0-9_]{16,}|cfsk_[a-zA-Z0-9_]{16,})/i;

export function assertZeroSecrets(data: Record<string, unknown>, path: string = "root"): void {
  if (!data || typeof data !== "object") return;

  for (const [key, value] of Object.entries(data)) {
    const currentPath = `${path}.${key}`;

    if (SENSITIVE_KEY_REGEX.test(key)) {
      throw new Error(
        `Release Safety Violation: Sensitive secret key "${key}" detected at ${currentPath}. ` +
          `Release metadata must strictly exclude all credentials.`
      );
    }

    if (typeof value === "string") {
      if (SENSITIVE_VALUE_REGEX.test(value)) {
        throw new Error(
          `Release Safety Violation: Sensitive credential pattern detected at ${currentPath}. ` +
            `Release metadata must strictly exclude all private keys and tokens.`
        );
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      assertZeroSecrets(value as Record<string, unknown>, currentPath);
    }
  }
}
