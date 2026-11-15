/**
 * @file lib/legal/legal-errors.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Domain Errors.
 */

export class LegalStateError extends Error {
  public readonly code: string;
  public readonly fromState?: string;
  public readonly toState?: string;

  constructor(message: string, code = "LEGAL_STATE_ERROR", fromState?: string, toState?: string) {
    super(message);
    this.name = "LegalStateError";
    this.code = code;
    this.fromState = fromState;
    this.toState = toState;
  }
}

export class UnacceptedAgreementError extends Error {
  public readonly code: string;
  public readonly missingAgreements: string[];
  public readonly partyRole: string;

  constructor(partyRole: string, missingAgreements: string[]) {
    super(`Party ${partyRole} has unaccepted mandatory agreements: ${missingAgreements.join(", ")}`);
    this.name = "UnacceptedAgreementError";
    this.code = "UNACCEPTED_MANDATORY_AGREEMENT";
    this.missingAgreements = missingAgreements;
    this.partyRole = partyRole;
  }
}

export class SupersededAgreementError extends Error {
  public readonly code = "AGREEMENT_SUPERSEDED";
  public readonly agreementId: string;
  public readonly acceptedVersion: string;
  public readonly requiredVersion: string;

  constructor(agreementId: string, acceptedVersion: string, requiredVersion: string) {
    super(
      `Agreement ${agreementId} version ${acceptedVersion} is superseded by material amendment ${requiredVersion}. Re-acceptance required.`
    );
    this.name = "SupersededAgreementError";
    this.agreementId = agreementId;
    this.acceptedVersion = acceptedVersion;
    this.requiredVersion = requiredVersion;
  }
}
