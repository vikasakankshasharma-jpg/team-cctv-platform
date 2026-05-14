/**
 * @file lib/franchise-pricing.ts
 * @description Resolves effective pricing settings for a franchise dealer.
 *
 * Merges the base AppSettings (TEAM CCTV defaults) with a FranchisePricingOverride
 * document, giving admin full control over per-franchise purchase costs and margins.
 *
 * Usage in pricing engine:
 *   const settings = await resolveFranchiseSettings(baseSettings, franchiseDealerId);
 *   // Pass resolved settings to calculatePricing()
 */

import { adminDb } from "@/lib/firebase-admin";
import type { AppSettings, FranchisePricingOverride } from "@/types";

/**
 * Extended AppSettings that includes franchise-specific product overrides.
 * The pricing engine reads _franchise_product_overrides to adjust per-product
 * purchase costs and margins when calculating gross profit.
 */
export interface ResolvedPricingSettings extends AppSettings {
  _franchise_product_overrides?: FranchisePricingOverride["product_overrides"];
  _franchise_minimum_margin?: number;
  _franchise_max_discount?: number;
  _franchise_dealer_id?: string;
}

/**
 * Fetches the FranchisePricingOverride for a given franchise dealer
 * and merges it with the base AppSettings.
 *
 * If no override exists (or franchiseDealerId is null), returns the base
 * settings unchanged — TEAM CCTV's own default pricing applies.
 *
 * @param baseSettings       - Default TEAM CCTV AppSettings from Firestore
 * @param franchiseDealerId  - ID of the franchise dealer (null = internal)
 * @returns                  - Merged ResolvedPricingSettings
 */
export async function resolveFranchiseSettings(
  baseSettings: AppSettings,
  franchiseDealerId: string | null | undefined
): Promise<ResolvedPricingSettings> {
  // No franchise dealer — return base settings as-is
  if (!franchiseDealerId) {
    return { ...baseSettings };
  }

  try {
    // Fetch override document (document ID = franchise_dealer_id for easy lookup)
    const overrideSnap = await adminDb
      .collection("franchise_pricing_overrides")
      .where("franchise_dealer_id", "==", franchiseDealerId)
      .limit(1)
      .get();

    if (overrideSnap.empty) {
      // No override configured yet — use base settings
      return { ...baseSettings, _franchise_dealer_id: franchiseDealerId };
    }

    const override = overrideSnap.docs[0].data() as FranchisePricingOverride;

    // Merge: override values take precedence over base settings
    const resolved: ResolvedPricingSettings = {
      ...baseSettings,

      // Labor overrides
      ...(override.labor_ip_per_camera !== undefined && {
        labor_ip_per_camera: override.labor_ip_per_camera,
      }),
      ...(override.labor_hd_per_camera !== undefined && {
        labor_hd_per_camera: override.labor_hd_per_camera,
      }),
      ...(override.cable_cost_per_meter !== undefined && {
        wire_cost_per_meter: override.cable_cost_per_meter,
        cable_copper_coated_ip: override.cable_cost_per_meter,
        cable_copper_coated_hd: Math.round(override.cable_cost_per_meter * 0.7),
      }),

      // Margin floor override
      ...(override.minimum_margin_percent !== undefined && {
        minimum_margin_threshold: override.minimum_margin_percent,
      }),

      // Attach product-level overrides for the pricing engine to consume
      _franchise_product_overrides: override.product_overrides || [],
      _franchise_minimum_margin: override.minimum_margin_percent,
      _franchise_max_discount: override.maximum_discount_percent,
      _franchise_dealer_id: franchiseDealerId,
    };

    return resolved;
  } catch (err) {
    console.error("[FranchisePricing] Failed to resolve override:", err);
    // Safe fallback: return base settings, never crash a quote
    return { ...baseSettings, _franchise_dealer_id: franchiseDealerId };
  }
}

/**
 * Resolves the effective purchase cost for a specific product under a franchise.
 * Used inside the pricing engine to get the correct base_cost per product.
 *
 * @param productId         - Product document ID
 * @param defaultCost       - Default purchase cost from the Product document
 * @param resolvedSettings  - Settings already resolved via resolveFranchiseSettings()
 * @returns                 - Effective purchase cost for this franchise
 */
export function resolveFranchiseProductCost(
  productId: string,
  defaultCost: number,
  resolvedSettings: ResolvedPricingSettings
): number {
  if (!resolvedSettings._franchise_product_overrides) return defaultCost;

  const override = resolvedSettings._franchise_product_overrides.find(
    (o) => o.product_id === productId
  );

  return override?.purchase_cost ?? defaultCost;
}

/**
 * Resolves the effective selling unit price for a product under a franchise.
 * Returns undefined if no price lock exists (let margin calculation proceed normally).
 *
 * @param productId         - Product document ID
 * @param resolvedSettings  - Settings resolved via resolveFranchiseSettings()
 * @returns                 - Locked unit price or undefined
 */
export function resolveFranchiseUnitPrice(
  productId: string,
  resolvedSettings: ResolvedPricingSettings
): number | undefined {
  if (!resolvedSettings._franchise_product_overrides) return undefined;

  const override = resolvedSettings._franchise_product_overrides.find(
    (o) => o.product_id === productId
  );

  return override?.unit_price_override;
}
