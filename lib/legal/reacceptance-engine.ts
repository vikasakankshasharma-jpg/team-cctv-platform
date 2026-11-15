/**
 * @file lib/legal/reacceptance-engine.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Agreement Lifecycle & Re-Acceptance State Machine.
 * Enforces legal state transitions and material-change re-acceptance policies.
 */

import type {
  AgreementLifecycleState,
  ChangeClassification,
  ReacceptanceEvaluationResult,
} from "./legal-types";
import { LegalStateError } from "./legal-errors";

const VALID_TRANSITIONS: Record<AgreementLifecycleState, readonly AgreementLifecycleState[]> = {
  DRAFT: ["PENDING_ACCEPTANCE"],
  PENDING_ACCEPTANCE: ["ACCEPTED"],
  ACCEPTED: ["ACTIVE"],
  ACTIVE: ["SUPERSEDED", "TERMINATED"],
  SUPERSEDED: [], // Terminal / Historical
  TERMINATED: [], // Terminal
};

/**
 * Validates and executes an agreement lifecycle state transition.
 */
export function transitionAgreementState(
  fromState: AgreementLifecycleState,
  toState: AgreementLifecycleState
): AgreementLifecycleState {
  const allowed = VALID_TRANSITIONS[fromState];

  if (!allowed || !allowed.includes(toState)) {
    throw new LegalStateError(
      `Illegal agreement lifecycle transition from "${fromState}" to "${toState}"`,
      "INVALID_STATE_TRANSITION",
      fromState,
      toState
    );
  }

  return toState;
}

/**
 * Evaluates whether an agreement version bump requires mandatory re-acceptance from the stakeholder.
 */
export function evaluateReacceptanceRequirement(
  currentAcceptedVersion: string,
  newVersion: string,
  changeClassification: ChangeClassification
): ReacceptanceEvaluationResult {
  if (currentAcceptedVersion === newVersion) {
    return {
      currentAcceptedVersion,
      newVersion,
      changeClassification: "NON_MATERIAL",
      reacceptanceRequired: false,
      status: "ACTIVE",
      reason: "Version is unchanged; existing acceptance remains authoritative.",
    };
  }

  if (changeClassification === "MATERIAL") {
    return {
      currentAcceptedVersion,
      newVersion,
      changeClassification: "MATERIAL",
      reacceptanceRequired: true,
      status: "PENDING_ACCEPTANCE",
      reason: `Material modification between ${currentAcceptedVersion} and ${newVersion} requires explicit re-acceptance.`,
    };
  }

  return {
    currentAcceptedVersion,
    newVersion,
    changeClassification: "NON_MATERIAL",
    reacceptanceRequired: false,
    status: "ACTIVE",
    reason: `Non-material change (editorial/formatting) from ${currentAcceptedVersion} to ${newVersion}; existing acceptance remains valid.`,
  };
}
