/**
 * @file lib/pricing-engine.ts
 * @description Enterprise-grade pricing engine for TEAM CCTV Platform.
 * Decomposed into modular, testable units with zero-trust server validation.
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
  propertyType?: string;
  requirements?: string[];
  referralDiscountPercent?: number;
  referralDiscountFlat?: number;
  evaluatedAddonRules?: Record<string, AddonRuleResult>;
  activeOffer?: {
    type: "discount_percent" | "free_amc";
    value?: number;
    campaign_id: string;
  };
}

/**
 * Main entry point for pricing calculation.
 */
export function calculatePricing(params: PricingEngineParams): PricingResult {
  const {
    selection,
    products,
    addons,
    settings,
    cablingDone,
    referralDiscountPercent = 0,
    referralDiscountFlat = 0,
    activeOffer
  } = params;

  // 0. Industrial Threshold Check
  const isIndustrial = selection.camera_count > (settings.max_supported_cameras || 16);

  // Initialize accumulators
  let baseHardwareCost = 0;
  let totalPurchaseCost = 0;
  let addonsTotal = 0;
  const lineItems: QuoteLineItem[] = [];
  const quoteAddons: QuoteAddon[] = [];
  const marginWarnings: string[] = [];

  // 1. Resolve Effective Technology
  let effectiveTech = selection.technology;
  if (selection.selected_camera_id) {
    const cam = products.find(p => p.id === selection.selected_camera_id);
    if (cam && (cam.technology === "HD" || cam.technology === "IP")) {
      effectiveTech = cam.technology;
    }
  }

  if (!isIndustrial) {
    // 2. Core Hardware Calculation
    const hardware = calculateHardware(selection, products, settings, effectiveTech);
    lineItems.push(...hardware.items);
    baseHardwareCost += hardware.totalRetail;
    totalPurchaseCost += hardware.totalCost;

    // 3. Labor & Equipment Calculation
    const labor = calculateLabor(selection, settings, effectiveTech);
    lineItems.push(...labor.items);
    baseHardwareCost += labor.totalRetail;
    // Labor purchase cost is usually 0 (internal staff) or a percentage (outsourced)
    totalPurchaseCost += (labor.totalRetail * (settings.labor_cost_margin_percent || 0)) / 100;

    // 4. Add-ons & Promotional Calculation
    const addonCalc = calculateAddons({
      selection,
      addons,
      settings,
      baseHardwareCost,
      activeOffer,
      selectedAddonIds: selection.selected_addons || []
    });
    quoteAddons.push(...addonCalc.items);
    addonsTotal += addonCalc.totalRetail;
    totalPurchaseCost += addonCalc.totalCost;
  }

  // 5. Final Financial Aggregation & Taxes
  const grossSubtotal = baseHardwareCost + addonsTotal;
  
  // Apply Referral Discounts
  const referralDiscount = Math.round(grossSubtotal * (referralDiscountPercent / 100)) + referralDiscountFlat;
  const netTaxableAmount = Math.max(0, grossSubtotal - referralDiscount);
  
  const gstRate = settings.gst_rate || 18;
  const gstAmount = Math.round(netTaxableAmount * (gstRate / 100));
  const totalPayable = netTaxableAmount + gstAmount;

  // 6. Margin Analysis (Audit)
  const grossProfitValue = netTaxableAmount - totalPurchaseCost;
  const grossProfitPercent = netTaxableAmount > 0 ? (grossProfitValue / netTaxableAmount) * 100 : 0;
  
  if (settings.minimum_margin_threshold && grossProfitPercent < settings.minimum_margin_threshold) {
    marginWarnings.push(`Low Margin Alert: ${grossProfitPercent.toFixed(1)}% (Threshold: ${settings.minimum_margin_threshold}%)`);
  }

  return {
    plan_type: selection.plan_type,
    technology: effectiveTech,
    items: lineItems,
    addons: quoteAddons,
    base_hardware_cost: Math.round(baseHardwareCost),
    cabling_cost: 0, // Integrated into hardware or labor in this model
    labor_cost: 0,   // Integrated into hardware or labor in this model
    addons_total: Math.round(addonsTotal),
    gross_subtotal: Math.round(grossSubtotal),
    referral_discount: referralDiscount,
    net_taxable_amount: Math.round(netTaxableAmount),
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_payable: Math.round(totalPayable),
    requiresIndustrialQuote: isIndustrial,
    total_purchase_cost: Math.round(totalPurchaseCost),
    gross_profit_value: Math.round(grossProfitValue),
    gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
    margin_warnings: marginWarnings
  };
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * MODULAR SUB-CALCULATORS
 * ──────────────────────────────────────────────────────────────────────────────
 */

function calculateHardware(
  selection: ConfiguratorSelection, 
  products: Product[], 
  settings: AppSettings,
  tech: "HD" | "IP"
) {
  const items: QuoteLineItem[] = [];
  let totalRetail = 0;
  let totalCost = 0;

  // 1. Camera Selection
  const camera = resolveCamera(selection, products, settings, tech);
  if (camera) {
    const qty = selection.camera_count;
    const unitPrice = resolveUnitPrice(camera, qty);
    const lineTotal = unitPrice * qty;
    items.push({
      product_id: camera.id!,
      display_name: camera.display_name,
      brand: camera.brand,
      qty,
      unit_price: unitPrice,
      line_total: lineTotal
    });
    totalRetail += lineTotal;
    totalCost += (camera.base_cost || 0) * qty;
  }

  // 2. Recorder Selection
  const recorder = resolveRecorder(selection, products, tech);
  if (recorder) {
    items.push({
      product_id: recorder.id!,
      display_name: recorder.display_name,
      brand: recorder.brand,
      qty: 1,
      unit_price: recorder.unit_price,
      line_total: recorder.unit_price
    });
    totalRetail += recorder.unit_price;
    totalCost += (recorder.base_cost || 0);
  }

  // 3. Storage (HDD)
  const hdd = resolveHDD(selection, products, tech);
  if (hdd) {
    items.push({
      product_id: hdd.id!,
      display_name: hdd.display_name,
      brand: hdd.brand,
      qty: 1,
      unit_price: hdd.unit_price,
      line_total: hdd.unit_price
    });
    totalRetail += hdd.unit_price;
    totalCost += (hdd.base_cost || 0);
  }

  // 4. Transmission (PoE/PSU)
  const transmission = resolveTransmission(selection, products, tech);
  if (transmission) {
    const qty = Math.ceil(selection.camera_count / (transmission.max_cameras || 4));
    items.push({
      product_id: transmission.id!,
      display_name: transmission.display_name,
      qty,
      unit_price: transmission.unit_price,
      line_total: transmission.unit_price * qty
    });
    totalRetail += transmission.unit_price * qty;
    totalCost += (transmission.base_cost || 0) * qty;
  }

  return { items, totalRetail, totalCost };
}

function calculateLabor(selection: ConfiguratorSelection, settings: AppSettings, tech: "HD" | "IP") {
  const items: QuoteLineItem[] = [];
  let totalRetail = 0;

  const rate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
  const qty = selection.camera_count;
  const lineTotal = rate * qty;

  items.push({
    product_id: "labor_install",
    display_name: `Standard ${tech} Installation & Termination`,
    qty,
    unit_price: rate,
    line_total: lineTotal
  });
  totalRetail += lineTotal;

  // High Reach Fee (Enterprise Setting)
  if (selection.ceiling_height === "high" || selection.ceiling_height === "very_high") {
    const fee = settings.high_reach_fee || 1500;
    items.push({
      product_id: "fee_high_reach",
      display_name: "High-Reach Equipment & Safety Access Fee",
      qty: 1,
      unit_price: fee,
      line_total: fee
    });
    totalRetail += fee;
  }

  return { items, totalRetail };
}

function calculateAddons(params: {
  selection: ConfiguratorSelection;
  addons: Addon[];
  settings: AppSettings;
  baseHardwareCost: number;
  activeOffer?: any;
  selectedAddonIds: string[];
}) {
  const { selection, addons, settings, baseHardwareCost, activeOffer, selectedAddonIds } = params;
  const items: QuoteAddon[] = [];
  let totalRetail = 0;
  let totalCost = 0;

  selectedAddonIds.forEach(id => {
    const addon = addons.find(a => a.id === id);
    if (!addon) return;

    let qty = 1;
    if (addon.unit_multiplier === "camera_count") qty = selection.camera_count;
    
    const lineTotal = addon.price * qty;
    items.push({
      addon_id: addon.id!,
      display_name: addon.display_name,
      price: addon.price,
      qty
    });
    totalRetail += lineTotal;
    totalCost += (addon.base_cost || 0) * qty;
  });

  // Dynamic AMC Logic
  if (selectedAddonIds.includes("amc_1yr")) {
    const pct = settings.amc_1yr_pct || 15;
    const amcPrice = Math.round(baseHardwareCost * (pct / 100));
    
    items.push({
      addon_id: "amc_1yr",
      display_name: `1-Year Annual Maintenance Contract (${pct}%)`,
      price: amcPrice,
      qty: 1
    });

    if (activeOffer?.type === "free_amc") {
      items.push({
        addon_id: "promo_free_amc",
        display_name: "Promotion: Free 1st Year AMC",
        price: -amcPrice,
        qty: 1
      });
      totalRetail += 0; // Net zero
    } else {
      totalRetail += amcPrice;
    }
  }

  return { items, totalRetail, totalCost };
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * RESOLUTION HELPERS (PURE FUNCTIONS)
 * ──────────────────────────────────────────────────────────────────────────────
 */

function resolveCamera(selection: ConfiguratorSelection, products: Product[], settings: AppSettings, tech: "HD" | "IP") {
  if (selection.selected_camera_id) {
    return products.find(p => p.id === selection.selected_camera_id);
  }

  let pool = products.filter(p => p.category === "camera" && p.technology === tech && p.is_active);
  
  // Filter by features
  if (selection.requested_features?.length) {
    const filteredPool = pool.filter(cam => {
      const feats = (cam.features || []).map(f => f.toLowerCase().trim());
      return selection.requested_features!.every(rf => feats.includes(rf.toLowerCase().trim()));
    });
    
    // Fallback: If strict feature matching eliminates ALL cameras, 
    // drop the filter so we don't return an invalid (camera-less) quote.
    if (filteredPool.length > 0) {
       pool = filteredPool;
    }
  }

  // Always sort ascending by price for deterministic results
  pool.sort((a, b) => a.unit_price - b.unit_price);

  if (pool.length === 0) return undefined;

  // Use explicit option number if provided (1, 2, 3)
  if (selection.selected_camera_option) {
    const idx = selection.selected_camera_option - 1;
    return pool[Math.min(idx, pool.length - 1)];
  }

  // Fallback to plan_type if option number is not provided
  if (selection.plan_type === "budget") {
     return pool[0];
  } else if (selection.plan_type === "premium") {
     return pool[pool.length - 1];
  } else {
     // recommended/middle tier
     return pool.length > 1 ? pool[1] : pool[0];
  }
}

function resolveRecorder(selection: ConfiguratorSelection, products: Product[], tech: "HD" | "IP") {
  const recorders = products.filter(p => 
    p.category === "recorder" && 
    p.technology === tech && 
    (p.max_cameras || p.channels || 0) >= selection.camera_count
  );
  recorders.sort((a, b) => (a.max_cameras || 0) - (b.max_cameras || 0));
  return recorders[0];
}

function resolveHDD(selection: ConfiguratorSelection, products: Product[], tech: "HD" | "IP") {
  const recordingDays = selection.recording_days || 7;
  const gbPerDay = tech === "IP" ? 15 : 10;
  const requiredGB = selection.camera_count * gbPerDay * recordingDays;
  const requiredTB = requiredGB / 1000;

  const hdds = products.filter(p => p.category === "accessory" && p.technical_name.toLowerCase().includes("hdd"));
  hdds.sort((a, b) => {
    const aTB = parseFloat(a.technical_name.match(/\d+/)?.[0] || "0");
    const bTB = parseFloat(b.technical_name.match(/\d+/)?.[0] || "0");
    return aTB - bTB;
  });

  return hdds.find(h => parseFloat(h.technical_name.match(/\d+/)?.[0] || "0") >= requiredTB) || hdds[hdds.length - 1];
}

function resolveTransmission(selection: ConfiguratorSelection, products: Product[], tech: "HD" | "IP") {
  const keyword = tech === "IP" ? "poe" : "psu";
  const options = products.filter(p => p.category === "accessory" && p.technical_name.toLowerCase().includes(keyword));
  options.sort((a, b) => (a.max_cameras || 0) - (b.max_cameras || 0));
  return options.find(o => (o.max_cameras || 0) >= selection.camera_count) || options[options.length - 1];
}

function resolveUnitPrice(product: Product, qty: number) {
  if (product.bulk_discount_threshold && qty >= product.bulk_discount_threshold) {
    return product.bulk_unit_price || product.unit_price;
  }
  return product.unit_price;
}
