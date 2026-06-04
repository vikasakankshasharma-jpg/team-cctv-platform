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
  AddonRuleResult,
  GeoPricingRule
} from "@/types";

export interface PricingEngineParams {
  selection: ConfiguratorSelection;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  cablingDone: boolean;
  cablingMeters?: number;       // Estimated cable run length in meters
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
  geoRules?: GeoPricingRule[];
  locationParams?: {
    pincode?: string;
    city?: string;
    state?: string;
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
    cablingMeters = 50,
    referralDiscountPercent = 0,
    referralDiscountFlat = 0,
    activeOffer,
    geoRules = [],
    locationParams
  } = params;

  // Evaluate Geo-Pricing Matrix (Surge > Pincode > City > State)
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
    if (cam && ((cam.technologies || []).includes("HD") || (cam.technologies || []).includes("IP"))) {
      effectiveTech = (cam.technologies || [])[0]; // Or some logic to determine which one it's acting as
    }
  }

  if (!isIndustrial) {
    // 2. Core Hardware Calculation
    const hardware = calculateHardware(selection, products, addons, settings, effectiveTech);
    lineItems.push(...hardware.items);
    baseHardwareCost += hardware.totalRetail;
    totalPurchaseCost += hardware.totalCost;

    // 3. Labor & Equipment Calculation
    const labor = calculateLabor(selection, settings, effectiveTech, effectiveLaborMultiplier);
    lineItems.push(...labor.items);
    baseHardwareCost += labor.totalRetail;
    // Labor purchase cost is usually 0 (internal staff) or a percentage (outsourced)
    totalPurchaseCost += (labor.totalRetail * (settings.labor_cost_margin_percent || 0)) / 100;

    // 3b. Cabling Cost (only if customer hasn't already done cabling)
    if (!cablingDone) {
      const cabling = calculateCabling(selection, settings, effectiveTech, cablingMeters, effectiveLaborMultiplier);
      lineItems.push(...cabling.items);
      baseHardwareCost += cabling.totalRetail;
      totalPurchaseCost += cabling.totalCost;
    }

    // 3c. Connectors Cost
    const connectors = calculateConnectors(selection, settings, effectiveTech);
    lineItems.push(...connectors.items);
    baseHardwareCost += connectors.totalRetail;
    totalPurchaseCost += connectors.totalCost;

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

  // 7. Validation for Missing Hardware
  let error = false;
  let errorMessage = undefined;
  if (selection.camera_count > 0) {
    const hasCamera = lineItems.some(item => products.some(p => p.id === item.product_id && p.category === "camera"));
    if (!hasCamera) {
      error = true;
      errorMessage = "Missing required camera hardware in catalog.";
    }
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
    margin_warnings: marginWarnings,
    error,
    error_message: errorMessage
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
  addons: Addon[],
  settings: AppSettings,
  tech: string
) {
  const items: QuoteLineItem[] = [];
  let totalRetail = 0;
  let totalCost = 0;

  // 1. Camera Selection
  if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
    for (const req of selection.mixed_camera_requirements) {
      const proxySelection = { ...selection };
      proxySelection.camera_count = req.count;
      if (req.resolution) proxySelection.resolution_preference = req.resolution;
      
      // Inject specific camera override for this bucket, and clear the global one
      // so it doesn't accidentally override mixed buckets.
      if (selection.selected_mixed_camera_ids && selection.selected_mixed_camera_ids[req.type]) {
        proxySelection.selected_camera_id = selection.selected_mixed_camera_ids[req.type];
      } else {
        proxySelection.selected_camera_id = undefined;
      }
      
      const extraFeatures = proxySelection.requested_features ? [...proxySelection.requested_features] : [];
      if (req.features && req.features.length > 0) {
        extraFeatures.push(...req.features);
      }
      
      const typeLower = req.type.toLowerCase();
      if (typeLower.includes("ptz")) extraFeatures.push("ptz");
      if (typeLower.includes("solar")) extraFeatures.push("solar");
      if (typeLower.includes("4g")) extraFeatures.push("4g");
      if (typeLower.includes("audio") || typeLower.includes("speaker") || typeLower.includes("mic")) extraFeatures.push("audio");
      if (typeLower.includes("color")) extraFeatures.push("color");
      
      proxySelection.requested_features = extraFeatures;
      
      const proxyTech = req.technology || tech;

      const camera = resolveCamera(proxySelection, products, addons, settings, proxyTech);
      if (camera) {
        const qty = req.count;
        const unitPrice = resolveUnitPrice(camera, qty);
        const lineTotal = unitPrice * qty;
        let featureLabel = "";
        if (req.features && req.features.length > 0) {
          const names = req.features.map(f => {
            if (f === "color") return "Color Night Vision";
            if (f === "audio") return "Audio/Mic";
            if (f === "ptz") return "PTZ";
            if (f === "solar") return "Solar";
            if (f === "4g") return "4G";
            return f;
          });
          featureLabel = ` (${names.join(", ")})`;
        }

        items.push({
          product_id: camera.id!,
          display_name: `${req.type}${featureLabel} - ${camera.display_name}`,
          brand: camera.brand,
          qty,
          unit_price: unitPrice,
          line_total: lineTotal
        });
        totalRetail += lineTotal;
        totalCost += (camera.base_cost || 0) * qty;
      }
    }
  } else {
    // Standard single camera logic
    const camera = resolveCamera(selection, products, addons, settings, tech);
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

  // 3. Storage (HDD / SD Card)
  const hdd = resolveHDD(selection, [...products, ...addons] as any[], tech);
  if (hdd) {
    const unitPrice = hdd.unit_price || hdd.price || 0;
    
    // WiFi cameras use 1 SD Card per camera. HDDs are shared (qty 1).
    const nameStr = hdd.display_name.toLowerCase();
    const isSdCard = (hdd as any).storage_type === "Micro SD" || nameStr.includes("sd card") || nameStr.includes("micro sd") || nameStr.includes("memory card");
    const qty = isSdCard ? selection.camera_count : 1;

    items.push({
      product_id: hdd.id!,
      display_name: hdd.display_name,
      brand: hdd.brand,
      qty: qty,
      unit_price: unitPrice,
      line_total: unitPrice * qty
    });
    totalRetail += unitPrice * qty;
    totalCost += (hdd.base_cost || 0) * qty;
  }

  // 4. Transmission (PoE/PSU)
  const transmission = resolveTransmission(selection, [...products, ...addons] as any[], tech);
  if (transmission) {
    const qty = Math.ceil(selection.camera_count / (transmission.max_cameras || 4));
    const unitPrice = transmission.unit_price || transmission.price || 0;
    items.push({
      product_id: transmission.id!,
      display_name: transmission.display_name,
      qty,
      unit_price: unitPrice,
      line_total: unitPrice * qty
    });
    totalRetail += unitPrice * qty;
    totalCost += (transmission.base_cost || 0) * qty;
  }

  return { items, totalRetail, totalCost };
}

function calculateLabor(
  selection: ConfiguratorSelection,
  settings: AppSettings,
  tech: string,
  locationMultiplier = 1.0
) {
  const items: QuoteLineItem[] = [];
  let totalRetail = 0;

  const baseRate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
  const rate = Math.round(baseRate * locationMultiplier);
  const qty = selection.camera_count;
  const lineTotal = rate * qty;

  items.push({
    product_id: "labor_install",
    display_name: `Standard ${tech} Installation & Termination${locationMultiplier !== 1.0 ? ` (×${locationMultiplier} local rate)` : ""}`,
    qty,
    unit_price: rate,
    line_total: lineTotal
  });
  totalRetail += lineTotal;

  // Note: High Reach Fee is no longer automatically added.
  // Instead, a UI warning is shown so installers can quote it post-visit.

  return { items, totalRetail };
}

function calculateCabling(
  selection: ConfiguratorSelection,
  settings: AppSettings,
  tech: string,
  meters: number,
  locationMultiplier = 1.0
) {
  const items: QuoteLineItem[] = [];
  
  if (tech === "WiFi") {
    return { items, totalRetail: 0, totalCost: 0 };
  }

  // Exclude Wireless/Solar/4G cameras from cabling meter counts
  let wiredCameraCount = selection.camera_count;
  if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
    wiredCameraCount = selection.mixed_camera_requirements
      .filter(req => {
        const t = req.type.toLowerCase();
        return !t.includes("solar") && !t.includes("4g") && !t.includes("wifi") && !t.includes("wireless");
      })
      .reduce((sum, req) => sum + req.count, 0);
  }

  if (wiredCameraCount <= 0) {
    return { items, totalRetail: 0, totalCost: 0 };
  }

  // Use explicitly requested meters per camera, or default to 20m per wired camera
  const metersPerCamera = selection.cable_length_meters || 20;
  const totalMeters = metersPerCamera * wiredCameraCount;

  // Base Cable Cost
  let baseCostPerMeter = 12; // fallback
  let cableTypeLabel = "Cable";

  if (tech === "IP") {
    // IP always uses CAT6
    baseCostPerMeter = settings.cable_copper_coated_ip || 12;
    cableTypeLabel = "CAT6 Cable";
  } else {
    // HD can use CAT6 or 3+1 Coaxial
    if (selection.cable_type === "cat6") {
      baseCostPerMeter = settings.cable_copper_coated_ip || 12;
      cableTypeLabel = "CAT6 Cable";
    } else {
      // Default to Coaxial for HD
      baseCostPerMeter = settings.cable_copper_coated_hd || 8;
      cableTypeLabel = "3+1 Coaxial Cable";
    }
  }
    
  // Conduit Cost Addition
  const isConduit = selection.wiring_type === "conduit";
  if (isConduit) {
    const conduitRate = settings.conduit_cost_per_meter || 20;
    baseCostPerMeter += conduitRate;
  }

  const ratePerMeter = Math.round(baseCostPerMeter * locationMultiplier);
  const lineTotal = ratePerMeter * totalMeters;
  const typeLabel = isConduit ? `Conduit Pipe + ${cableTypeLabel}` : `${cableTypeLabel} (Open)`;

  items.push({
    product_id: "cabling_material",
    display_name: `${typeLabel} (~${totalMeters}m) @ ₹${ratePerMeter}/m`,
    qty: totalMeters,
    unit_price: ratePerMeter,
    line_total: lineTotal
  });

  // Purchase cost = ~70% of retail (material has lower margin)
  const totalCost = Math.round(lineTotal * 0.7);
  return { items, totalRetail: lineTotal, totalCost };
}

