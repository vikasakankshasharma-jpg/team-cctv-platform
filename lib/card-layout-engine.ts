/**
 * @file lib/card-layout-engine.ts
 * @description Resolves which 3 comparison cards to show a customer based on
 * admin-configured CardLayoutRules stored in Firestore.
 *
 * Resolution logic:
 *  1. Filter active layouts
 *  2. Sort by priority (lower = higher priority)
 *  3. Find the FIRST layout whose conditions all match
 *  4. Return its 3 card slots
 *  5. If no layout matches → return smart defaults based on technology
 */

import type { CardLayoutRule, CardSlot } from "@/types";

export interface CardResolutionInput {
  technology: "HD" | "IP" | string;
  propertyType: string;
  cameraCount: number;
  customLayoutId?: string;
}

export interface ResolvedCards {
  cards: Array<{ technology: "HD" | "IP"; option: number; badge?: string }>;
  layoutName: string;
  isDefault: boolean;
}

/**
 * Resolve which 3 cards to display given a set of admin-configured layouts
 * and the current customer's context.
 *
 * @param layouts - All active CardLayoutRules from Firestore (pre-fetched)
 * @param input   - Customer context from wizard answers
 * @returns       - 3 card definitions + metadata about which layout was used
 */
export function resolveCardLayout(
  layouts: CardLayoutRule[],
  input: CardResolutionInput
): ResolvedCards {
  const { technology, propertyType, cameraCount, customLayoutId } = input;

  // 1. If a custom override is provided, try to apply it first
  if (customLayoutId) {
    const overrideLayout = layouts.find(l => l.id === customLayoutId && l.is_active);
    if (overrideLayout) {
      return {
        cards: overrideLayout.cards.map((slot: CardSlot) => ({
          technology: slot.technology,
          option: slot.camera_option,
          badge: slot.badge,
        })),
        layoutName: overrideLayout.name,
        isDefault: false,
      };
    }
  }

  // 2. Sort by priority ascending (lower number = higher priority)
  const sorted = [...layouts]
    .filter((l) => l.is_active)
    .sort((a, b) => a.priority - b.priority);

  for (const layout of sorted) {
    // Check technology filter
    if (
      layout.technology_filter !== "any" &&
      layout.technology_filter !== technology
    ) {
      continue;
    }

    // Check property type filter (if set)
    if (
      layout.property_type_filter &&
      layout.property_type_filter.length > 0 &&
      !layout.property_type_filter.includes(propertyType)
    ) {
      continue;
    }

    // Check camera count min
    if (
      layout.camera_count_min !== undefined &&
      cameraCount < layout.camera_count_min
    ) {
      continue;
    }

    // Check camera count max
    if (
      layout.camera_count_max !== undefined &&
      cameraCount > layout.camera_count_max
    ) {
      continue;
    }

    // All conditions matched — use this layout
    return {
      cards: layout.cards.map((slot: CardSlot) => ({
        technology: slot.technology,
        option: slot.camera_option,
        badge: slot.badge,
      })),
      layoutName: layout.name,
      isDefault: false,
    };
  }

  // ── Fallback: smart defaults when no layout matches ──────────────────────
  // This is identical to the hardcoded logic in ConfiguratorView, preserved
  // here as a safety net so the UI never shows empty cards.
  return buildDefaultCards(technology);
}

/**
 * Build default card slots when no admin layout matches.
 * Mirrors the smart card preselection logic in ConfiguratorView.tsx.
 *
 * Note: This fallback uses static option numbers. The ConfiguratorView
 * dynamically finds cheapest/premium options from the product catalog.
 * This fallback is intentionally simple — admin should configure layouts
 * to avoid relying on it.
 */
function buildDefaultCards(technology: string): ResolvedCards {
  if (technology === "IP") {
    return {
      cards: [
        { technology: "IP", option: 1 },
        { technology: "IP", option: 2 },
        { technology: "IP", option: 3 },
      ],
      layoutName: "Default — IP",
      isDefault: true,
    };
  }

  if (technology === "HD") {
    return {
      cards: [
        { technology: "HD", option: 1 },
        { technology: "HD", option: 2 },
        { technology: "IP", option: 2, badge: "Smart Upgrade" },
      ],
      layoutName: "Default — HD",
      isDefault: true,
    };
  }

  // "Not sure" or unknown
  return {
    cards: [
      { technology: "HD", option: 1 },
      { technology: "IP", option: 2 },
      { technology: "IP", option: 3 },
    ],
    layoutName: "Default — Mixed",
    isDefault: true,
  };
}
