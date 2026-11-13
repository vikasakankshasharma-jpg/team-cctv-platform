/**
 * @file lib/pricing-engine-v2.ts
 * Backward-compatibility wrapper for consolidated pricing engine.
 * Exports generatePricingSnapshot and calculatePricingV2.
 */

import { generatePricingSnapshot } from "./pricing-engine";
import { executeSafeQuotationCalculation, type SafeQuotationExecution } from "./quotation-boundary";
import type {
  ResolvedSystem,
  CCTVRequirement,
  AppSettings,
  Product,
  QuoteDelivery,
  Addon
} from "../types";

export { generatePricingSnapshot } from "./pricing-engine";
export type { SafeQuotationExecution } from "./quotation-boundary";

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

/**
 * Phase 6.1.2: Delivery boundary safe execution wrapper for calculatePricingV2.
 * Preserves the domain return type of calculatePricingV2 while providing a safe
 * envelope for external delivery layers.
 */
export function calculatePricingV2Safe(
  params: CalculatePricingV2Params,
  context?: { requestId?: string }
): SafeQuotationExecution<QuoteDelivery> {
  return executeSafeQuotationCalculation(
    () => calculatePricingV2(params),
    { requestId: context?.requestId, source: "calculatePricingV2" }
  );
}