function calculateConnectors(
  selection: ConfiguratorSelection,
  settings: AppSettings,
  tech: string
) {
  const items: QuoteLineItem[] = [];
  
  if (tech === "WiFi") {
    return { items, totalRetail: 0, totalCost: 0 };
  }
  
  const cameraCount = selection.camera_count || 1;
  const useRJ45 = tech === "IP" || selection.cable_type === "cat6";
  
  if (useRJ45) {
    const rate = settings.connector_rj45_cost || 25;
    const lineTotal = rate * cameraCount;
    items.push({
      product_id: "connector_rj45",
      display_name: "RJ45 Connectors (Camera & Switch/Balun ends)",
      qty: cameraCount,
      unit_price: rate,
      line_total: lineTotal
    });
    return { items, totalRetail: lineTotal, totalCost: Math.round(lineTotal * 0.5) };
  } else {
    const rate = settings.connector_bnc_dc_cost || 70;
    const lineTotal = rate * cameraCount;
    items.push({
      product_id: "connector_bnc_dc",
      display_name: "BNC & DC Connector Set",
      qty: cameraCount,
      unit_price: rate,
      line_total: lineTotal
    });
    return { items, totalRetail: lineTotal, totalCost: Math.round(lineTotal * 0.5) };
  }
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

  // BUG FIX: Skip `amc_1yr` here — it is handled dynamically below
  // to avoid double-counting (price is % of hardware, not a fixed price).
  const staticAddonIds = selectedAddonIds.filter(id => id !== "amc_1yr");

  staticAddonIds.forEach(id => {
    const addon = addons.find(a => a.id === id);
    if (!addon) return;

    let qty = 1;
    if (addon.unit_multiplier === "camera_count") qty = selection.camera_count;
    
    const price = addon.price || 0;
    const lineTotal = price * qty;
    items.push({
      addon_id: addon.id!,
      display_name: addon.display_name,
      price: price,
      qty
    });
    totalRetail += lineTotal;
    totalCost += (addon.base_cost || 0) * qty;
  });

  // Dynamic AMC Logic (only runs once, price is % of hardware)
  if (selectedAddonIds.includes("amc_1yr")) {
    const pct = settings.amc_1yr_pct || 15;
    const amcPrice = Math.round(baseHardwareCost * (pct / 100));
    
    if (activeOffer?.type === "free_amc") {
      // Show both lines so customer sees the saving
      items.push({
        addon_id: "amc_1yr",
        display_name: `1-Year Annual Maintenance Contract (${pct}%)`,
        price: amcPrice,
        qty: 1
      });
      items.push({
        addon_id: "promo_free_amc",
        display_name: "Promotion: Free 1st Year AMC",
        price: -amcPrice,
        qty: 1
      });
      // Net zero — no change to totalRetail
    } else {
      items.push({
        addon_id: "amc_1yr",
        display_name: `1-Year Annual Maintenance Contract (${pct}%)`,
        price: amcPrice,
        qty: 1
      });
      totalRetail += amcPrice;
    }
    // AMC purchase cost ≈ 30% of retail (technician visits)
    totalCost += Math.round(amcPrice * 0.3);
  }

  return { items, totalRetail, totalCost };
}

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * RESOLUTION HELPERS (PURE FUNCTIONS)
 * ──────────────────────────────────────────────────────────────────────────────
 */

