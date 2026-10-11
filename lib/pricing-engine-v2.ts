/**
 * @file lib/pricing-engine-v2.ts
 * Backward-compatibility wrapper for consolidated pricing engine.
 * Exports generatePricingSnapshot and calculatePricingV2.
 */

import { generatePricingSnapshot } from "./pricing-engine";
import type {
  ResolvedSystem,
  CCTVRequirement,
  AppSettings,
  Product,
  QuoteDelivery,
  Addon
} from "../types";

export { generatePricingSnapshot } from "./pricing-engine";

export interface CalculatePricingV2Params {
  resolvedSystem: ResolvedSystem;
  req: CCTVRequirement;
  settings: AppSettings;
  addons?: Addon[];
  selectedAddonIds?: string[];
  activeOffer?: any;
  referralDiscountPercent?: number;
  referralDiscountFlat?: number;
  products?: Product[];
}

export function calculatePricingV2(params: CalculatePricingV2Params): QuoteDelivery {
  return generatePricingSnapshot(
    params.resolvedSystem,
    params.req,
    params.addons || [],
    params.selectedAddonIds || [],
    params.settings,
    params.activeOffer,
    params.referralDiscountPercent || 0,
    params.referralDiscountFlat || 0,
    params.products || []
  );
}
