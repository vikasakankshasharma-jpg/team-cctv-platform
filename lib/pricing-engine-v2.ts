import { 
  AppSettings, 
  PricingResult, 
  QuoteLineItem, 
  QuoteAddon, 
  CCTVRequirement,
  GeoPricingRule,
  Product,
  Addon
} from "@/types";
import { ResolvedSystem } from "./product-resolver";

export interface PricingEngineV2Params {
  resolvedSystem: ResolvedSystem;
  req: CCTVRequirement;
  settings: AppSettings;
  addons: Addon[];
  referralDiscountPercent?: number;
  referralDiscountFlat?: number;
  activeOffer?: {
    type: "discount_percent" | "free_amc";
    value?: number;
    campaign_id: string;
  };
  geoRules?: GeoPricingRule[];
  locationParams?: {
    pincode?: string;
    city?: string;
    state?: string;
  };
  selectedAddonIds?: string[];
  cablingDone?: boolean;
}

export function calculatePricingV2(params: PricingEngineV2Params): PricingResult {
  const {
    resolvedSystem,
    req,
    settings,
    addons,
    referralDiscountPercent = 0,
    referralDiscountFlat = 0,
    activeOffer,
    geoRules = [],
    locationParams,
    selectedAddonIds = [],
    cablingDone = false
  } = params;

  // 1. Geo-Pricing Rules
  let effectiveLaborMultiplier = 1.0;
  let effectiveTravelFee = 0;
  
  if (geoRules.length > 0 && locationParams) {
    const validRules = geoRules.filter(r => {
      if (!r.is_active) return false;
      if (r.valid_until && new Date(r.valid_until as string) < new Date()) return false;
      
      if (r.level === "surge") return true;
      if (r.level === "pincode" && r.target_value === locationParams.pincode) return true;
      if (r.level === "city" && r.target_value.toLowerCase() === locationParams.city?.toLowerCase()) return true;
      if (r.level === "state" && r.target_value.toLowerCase() === locationParams.state?.toLowerCase()) return true;
      return false;
    });

    if (validRules.length > 0) {
      validRules.sort((a, b) => a.priority - b.priority);
      const winner = validRules[0];
      if (winner.labor_multiplier !== undefined) effectiveLaborMultiplier = winner.labor_multiplier;
      if (winner.flat_travel_fee !== undefined) effectiveTravelFee = winner.flat_travel_fee;
    }
  }

  if (req.lead_pincode && settings.visit_charge) {
    const affordablePincodes = settings.affordable_pincodes || ["302001", "302002", "302003", "302004", "302005", "302006", "302015", "302016"];
    if (affordablePincodes.includes(req.lead_pincode)) {
      effectiveTravelFee = 0;
    } else {
      effectiveTravelFee = settings.visit_charge;
    }
  }

  // 2. Hardware Calculation
  let baseHardwareCost = 0;
  let totalPurchaseCost = 0;
  const lineItems: QuoteLineItem[] = [];
  const quoteAddons: QuoteAddon[] = [];
  const marginWarnings: string[] = [];

  // Cameras
  for (const cam of resolvedSystem.cameras) {
    const unitPrice = getTieredPrice(cam.product, resolvedSystem.plan_type) || cam.product.unit_price || 0;
    const lineTotal = unitPrice * cam.qty;
    lineItems.push({
      product_id: cam.product.id!,
      display_name: `${cam.bucket_type ? cam.bucket_type + ' - ' : ''}${cam.product.display_name}`,
      brand: cam.product.brand,
      qty: cam.qty,
      unit_price: unitPrice,
      line_total: lineTotal
    });
    baseHardwareCost += lineTotal;
    totalPurchaseCost += (cam.product.base_cost || 0) * cam.qty;
  }

  // Recorder
  if (resolvedSystem.recorder) {
    const unitPrice = getTieredPrice(resolvedSystem.recorder, resolvedSystem.plan_type) || resolvedSystem.recorder.unit_price || 0;
    lineItems.push({
      product_id: resolvedSystem.recorder.id!,
      display_name: resolvedSystem.recorder.display_name,
      brand: resolvedSystem.recorder.brand,
      qty: 1,
      unit_price: unitPrice,
      line_total: unitPrice
    });
    baseHardwareCost += unitPrice;
    totalPurchaseCost += resolvedSystem.recorder.base_cost || 0;
  }

  // Storage
  if (resolvedSystem.storage) {
    const unitPrice = getTieredPrice(resolvedSystem.storage, resolvedSystem.plan_type) || resolvedSystem.storage.unit_price || 0;
    lineItems.push({
      product_id: resolvedSystem.storage.id!,
      display_name: resolvedSystem.storage.display_name,
      brand: resolvedSystem.storage.brand,
      qty: 1,
      unit_price: unitPrice,
      line_total: unitPrice
    });
    baseHardwareCost += unitPrice;
    totalPurchaseCost += resolvedSystem.storage.base_cost || 0;
  }

  // Power
  if (resolvedSystem.power) {
    const unitPrice = getTieredPrice(resolvedSystem.power, resolvedSystem.plan_type) || resolvedSystem.power.unit_price || 0;
    lineItems.push({
      product_id: resolvedSystem.power.id!,
      display_name: resolvedSystem.power.display_name,
      qty: 1,
      unit_price: unitPrice,
      line_total: unitPrice
    });
    baseHardwareCost += unitPrice;
    totalPurchaseCost += resolvedSystem.power.base_cost || 0;
  }

  // Cable
  if (resolvedSystem.cable_meters > 0 && !cablingDone) {
    const isConduit = req.wiring_type === "conduit";
    let baseCostPerMeter = req.technology_preference === "IP" || req.cable_type === "cat6" 
      ? (settings.cable_copper_coated_ip || 12) 
      : (settings.cable_copper_coated_hd || 8);
    
    if (isConduit) {
      baseCostPerMeter += (settings.conduit_cost_per_meter || 20);
    }
    
    const ratePerMeter = Math.round(baseCostPerMeter * effectiveLaborMultiplier);
    const lineTotal = ratePerMeter * resolvedSystem.cable_meters;
    
    lineItems.push({
      product_id: "cabling_material",
      display_name: `Cabling (${isConduit ? 'Conduit' : 'Open'}) ~${resolvedSystem.cable_meters}m`,
      qty: resolvedSystem.cable_meters,
      unit_price: ratePerMeter,
      line_total: lineTotal
    });
    baseHardwareCost += lineTotal;
    totalPurchaseCost += Math.round(lineTotal * 0.7);
  }

  // Connectors
  if (resolvedSystem.connectors_qty > 0) {
    const useRJ45 = req.technology_preference === "IP" || req.cable_type === "cat6";
    const rate = useRJ45 ? (settings.connector_rj45_cost || 25) : (settings.connector_bnc_dc_cost || 70);
    const lineTotal = rate * (resolvedSystem.connectors_qty / 2); // Price is typically per camera set
    const sets = resolvedSystem.connectors_qty / 2;

    lineItems.push({
      product_id: useRJ45 ? "connector_rj45" : "connector_bnc_dc",
      display_name: useRJ45 ? "RJ45 Connectors" : "BNC & DC Connectors",
      qty: sets,
      unit_price: rate,
      line_total: lineTotal
    });
    baseHardwareCost += lineTotal;
    totalPurchaseCost += Math.round(lineTotal * 0.5);
  }

  // Labor
  const wiredCameraCount = resolvedSystem.cameras.reduce((sum, c) => {
    return c.product.technologies?.includes("Wireless") ? sum : sum + c.qty;
  }, 0);

  let laborTotal = 0;
  if (wiredCameraCount > 0) {
    const baseRate = req.technology_preference === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
    const rate = Math.round(baseRate * effectiveLaborMultiplier);
    laborTotal = rate * wiredCameraCount;

    lineItems.push({
      product_id: "labor_install",
      display_name: `Installation & Termination (${req.technology_preference})`,
      qty: wiredCameraCount,
      unit_price: rate,
      line_total: laborTotal
    });
    baseHardwareCost += laborTotal;
    totalPurchaseCost += (laborTotal * (settings.labor_cost_margin_percent || 0)) / 100;
  }

  // Add-ons
  let addonsTotal = 0;
  const amcAddonId = (settings as any).amc_addon_id || "amc_1yr";

  for (const id of selectedAddonIds) {
    if (id === amcAddonId) continue; // Handled separately
    const addon = addons.find(a => a.id === id);
    if (!addon) continue;

    const qty = addon.unit_multiplier === "camera_count" ? req.camera_count : 1;
    const price = addon.price || addon.unit_price || 0;
    const lineTotal = price * qty;
    
    quoteAddons.push({
      addon_id: addon.id!,
      display_name: addon.display_name,
      price: price,
      qty
    });
    addonsTotal += lineTotal;
    totalPurchaseCost += (addon.base_cost || 0) * qty;
  }

  // AMC
  if (selectedAddonIds.includes(amcAddonId)) {
    const pct = settings.amc_1yr_pct || 15;
    const amcPrice = Math.round(baseHardwareCost * (pct / 100));
    
    if (activeOffer?.type === "free_amc") {
      quoteAddons.push({ addon_id: amcAddonId, display_name: `1-Year AMC (${pct}%)`, price: amcPrice, qty: 1 });
      quoteAddons.push({ addon_id: "promo_free_amc", display_name: "Promotion: Free 1st Year AMC", price: -amcPrice, qty: 1 });
    } else {
      quoteAddons.push({ addon_id: amcAddonId, display_name: `1-Year AMC (${pct}%)`, price: amcPrice, qty: 1 });
      addonsTotal += amcPrice;
    }
    totalPurchaseCost += Math.round(amcPrice * 0.3);
  }

  if (effectiveTravelFee > 0) {
    lineItems.push({
      product_id: "travel_fee",
      display_name: "Site Visit & Travel Fee",
      qty: 1,
      unit_price: effectiveTravelFee,
      line_total: effectiveTravelFee
    });
    baseHardwareCost += effectiveTravelFee;
  }

  // Financials
  const grossSubtotal = baseHardwareCost + addonsTotal;
  const referralDiscount = Math.round(grossSubtotal * (referralDiscountPercent / 100)) + referralDiscountFlat;
  const netTaxableAmount = Math.max(0, grossSubtotal - referralDiscount);
  const gstRate = settings.gst_rate || 18;
  const gstAmount = Math.round(netTaxableAmount * (gstRate / 100));
  const totalPayable = netTaxableAmount + gstAmount;

  // Margin
  const grossProfitValue = netTaxableAmount - totalPurchaseCost;
  const grossProfitPercent = netTaxableAmount > 0 ? (grossProfitValue / netTaxableAmount) * 100 : 0;
  
  if (settings.minimum_margin_threshold && grossProfitPercent < settings.minimum_margin_threshold) {
    marginWarnings.push(`Low Margin Alert: ${grossProfitPercent.toFixed(1)}% (Threshold: ${settings.minimum_margin_threshold}%)`);
  }

  const recommendation_reasons: string[] = [];
  if (resolvedSystem.plan_type === "recommended") {
    // Generate intelligent reasons based on requirements
    if (resolvedSystem.cameras.length > 0) {
      const mainCam = resolvedSystem.cameras[0].product;
      if (mainCam.resolution_mp && mainCam.resolution_mp >= 5) {
        recommendation_reasons.push(`${mainCam.resolution_mp}MP gives significantly better detail for identification.`);
      }
    }
    if (req.recording_days && req.recording_days > 0) {
      recommendation_reasons.push(`${req.recording_days}-day recording storage is sized for your requested retention.`);
    }
    if (req.wants_remote_viewing) {
      recommendation_reasons.push(`System includes full mobile viewing capabilities.`);
    }
    if (resolvedSystem.recorder) {
      recommendation_reasons.push(`Recorder supports all your cameras with future scalability.`);
    }
  }

  return {
    plan_type: resolvedSystem.plan_type,
    technology: req.technology_preference || "IP",
    items: lineItems,
    addons: quoteAddons,
    base_hardware_cost: Math.round(baseHardwareCost),
    cabling_cost: 0,
    labor_cost: 0,
    addons_total: Math.round(addonsTotal),
    gross_subtotal: Math.round(grossSubtotal),
    referral_discount: referralDiscount,
    net_taxable_amount: Math.round(netTaxableAmount),
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_payable: Math.round(totalPayable),
    total_purchase_cost: Math.round(totalPurchaseCost),
    gross_profit_value: Math.round(grossProfitValue),
    gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
    margin_warnings: marginWarnings,
    recommendation_reasons,
  };
}

function getTieredPrice(product: Product, tier: "budget" | "recommended" | "premium"): number | undefined {
  if (tier === "budget" && product.unit_price_budget) return product.unit_price_budget;
  if (tier === "premium" && product.unit_price_premium) return product.unit_price_premium;
  return product.unit_price;
}
