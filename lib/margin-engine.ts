import { PlanType, Product, VendorCategory } from "@/types";

export interface MarginPolicyConfig {
  anchor_margin: Record<PlanType, number>;
  accessory_margin: Record<PlanType, number>;
  cable_margin: number;
  cable_wastage_factor: number;
  labor_margin: number;
  gst_rate: number;
  rounding_mode: 'nearest_10' | 'nearest_1' | 'none';
  margin_hdd?: number;
  margin_hdd_budget?: number;
  margin_cctv_camera?: number;
  margin_cctv_camera_budget?: number;
  margin_recorder?: number;
  margin_junction_box?: number;
  margin_connectors?: number;
  margin_hdmi_cable?: number;
  margin_rack?: number;
  margin_power_supply?: number;
  [key: string]: any;
}

export const DEFAULT_MARGIN_POLICY: MarginPolicyConfig = {
  anchor_margin: { budget: 0.10, recommended: 0.12, premium: 0.15 },
  accessory_margin: { budget: 0.50, recommended: 0.65, premium: 0.80 },
  cable_margin: 0.40,
  cable_wastage_factor: 1.10, // +10%
  labor_margin: 0.20,
  gst_rate: 0.18,
  rounding_mode: 'nearest_10',
  // Dynamic component margin defaults (%)
  margin_hdd: 5,
  margin_hdd_budget: 10,
  margin_cctv_camera: 15,
  margin_cctv_camera_budget: 30,
  margin_recorder: 15,
  margin_junction_box: 50,
  margin_connectors: 50,
  margin_hdmi_cable: 20,
  margin_rack: 30,
  margin_power_supply: 25,
};

export type ProductMarginCategory = 'anchor' | 'accessory' | 'cable';

export function getProductCategory(category: VendorCategory | string): ProductMarginCategory {
  const anchors = ['cctv_camera', 'CAMERA_HD', 'CAMERA_IP', 'recorder', 'storage', 'display', 'DVR', 'NVR', 'Hard Disk'];
  const cables = ['cable', 'cctv_cable', 'CABLE_CAT6', '3+1 HD Camera Cable'];
  
  if (anchors.includes(category)) return 'anchor';
  if (cables.includes(category)) return 'cable';
  return 'accessory';
}

export interface PricingCalculationResult {
  baseCost: number;             // Extracted directly from supplier master (per unit)
  workingCost: number;          // Base cost + wastage (if applicable) (per unit)
  marginPercent: number;        // The applied %
  marginAmount: number;         // Monetary value of margin (per unit)
  sellingPriceExTax: number;    // Subtotal before tax (per unit)
}

/**
 * Safely converts percentage representation (e.g. 15 or 0.15) to decimal (0.15)
 */
function toDecimalMargin(val: number | undefined | null, fallbackDecimal: number): number {
  if (val === undefined || val === null || isNaN(val)) return fallbackDecimal;
  return val > 1 ? val / 100 : val;
}

/**
 * The Canonical Pricing Calculator
 * Provides a single source of truth for both Quotation Engine and Profitability Engine.
 */
