import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import { detectImpossibleCombinations } from "../schema/impossible-combinations.ts";
import type { RequirementClassification } from "../schema/enums.ts";

export interface ManualQuoteOracleResult {
  classification: RequirementClassification;
  requires_manual_quote: boolean;
  issue_codes: string[];
}

function cameraTechnologyCount(requirement: CanonicalRequirement, technology: "HD" | "IP" | "Wireless"): number {
  return requirement.cameras.filter((camera) => camera.technology === technology).reduce((sum, camera) => sum + camera.count, 0);
}

export function classifyManualQuote(requirement: CanonicalRequirement): ManualQuoteOracleResult {
  const issues = detectImpossibleCombinations(requirement);
  if (!issues.valid || issues.requires_manual_quote) {
    return {
      classification: issues.valid ? "MANUAL_QUOTE" : "INVALID",
      requires_manual_quote: issues.valid ? true : false,
      issue_codes: issues.issues.map((issue) => issue.code),
    };
  }

  const hd = cameraTechnologyCount(requirement, "HD");
  const ip = cameraTechnologyCount(requirement, "IP");
  const wireless = cameraTechnologyCount(requirement, "Wireless");
  const manual = requirement.camera_count > 64 || hd > 16 || ip > 32 || wireless > 16;

  return {
    classification: manual ? "MANUAL_QUOTE" : "VALID",
    requires_manual_quote: manual,
    issue_codes: manual ? ["MANUAL_QUOTE_BOUNDARY"] : [],
  };
}

export function classifyRawCameraCount(cameraCount: number): ManualQuoteOracleResult {
  if (!Number.isInteger(cameraCount) || cameraCount <= 0) return { classification: "INVALID", requires_manual_quote: false, issue_codes: ["CAMERA_COUNT_NON_POSITIVE"] };
  if (cameraCount > 128) return { classification: "INVALID", requires_manual_quote: false, issue_codes: ["CAMERA_COUNT_EXCEEDS_CERTIFICATION_BOUND"] };
  if (cameraCount > 64) return { classification: "MANUAL_QUOTE", requires_manual_quote: true, issue_codes: ["MANUAL_QUOTE_BOUNDARY"] };
  return { classification: "VALID", requires_manual_quote: false, issue_codes: [] };
}
