/**
 * @file lib/addon-rules.ts
 * @description Logic engine to evaluate add-on visibility based on user selections.
 * 
 * RULES FROM SPEC:
 * 1. Rules are evaluated in priority order (lower number = higher priority).
 * 2. If ALL conditions in a rule match the user's config, the rule triggers.
 * 3. The first triggered rule for a specific addon_id wins.
 * 4. Actions: "show_optional" (customer can toggle), "show_mandatory" (forced on, price included), "hide" (not available).
 */

import type { AddonRule, ConfiguratorSelection, AddonRuleResult } from "@/types";

/**
 * Evaluates a set of add-on rules against the current configurator selection.
 * Returns a map of addon_id to the resulting action.
 * 
 * @param rules - Array of AddonRules from Firestore (should be pre-sorted by priority ascending, but we will sort to be safe)
 * @param selection - The current state of the configurator (e.g. technology, cabling_done via wizard context mapped here)
 * @param cablingDone - Whether cabling is already done in the property (from wizard context)
 * @param propertyType - The property type (from wizard context)
 * @param requirements - Array of requirement tags selected by the user in step 3
 * @returns Map of AddonRuleResults keyed by addon_id
 */
export function evaluateAddonRules(
  rules: AddonRule[],
  selection: ConfiguratorSelection,
  cablingDone: boolean,
  propertyType: string,
  requirements: string[]
): Record<string, AddonRuleResult> {
  const results: Record<string, AddonRuleResult> = {};

  // Sort rules by priority (lower number = higher priority)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    // If we've already resolved this add-on via a higher priority rule, skip
    if (results[rule.addon_id]) {
      continue;
    }

    const { conditions } = rule;
    let isMatch = true;

    // Check Property Type
    if (conditions.property_type && conditions.property_type !== propertyType) {
      isMatch = false;
    }

    // Check Technology
    if (isMatch && conditions.technology && conditions.technology !== selection.technology) {
      isMatch = false;
    }

    // Check Cabling
    if (isMatch && conditions.cabling_done !== undefined && conditions.cabling_done !== cablingDone) {
      isMatch = false;
    }

    // NEW: Check Camera Count Constraints (Sizing Rules)
    if (isMatch && conditions.min_camera_count !== undefined && selection.camera_count < conditions.min_camera_count) {
      isMatch = false;
    }
    if (isMatch && conditions.max_camera_count !== undefined && selection.camera_count > conditions.max_camera_count) {
      isMatch = false;
    }

    // Check Requirements (e.g. user selected "phone_alerts" in wizard, rule requires "phone_alerts")
    if (isMatch && conditions.requirements && conditions.requirements.length > 0) {
      // For all required tags in the rule, ensure the customer selected them
      const hasAllRequirements = conditions.requirements.every(req => requirements.includes(req));
      if (!hasAllRequirements) {
        isMatch = false;
      }
    }

    // If all defined conditions match, apply the rule action
    if (isMatch) {
      results[rule.addon_id] = {
        addon_id: rule.addon_id,
        action: rule.action,
        applied_rule_id: rule.id || "unknown",
      };
    }
  }

  // Any add-ons not covered by rules implicitly default to "hide"
  // (You could also choose to implicitly default to "show_optional" depending on exact business preference, 
  // but "hide" is safer as it requires explicit rules to show things).

  return results;
}