export const MarginEngine = {
  /**
   * Calculates unit economics for a given product under a specific plan tier.
   * All margins are loaded dynamically from the Admin Panel policy.
   */
  calculateUnitPricing(
    baseCost: number, 
    vendorCategory: string, 
    tier: PlanType, 
    policy: MarginPolicyConfig = DEFAULT_MARGIN_POLICY,
    productBrand?: string
  ): PricingCalculationResult {
    
    // Fail-safe: if base cost is missing, return 0 (ON_DEMAND items with null baseCost)
    if (baseCost === null || baseCost === undefined) {
      return { baseCost: 0, workingCost: 0, marginPercent: 0, marginAmount: 0, sellingPriceExTax: 0 };
    }

    const category = getProductCategory(vendorCategory);
    let workingCost = baseCost;
    let markup = 0;

    if (category === 'anchor') {
      markup = policy.anchor_margin[tier] ?? policy.anchor_margin['recommended'] ?? 0.12;
    } else if (category === 'accessory') {
      markup = policy.accessory_margin[tier] ?? policy.accessory_margin['recommended'] ?? 0.65;
    } else if (category === 'cable') {
      markup = policy.cable_margin;
      workingCost = baseCost * policy.cable_wastage_factor;
    }

    // Apply specific product overrides dynamically from policy configured in Admin Panel
    const vCat = (vendorCategory || '').toLowerCase();
    const pBrand = (productBrand || '').toLowerCase();
    const isBudgetTierOrBrand = tier === 'budget' || pBrand.includes('budget');

    // HDD: configured in Admin Panel (default 5% standard, 10% budget)
    if (vCat.includes('storage') || vCat.includes('hard disk') || vCat === 'hdd') {
      if (isBudgetTierOrBrand) {
        markup = toDecimalMargin(policy.margin_hdd_budget, 0.10);
      } else {
        markup = toDecimalMargin(policy.margin_hdd, 0.05);
      }
    }
    // CCTV Camera: configured in Admin Panel (default 15% standard, 30% budget)
    else if (vCat.includes('camera') || vCat === 'cctv_camera') {
      if (isBudgetTierOrBrand) {
        markup = toDecimalMargin(policy.margin_cctv_camera_budget, 0.30);
      } else {
        markup = toDecimalMargin(policy.margin_cctv_camera, 0.15);
      }
    }
    // Recorders (DVR / NVR): configured in Admin Panel (default 15%)
    else if (vCat.includes('recorder') || vCat.includes('dvr') || vCat.includes('nvr')) {
      markup = toDecimalMargin(policy.margin_recorder, 0.15);
    }
    // Junction PVC Box: configured in Admin Panel (default 50%)
    else if (vCat.includes('junction') || vCat.includes('pvc') || vCat.includes('box')) {
      markup = toDecimalMargin(policy.margin_junction_box, 0.50);
    }
    // Connectors (BNC / DC / RJ45): configured in Admin Panel (default 50%)
    else if (vCat.includes('connector') || vCat.includes('bnc') || vCat.includes('dc')) {
      markup = toDecimalMargin(policy.margin_connectors, 0.50);
    }
    // HDMI Cable: configured in Admin Panel (default 20%)
    else if (vCat.includes('hdmi')) {
      markup = toDecimalMargin(policy.margin_hdmi_cable, 0.20);
    }
    // Rack: configured in Admin Panel (default 30%)
    else if (vCat.includes('rack')) {
      markup = toDecimalMargin(policy.margin_rack, 0.30);
    }
    // Power Supply: configured in Admin Panel (default 25%)
    else if (vCat.includes('power') || vCat.includes('smps') || vCat.includes('poe')) {
      markup = toDecimalMargin(policy.margin_power_supply, 0.25);
    }

    const marginAmount = workingCost * markup;
    const sellingPriceExTax = workingCost + marginAmount;

    return {
      baseCost,
      workingCost,
      marginPercent: markup,
      marginAmount,
      sellingPriceExTax
    };
  },

  /**
   * Calculates the document total, applies GST, and rounds according to policy.
   */
  calculateDocumentTotals(
    lineItems: { sellingPriceExTax: number; qty: number }[],
    surchargeExTaxTotal: number = 0,
    geoMultiplier: number = 1.0,
    policy: MarginPolicyConfig = DEFAULT_MARGIN_POLICY
  ) {
    // 1. Sum up line items
    let rawSubtotal = lineItems.reduce((sum, item) => sum + (item.sellingPriceExTax * item.qty), 0);
    
    // 2. Add surcharges (ladder, drilling, etc.)
    rawSubtotal += surchargeExTaxTotal;

    // 3. Apply Geo-Overlay (Surge or discount)
    const finalExTax = rawSubtotal * geoMultiplier;

    // 4. Calculate GST
    const gstAmountRaw = finalExTax * policy.gst_rate;
    const totalPayableRaw = finalExTax + gstAmountRaw;

    // 5. Apply Rounding
    let finalPayable = totalPayableRaw;
    if (policy.rounding_mode === 'nearest_10') {
      finalPayable = Math.round(totalPayableRaw / 10) * 10;
    } else if (policy.rounding_mode === 'nearest_1') {
      finalPayable = Math.round(totalPayableRaw);
    }

    // Since we rounded the total, the GST needs to be mathematically precise against the total?
    // Usually standard ERP practice: Total Payable is fixed, ExTax = Total / (1 + GST)
    const derivedExTax = finalPayable / (1 + policy.gst_rate);
    const derivedGst = finalPayable - derivedExTax;

    return {
      rawSubtotal,
      geoMultiplier,
      finalExTax: derivedExTax,
      gstAmount: derivedGst,
      totalPayable: finalPayable
    };
  }
};
