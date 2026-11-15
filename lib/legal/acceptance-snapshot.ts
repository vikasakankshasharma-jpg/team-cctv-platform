/**
 * @file lib/legal/acceptance-snapshot.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Immutable Legal Acceptance Snapshot Service.
 * Produces cryptographically bound, immutable legal evidence snapshots for commercial orders
 * and partner onboardings.
 */

import { createHash } from "node:crypto";
import type {
  AcceptanceMethod,
  LegalAcceptanceSnapshot,
  PartyRole,
  SourceContext,
} from "./legal-types";
import { getAgreement } from "./agreement-registry";
import { LegalStateError } from "./legal-errors";

export interface CreateLegalSnapshotParams {
  partyId: string;
  partyRole: PartyRole;
  agreementId: string;
  version?: string;
  acceptanceMethod: AcceptanceMethod;
  sourceContext: SourceContext;
  quoteId?: string;
  orderId?: string;
  jobId?: string;
  rawIpAddress?: string;
  rawUserAgent?: string;
  documentContent?: string;
  acceptedAt?: string;
}

/**
 * Creates an immutable, cryptographically verifiable Legal Acceptance Snapshot.
 */
export function createLegalAcceptanceSnapshot(
  params: CreateLegalSnapshotParams
): Readonly<LegalAcceptanceSnapshot> {
  const agreement = getAgreement(params.agreementId);
  if (!agreement) {
    throw new LegalStateError(
      `Agreement ID "${params.agreementId}" is not registered in the canonical registry`,
      "UNKNOWN_AGREEMENT"
    );
  }

  const version = params.version || agreement.currentVersion;
  const acceptedAt = params.acceptedAt || new Date().toISOString();

  // Privacy-preserving hash of network/device metadata (No raw IP stored)
  const ipAddressHash = params.rawIpAddress
    ? createHash("sha256").update(params.rawIpAddress.trim()).digest("hex")
    : undefined;

  const userAgentHash = params.rawUserAgent
    ? createHash("sha256").update(params.rawUserAgent.trim()).digest("hex")
    : undefined;

  const documentHash = params.documentContent
    ? createHash("sha256").update(params.documentContent).digest("hex")
    : undefined;

  // Canonical terms snapshot fingerprint
  const termsPayload = JSON.stringify({
    agreementId: agreement.agreementId,
    agreementType: agreement.agreementType,
    version,
    role: agreement.role,
    partyId: params.partyId,
    acceptedAt,
    documentHash,
  });
  const termsSnapshotHash = createHash("sha256").update(termsPayload).digest("hex");

  // Deterministic Unique ID: LA-YYYYMMDD-HEX6
  const dateStr = acceptedAt.slice(0, 10).replace(/-/g, "");
  const hashPrefix = termsSnapshotHash.slice(0, 6).toUpperCase();
  const acceptanceId = `LA-${dateStr}-${hashPrefix}`;

  const snapshot: LegalAcceptanceSnapshot = {
    acceptanceId,
    partyId: params.partyId,
    partyRole: params.partyRole,
    agreementId: agreement.agreementId,
    agreementType: agreement.agreementType,
    version,
    acceptedAt,
    acceptanceMethod: params.acceptanceMethod,
    acceptanceStatus: "ACCEPTED",
    sourceContext: params.sourceContext,
    quoteId: params.quoteId,
    orderId: params.orderId,
    jobId: params.jobId,
    documentHash,
    ipAddressHash,
    userAgentHash,
    termsSnapshotHash,
    createdAt: acceptedAt,
  };

  return Object.freeze(snapshot);
}

/**
 * Verifies the integrity of a Legal Acceptance Snapshot.
 */
export function verifyLegalAcceptanceSnapshot(snapshot: LegalAcceptanceSnapshot): boolean {
  if (!snapshot.acceptanceId || !snapshot.termsSnapshotHash) return false;

  const expectedPayload = JSON.stringify({
    agreementId: snapshot.agreementId,
    agreementType: snapshot.agreementType,
    version: snapshot.version,
    role: snapshot.partyRole,
    partyId: snapshot.partyId,
    acceptedAt: snapshot.acceptedAt,
    documentHash: snapshot.documentHash,
  });

  const expectedHash = createHash("sha256").update(expectedPayload).digest("hex");
  return expectedHash === snapshot.termsSnapshotHash;
}