/** 
 * Forward-estimates the total quote value for a specific camera to allow budget filtering 
 */
function estimateQuoteTotal(cam: Product, selection: ConfiguratorSelection, products: Product[], addons: Addon[], settings: AppSettings, tech: string): number {
  const qty = selection.camera_count;
  const camTotal = resolveUnitPrice(cam, qty) * qty;
  
  const recorder = resolveRecorder(selection, products, tech);
  const recTotal = recorder ? recorder.unit_price : 0;
  
  const hdd = resolveHDD(selection, [...products, ...addons] as any[], tech);
  const hddTotal = hdd ? (hdd.unit_price || hdd.price || 0) : 0;

  const transmission = resolveTransmission(selection, [...products, ...addons] as any[], tech);
  const transQty = transmission ? Math.ceil(qty / (transmission.max_cameras || 4)) : 0;
  const transTotal = transmission ? (transmission.unit_price || transmission.price || 0) * transQty : 0;

  const baseHardware = camTotal + recTotal + hddTotal + transTotal;

  const laborRate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
  const laborTotal = laborRate * qty;

  const cableMeters = 50; // default estimated average used in engine
  const cableRate = tech === "IP" ? (settings.cable_copper_coated_ip || 12) : (settings.cable_copper_coated_hd || 8);
  const cableTotal = cableRate * (cableMeters * qty);

  let amcTotal = 0;
  if ((selection.selected_addons || []).includes("amc_1yr")) {
    const pct = settings.amc_1yr_pct || 15;
    amcTotal = Math.round(baseHardware * (pct / 100));
  }

  const grossSubtotal = baseHardware + laborTotal + cableTotal + amcTotal;
  const gstAmount = Math.round(grossSubtotal * ((settings.gst_rate || 18) / 100));
  
  return grossSubtotal + gstAmount;
}

