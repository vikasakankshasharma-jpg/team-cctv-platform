import { Product } from "@/types";

export interface MarginRules {
  GLOBAL_DEFAULT: number;
  CATEGORY: Record<string, number>;
  BRAND: Record<string, number>;
  ITEM: Record<string, number>;
}

/**
 * Evaluates the waterfall margin rule for a given product.
 * Returns { marginPercent, ruleRef }
 */
export function resolveWaterfallMargin(product: Partial<Product> & { markup_override?: number | null }, rules: MarginRules) {
  // 1. Product Override (Stored on Product)
  if (product.markup_override !== undefined && product.markup_override !== null) {
    return { marginPercent: product.markup_override, ruleRef: `PRODUCT_OVERRIDE` };
  }
  
  // 1b. Product Override (Stored in Settings - Legacy/Sync)
  if (product.sku && rules.ITEM && rules.ITEM[product.sku] !== undefined) {
    return { marginPercent: rules.ITEM[product.sku], ruleRef: `ITEM_SETTING_OVERRIDE` };
  }
  
  // 2. Brand Rule
  if (product.brand && rules.BRAND[product.brand] !== undefined) {
    return { marginPercent: rules.BRAND[product.brand], ruleRef: `BRAND_RULE` };
  }
  
  // 3. Category Rule
  if (product.category && rules.CATEGORY[product.category] !== undefined) {
    return { marginPercent: rules.CATEGORY[product.category], ruleRef: `CATEGORY_RULE` };
  }
  
  // 4. Global Default
  return { marginPercent: rules.GLOBAL_DEFAULT, ruleRef: `GLOBAL_DEFAULT` };
}

/**
 * Calculates selling price based on base_cost and markup percent
 */
export function calculateSellingPrice(baseCost: number, markupPercent: number): number {
  return Math.round(baseCost * (1 + markupPercent / 100));
}
