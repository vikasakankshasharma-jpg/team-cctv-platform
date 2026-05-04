/**
 * @file lib/recommendation-engine.ts
 * @description Logic to evaluate dynamic recommendation rules from Firestore.
 */

import type { RecommendationRule, ConfiguratorSelection, RecommendedOutput } from "@/types";

/**
 * Evaluates a list of recommendation rules against the user's current selection.
 * Returns the best matching recommendation or null if no match found.
 */
export function getRecommendedOption(
  rules: RecommendationRule[],
  selection: ConfiguratorSelection,
  propertyType: string // Passed separately as it's often captured early in wizard
): RecommendedOutput | null {
  // 1. Filter active rules and sort by priority (lower number = higher priority)
  const activeRules = rules
    .filter(r => r.is_active)
    .sort((a, b) => a.priority - b.priority);

  // 2. Evaluate each rule sequentially
  for (const rule of activeRules) {
    const { conditions } = rule;

    // Check Property Type match
    if (conditions.property_types && conditions.property_types.length > 0) {
      if (!conditions.property_types.includes(propertyType)) continue;
    }

    // Check Technology match
    if (conditions.technology) {
      if (conditions.technology !== selection.technology) continue;
    }

    // Check Camera Count range
    if (conditions.camera_count_min != null) {
      if (selection.camera_count < conditions.camera_count_min) continue;
    }
    if (conditions.camera_count_max != null) {
      if (selection.camera_count > conditions.camera_count_max) continue;
    }

    // Check Recording Days range
    if (conditions.recording_days_min != null) {
      if (selection.recording_days < conditions.recording_days_min) continue;
    }
    if (conditions.recording_days_max != null) {
      if (selection.recording_days > conditions.recording_days_max) continue;
    }

    // If we reach here, all conditions passed
    return {
      ...rule.recommendation,
      rule_id: rule.id || "unknown"
    };
  }

  return null;
}
