/**
 * @file lib/legal/legal-types.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Contract Governance & Legal Acceptance Type System.
 * Implements role-to-agreement mapping, contract lifecycles, and immutable legal acceptance evidence.
 */

export type PartyRole =
  | "CUSTOMER"
  | "INSTALLER"
  | "PROMOTER"
  | "DELIVERY_PARTNER"
  | "SUPPLIER";

export type AgreementLifecycleState =
  | "DRAFT"
  | "PENDING_ACCEPTANCE"
  | "ACCEPTED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "TERMINATED";

export type AcceptanceMethod =
  | "CHECKBOX"
  | "OTP"
  | "E_SIGNATURE"
  | "ONBOARDING_CONFIRMATION"
  | "ADMIN_RECORDED";

export type SourceContext =
  | "CUSTOMER_BOOKING"
  | "CUSTOMER_QUOTE"
  | "INSTALLER_ONBOARDING"
  | "PROMOTER_ONBOARDING"
  | "DELIVERY_ONBOARDING"
  | "SUPPLIER_ONBOARDING";

export type ChangeClassification = "MATERIAL" | "NON_MATERIAL";

export interface AgreementRegistryEntry {
  agreementId: string;
  agreementType: string;
  role: PartyRole;
  currentVersion: string;
  status: AgreementLifecycleState;
  effectiveFrom: string;
  title: string;
  isMandatory: boolean;
  changeClassification?: ChangeClassification;
}

export interface LegalAcceptanceSnapshot {
  acceptanceId: string;
  partyId: string;
  partyRole: PartyRole;
  agreementId: string;
  agreementType: string;
  version: string;
  acceptedAt: string;
  acceptanceMethod: AcceptanceMethod;
  acceptanceStatus: "ACCEPTED" | "REVOKED" | "SUPERSEDED";
  sourceContext: SourceContext;
  quoteId?: string;
  orderId?: string;
  jobId?: string;
  documentHash?: string;
  ipAddressHash?: string;
  userAgentHash?: string;
  termsSnapshotHash: string;
  previousAcceptanceId?: string;
  createdAt: string;
}

export interface LegalAcceptanceReference {
  acceptanceId: string;
  agreementId: string;
  version: string;
  acceptedAt: string;
}

export interface ReacceptanceEvaluationResult {
  currentAcceptedVersion: string;
  newVersion: string;
  changeClassification: ChangeClassification;
  reacceptanceRequired: boolean;
  status: AgreementLifecycleState;
  reason: string;
}
