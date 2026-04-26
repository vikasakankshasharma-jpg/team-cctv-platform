/**
 * @file lib/pricing-engine.ts
 * @description Core business logic for quotation calculation with high-fidelity tier differentiation.
 */

import type {
  Product,
  Addon,
  AppSettings,
  ConfiguratorSelection,
  PricingResult,
  QuoteLineItem,
  QuoteAddon,
  AddonRuleResult
} from "@/types";

export interface PricingEngineParams {
  selection: ConfiguratorSelection;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  cablingDone: boolean;
  referralDiscountPercent?: number;
  referralDiscountFlat?: number;
  evaluatedAddonRules: Record<string, AddonRuleResult>;
}

export function calculatePricing(params: PricingEngineParams): PricingResult {
  const {
    selection,
    products,
    addons,
    settings,
    cablingDone,
    referralDiscountPercent = 0,
    referralDiscountFlat = 0,
    evaluatedAddonRules
  } = params;

  // ─────────────────────────────────────────────
  // STEP 0: Define Brand Tier Modifiers (Dynamic from Settings)
  // ─────────────────────────────────────────────
  const tierSettings = {
    budget: { 
      prefix: settings.tier_budget_label || "VALUE:", 
      multiplier: settings.tier_budget_multiplier || 0.85 
    },
    recommended: { 
      prefix: settings.tier_recommended_label || "PROFESSIONAL:", 
      multiplier: settings.tier_recommended_multiplier || 1.0 
    },
    premium: { 
      prefix: settings.tier_premium_label || "ELITE:", 
      multiplier: settings.tier_premium_multiplier || 1.25 
    }
  };
  const { prefix, multiplier: brandMultiplier } = tierSettings[selection.plan_type] || tierSettings.recommended;

  // ─────────────────────────────────────────────
  // STEP 1: Process Base Hardware Products
  // ─────────────────────────────────────────────
  
  const getProductTierPrice = (product: Product, planType: "budget" | "recommended" | "premium"): number => {
    if (planType === "budget" && product.unit_price_budget != null) {
      return product.unit_price_budget;
    }
    if (planType === "premium" && product.unit_price_premium != null) {
      return product.unit_price_premium;
    }
    // Fallback: Use standard unit_price with the global brand multiplier
    return Math.round(product.unit_price * brandMultiplier);
  };

  const lineItems: QuoteLineItem[] = [];
  let baseHardwareCost = 0;

  // 1.1 Finding the Camera (Strict matching on resolution_tier AND technology)
  // We filter by category and technology first
  const techCameras = products.filter(p => 
    p.category === "camera" && 
    p.is_active && 
    (p.technology === selection.technology || p.technology === "both")
  );

  // Find camera matching the requested quality
  let selectedCamera = techCameras.find(p => p.resolution_tier === selection.picture_quality);
  
  // High-Fidelity Fallback Logic:
  // If specific quality is missing, try to find the next best quality to avoid identical pricing
  if (!selectedCamera) {
    const tierOrder: ("good" | "very_clear" | "crystal_clear")[] = ["good", "very_clear", "crystal_clear"];
    const targetIdx = tierOrder.indexOf(selection.picture_quality);
    
    // Try higher quality first, then lower
    selectedCamera = techCameras.find(p => p.resolution_tier === tierOrder[targetIdx + 1]) || 
                     techCameras.find(p => p.resolution_tier === tierOrder[targetIdx - 1]) || 
                     techCameras[0];
  }

  if (selectedCamera) {
    const qty = selection.camera_count;
    const adjustedUnitPrice = getProductTierPrice(selectedCamera, selection.plan_type);
    const lineTotal = adjustedUnitPrice * qty;
    baseHardwareCost += lineTotal;
    lineItems.push({
      product_id: selectedCamera.id!,
      display_name: selectedCamera.display_name,
      qty,
      unit_price: adjustedUnitPrice,
      line_total: lineTotal
    });
  }

  // 1.2 Finding the Recorder (Channels >= CameraCount AND Technology Match)
  const recorders = products.filter(
    (p) => p.category === "recorder" && p.is_active && (p.technology === selection.technology || p.technology === "both")
  );
  recorders.sort((a,b) => (a.channels || 0) - (b.channels || 0));
  
  // Select the smallest recorder that fits the camera count
  const selectedRecorder = recorders.find(r => (r.channels || 0) >= selection.camera_count) || recorders[recorders.length - 1];

  if (selectedRecorder) {
    const adjustedUnitPrice = getProductTierPrice(selectedRecorder, selection.plan_type);
    baseHardwareCost += adjustedUnitPrice;
    lineItems.push({
      product_id: selectedRecorder.id!,
      display_name: selectedRecorder.display_name,
      qty: 1,
      unit_price: adjustedUnitPrice,
      line_total: adjustedUnitPrice
    });
  }

  // 1.3 Setup storage (Capacity Logic based on Quality)
  // Storage requirement calculation based on resolution using standard H.265 bitrates
  // Standard (2MP): ~25 GB / day / camera
  // Enhanced (5MP): ~45 GB / day / camera
  // Crystalline (8MP): ~90 GB / day / camera
  const dailyStorageGB = {
    "good": 25,          // ~25GB/day (2MP H.265)
    "very_clear": 45,    // ~45GB/day (5MP H.265)
    "crystal_clear": 90  // ~90GB/day (8MP H.265)
  };
  const gbPerDayPerCamera = dailyStorageGB[selection.picture_quality] || 25;
  const requiredGB = selection.camera_count * selection.recording_days * gbPerDayPerCamera;
  
  // Use 1024 for more accurate TB conversion (standard for disk capacity calculation in systems)
  const requiredTB = requiredGB / 1024;

  const hdds = products.filter(p => 
    p.category === "accessory" && 
    p.is_active && 
    p.technical_name.toLowerCase().includes("hdd")
  );

  const getTB = (p: Product) => {
    const name = p.technical_name.toLowerCase();
    const tbMatch = name.match(/(\d+)tb/i);
    if (tbMatch) return parseFloat(tbMatch[1]);
    const gbMatch = name.match(/(\d+)gb/i);
    if (gbMatch) return parseFloat(gbMatch[1]) / 1024;
    return 0;
  };

  // Sort HDDs by capacity ascending
  hdds.sort((a, b) => getTB(a) - getTB(b));
  
  // Find the smallest HDD that covers the requirement
  const selectedHdd = hdds.find(s => getTB(s) >= requiredTB) || hdds[hdds.length - 1];

  if (selectedHdd) {
    const adjustedUnitPrice = getProductTierPrice(selectedHdd, selection.plan_type);
    baseHardwareCost += adjustedUnitPrice;
    lineItems.push({
      product_id: selectedHdd.id!,
      display_name: selectedHdd.display_name,
      qty: 1,
      unit_price: adjustedUnitPrice,
      line_total: adjustedUnitPrice
    });
  }

  // ─────────────────────────────────────────────
  // STEP 2: Cabling & Labor
  // ─────────────────────────────────────────────
  let wireCost = 0;
  let laborCost = 0;

  if (cablingDone) {
    laborCost = settings.labor_fitting_only_rate * selection.camera_count; 
  } else {
    const estimatedMeters = selection.camera_count * 20; 
    wireCost = settings.wire_cost_per_meter * estimatedMeters;
    laborCost = settings.labor_full_installation_rate * selection.camera_count;
  }

  // ─────────────────────────────────────────────
  // STEP 3: Add-ons
  // ─────────────────────────────────────────────
  let addonsTotal = 0;
  const quoteAddons: QuoteAddon[] = [];

  for (const addon of addons) {
    if (!addon.is_active) continue;
    const ruleResult = evaluatedAddonRules[addon.id!];
    let action = ruleResult ? ruleResult.action : "show_optional";

    let include = false;
    if (action === "show_mandatory") {
      include = true;
    } else if (action === "show_optional" && selection.selected_addons.includes(addon.id!)) {
      include = true;
    }

    if (include) {
      const qty = addon.unit_multiplier === "camera_count" ? selection.camera_count : 1;
      const total = addon.price * qty;
      addonsTotal += total;
      quoteAddons.push({
        addon_id: addon.id!,
        display_name: addon.display_name,
        price: total,
        qty
      });
    }
  }

  const grossSubtotal = baseHardwareCost + wireCost + laborCost + addonsTotal;
  let referralDiscount = Math.round(grossSubtotal * (referralDiscountPercent / 100)) + referralDiscountFlat;
  let netTaxableAmount = Math.max(0, grossSubtotal - referralDiscount);
  const gstAmount = Math.round(netTaxableAmount * (settings.gst_rate / 100));
  const totalPayable = netTaxableAmount + gstAmount;

  return {
    plan_type: selection.plan_type,
    technology: selection.technology,
    items: lineItems,
    addons: quoteAddons,
    base_hardware_cost: Math.round(baseHardwareCost),
    cabling_cost: Math.round(wireCost),
    labor_cost: Math.round(laborCost),
    addons_total: Math.round(addonsTotal),
    gross_subtotal: Math.round(grossSubtotal),
    referral_discount: referralDiscount,
    net_taxable_amount: Math.round(netTaxableAmount),
    gst_rate: settings.gst_rate,
    gst_amount: gstAmount,
    total_payable: Math.round(totalPayable)
  };
}