function resolveCamera(selection: ConfiguratorSelection, products: Product[], addons: Addon[], settings: AppSettings, tech: string) {
  if (selection.selected_camera_id) {
    return products.find(p => p.id === selection.selected_camera_id);
  }

  let pool = products.filter(p => p.category === "camera" && (p.technologies || []).includes(tech as any) && p.is_active);

  // ── Specialty Camera Guardrail ──────────────────────────────
  // Prevent Elite/Premium tiers from accidentally picking highly expensive PTZ/Solar/4G/Wireless cameras
  // unless the customer explicitly requested them.
  const requestedSpecialties = (selection.requested_features || []).map(f => f.toLowerCase().trim());
  const hasSpecialtyRequest = requestedSpecialties.some(rf => 
    ["ptz", "solar", "4g", "wireless", "panoramic"].includes(rf)
  ) || ((selection as any).type && ["ptz", "solar", "4g", "wireless"].some(t => (selection as any).type.toLowerCase().includes(t)));

  if (!hasSpecialtyRequest) {
    const nonSpecialtyPool = pool.filter(cam => {
      const name = (cam.technical_name + " " + cam.display_name).toLowerCase();
      const feats = (cam.features || []).map(f => f.toLowerCase());
      const isSpecialty = ["ptz", "solar", "4g", "wireless", "panoramic"].some(
        sp => name.includes(sp) || feats.includes(sp)
      );
      return !isSpecialty;
    });
    // Fallback: only apply if it doesn't empty the pool
    if (nonSpecialtyPool.length > 0) {
      pool = nonSpecialtyPool;
    }
  }

  // Filter by Brand
  if (selection.brand_preference && selection.brand_preference !== "all") {
    const brandFiltered = pool.filter(cam => cam.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
    // Fallback: If strict brand matching eliminates ALL cameras, drop the filter
    if (brandFiltered.length > 0) {
      pool = brandFiltered;
    }
  }

  // Filter by Resolution (Megapixel)
  if (selection.resolution_preference && selection.resolution_preference !== "all") {
    // We expect resolution_preference to be something like "2MP" or "4MP"
    const resPref = selection.resolution_preference.toUpperCase();
    const resFiltered = pool.filter(cam => {
      // Safely parse resolution_mp (which might be "2MP", "2.4MP", "4MP", etc.)
      const camRes = String(cam.resolution_mp || "").toUpperCase();
      return camRes.includes(resPref) || resPref.includes(camRes.replace("MP", ""));
    });
    // Fallback: If strict resolution matching eliminates ALL cameras, drop the filter
    if (resFiltered.length > 0) {
      pool = resFiltered;
    }
  }

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

  // Filter by Max Budget (Total Quote Value Forward-Estimation)
  if (selection.max_budget) {
    const budgetFiltered = pool.filter(cam => {
      const predictedTotal = estimateQuoteTotal(cam, selection, products, addons, settings, tech);
      return predictedTotal <= selection.max_budget!;
    });
    // Fallback: If strict budget matching eliminates ALL cameras, keep the cheapest camera available
    if (budgetFiltered.length > 0) {
      pool = budgetFiltered;
    } else {
      // If budget is impossibly low, we sort by price and just take the absolute cheapest one
      pool.sort((a, b) => a.unit_price - b.unit_price);
      pool = [pool[0]];
    }
  }

  // Always sort ascending by price for deterministic results
  pool.sort((a, b) => a.unit_price - b.unit_price);

  if (pool.length === 0) return undefined;

  // Use explicit option number if provided (1, 2, 3)
  // But wait, CompareCards relies on 1,2,3 to mean Budget, Recommended, Premium!
  if (selection.selected_camera_option) {
    const opt = selection.selected_camera_option;
    if (opt === 1 || selection.plan_type === "budget") {
      // 1. Budget: Absolute lowest price
      return pool[0];
    } else if (opt === 3 || selection.plan_type === "premium") {
      // 3. Premium/Elite: Absolute highest price / highest specification
      return pool[pool.length - 1];
    } else {
      // 2. Recommended / Smart Choice
      if (pool.length <= 2) return pool[pool.length - 1];
      

      const medianIdx = Math.floor(pool.length / 2);
      const medianPrice = pool[medianIdx].unit_price;

      // ── Focus Product (Silent Margin Boost) ─────────────────
      // Find active focus products (is_focus_product === true AND unexpired)
      const now = new Date().toISOString();
      const focusProducts = pool.filter(cam => {
        if (!cam.is_focus_product) return false;
        // Check expiration if set
        if (cam.focus_active_until && typeof cam.focus_active_until === 'string') {
           if (now > cam.focus_active_until) return false;
        }
        // Guardrail: Only boost if price is within ±30% of median
        // This prevents forcing an ₹80,000 8MP camera when the median is ₹20,000
        const isWithinBudgetGuardrail = cam.unit_price >= (medianPrice * 0.7) && cam.unit_price <= (medianPrice * 1.3);
        return isWithinBudgetGuardrail;
      });

      if (focusProducts.length > 0) {
        // Sort by boost priority (highest first)
        focusProducts.sort((a, b) => (b.focus_boost_priority || 50) - (a.focus_boost_priority || 50));
        return focusProducts[0];
      }
      
      // ── Fallback Property-Aware Logic ───────────────────────
      const propStr = String(selection.property_type);
      if (propStr === "factory" || propStr === "warehouse" || propStr === "office" || propStr === "shop") {
        // Find a high-spec camera near the 60th-80th percentile
        // Prioritize cameras with 4MP+, audio, or PTZ
        const highSpec = pool.slice(Math.floor(pool.length / 2)).find(cam => {
          const feats = (cam.features || []).join(" ").toLowerCase();
          const name = (cam.technical_name || "").toLowerCase();
          return feats.includes("mic") || feats.includes("audio") || 
                 feats.includes("ptz") || name.includes("4mp") || name.includes("5mp") || name.includes("8mp");
        });
        return highSpec || pool[Math.floor(pool.length * 0.7)]; // Fallback to 70th percentile
      } else {
        // Residential (home, bungalow) -> Median price / solid value
        return pool[medianIdx];
      }
    }
  }

  // Fallback to plan_type if option number is not provided (should not happen with new logic, but safe)
  if (selection.plan_type === "budget") {
     return pool[0];
  } else if (selection.plan_type === "premium") {
     return pool[pool.length - 1];
  } else {
     return pool[Math.floor(pool.length / 2)];
  }
}

function resolveRecorder(selection: ConfiguratorSelection, products: Product[], tech: string) {
  if (selection.selected_recorder_id) {
    if (selection.selected_recorder_id === "none") return undefined;
    return products.find(p => p.id === selection.selected_recorder_id);
  }

  if (tech === "WiFi") return undefined; // WiFi cameras generally use SD Cards and no DVR/NVR


  const recorders = products.filter(p => 
    p.category === "recorder" && 
    (p.technologies || []).includes(tech as any) && 
    (p.max_cameras || p.channels || 0) >= selection.camera_count
  );
  recorders.sort((a, b) => (a.max_cameras || 0) - (b.max_cameras || 0));
  return recorders[0];
}

/** Safely resolves storage capacity in TB from a product.
 *  Prefers the dedicated `storage_tb` field, falls back to name parsing.
 */
function resolveHDDCapacity(product: Addon & { storage_tb?: number }): number {
  if (typeof product.storage_tb === "number" && product.storage_tb > 0) {
    return product.storage_tb;
  }
  // Fallback: extract first number from name (e.g. "Seagate 2TB HDD" → 2)
  const match = (product.technical_name || product.display_name || "").match(/(\d+(?:\.\d+)?)\s*TB/i);
  if (match) return parseFloat(match[1]);
  // Last resort: any leading number
  const numMatch = (product.technical_name || product.display_name || "").match(/^(\d+)/);
  return numMatch ? parseFloat(numMatch[1]) : 0;
}

function resolveHDD(selection: ConfiguratorSelection, addons: Addon[], tech: string) {
  if (selection.selected_storage_id) {
    if (selection.selected_storage_id === "none") return undefined; // Explicit no-storage request
    return addons.find(a => a.id === selection.selected_storage_id);
  }

  const recordingDays = selection.recording_days ?? 7;
  if (recordingDays === 0) return undefined;

  const hdds = addons.filter(a => a.category === "storage");
  if (hdds.length === 0) return undefined;

  if (tech === "WiFi") {
    const sdCards = hdds.filter(a => {
      const name = a.display_name.toLowerCase();
      return (a as any).storage_type === "Micro SD" || name.includes("sd card") || name.includes("micro sd") || name.includes("memory card");
    });
    if (sdCards.length > 0) {
      sdCards.sort((a, b) => resolveHDDCapacity(a) - resolveHDDCapacity(b));
      const requiredGb = recordingDays > 7 ? 128 : 64;
      return sdCards.find(s => {
        const tb = resolveHDDCapacity(s);
        const gb = tb >= 1 ? tb * 1000 : tb; // Rough heuristic since some are listed as 64GB
        return gb >= requiredGb || s.display_name.includes(`${requiredGb}GB`);
      }) || sdCards[sdCards.length - 1];
    }
    return undefined;
  }

  // Use product's declared daily_gb_per_camera if available, else sensible defaults
  const gbPerDay = tech === "IP" ? 15 : 10;
  const requiredGB = selection.camera_count * gbPerDay * recordingDays;
  const requiredTB = requiredGB / 1000;

  const hardDisks = hdds.filter(a => {
    const name = a.display_name.toLowerCase();
    return !((a as any).storage_type === "Micro SD" || name.includes("sd card") || name.includes("micro sd") || name.includes("memory card"));
  });
  if (hardDisks.length === 0) return undefined;

  hardDisks.sort((a, b) => resolveHDDCapacity(a) - resolveHDDCapacity(b));
  return hardDisks.find(h => resolveHDDCapacity(h) >= requiredTB) || hardDisks[hardDisks.length - 1];
}

function resolveTransmission(selection: ConfiguratorSelection, addons: Addon[], tech: string) {
  if (selection.selected_power_id) {
    return addons.find(a => a.id === selection.selected_power_id);
  }

  const keyword = tech === "IP" ? "poe" : "psu";
  const options = addons.filter(a => (a.category === "power_device" || a.category === "power") && (a.technical_name || a.display_name || "").toLowerCase().includes(keyword));
  if (options.length === 0) return undefined;
  
    options.sort((a, b) => (a.max_cameras || 0) - (b.max_cameras || 0));
  return options.find(o => (o.max_cameras || 0) >= selection.camera_count) || options[options.length - 1];
}

function resolveUnitPrice(product: Product, qty: number) {
  if (product.bulk_discount_threshold && qty >= product.bulk_discount_threshold) {
    return product.bulk_unit_price || product.unit_price || 0;
  }
  return product.unit_price || 0;
}

