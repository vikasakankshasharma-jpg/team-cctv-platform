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
  GeoPricingRule,
  CCTVRequirement,
  QuoteDelivery,
  ResolvedSystem,
  PlanType
} from "@/types";
import { getCatalogCapacity } from "@/lib/catalog-capacity";
import { MarginEngine, DEFAULT_MARGIN_POLICY } from "./margin-engine";

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
  
  // PINCODE based travel fee logic if explicitly provided in wizard/address
  if (selection.lead_pincode && settings.visit_charge) {
    const affordablePincodes = settings.affordable_pincodes || ["302001", "302002", "302003", "302004", "302005", "302006", "302015", "302016"];
    if (affordablePincodes.includes(selection.lead_pincode)) {
      effectiveTravelFee = 0;
    } else {
      effectiveTravelFee = settings.visit_charge;
    }
  }

  // Normalize technology to match product database (Wizard might pass "Analog", "WiFi", or "4G")
  const rawTech = (selection.technology || "HD").toLowerCase();
  if (rawTech === "analog" || rawTech === "hd") selection.technology = "HD";
  else if (rawTech === "wifi" || rawTech === "4g" || rawTech === "wireless") selection.technology = "Wireless";
  else selection.technology = "IP";

  // 0. Industrial Threshold Check — dynamic based on recorder catalog capacity
  const catalogCapacity = getCatalogCapacity(products);
  const techKey = selection.technology as "HD" | "IP" | "Wireless";
  const maxQuotableForTech = catalogCapacity[techKey] ?? (settings.max_supported_cameras || 16);
  const isIndustrial = selection.camera_count > maxQuotableForTech;

  // Initialize accumulators
  let baseHardwareCost = 0;
    let actualLaborCost = 0;
    let actualCablingCost = 0;
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
      actualLaborCost = labor.totalRetail;
    // Labor purchase cost is usually 0 (internal staff) or a percentage (outsourced)
    totalPurchaseCost += (labor.totalRetail * (settings.labor_cost_margin_percent || 0)) / 100;

    // 3b. Cabling Cost (only if customer hasn't already done cabling)
    if (!cablingDone) {
      const cabling = calculateCabling(selection, settings, effectiveTech, cablingMeters, effectiveLaborMultiplier);
      lineItems.push(...cabling.items);
      baseHardwareCost += cabling.totalRetail;
        actualCablingCost = cabling.totalRetail;
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

  if (effectiveTravelFee > 0) {
    lineItems.push({
      product_id: "travel_fee",
      display_name: "Site Visit & Travel Fee",
      brand: "",
      qty: 1,
      unit_price: effectiveTravelFee,
      line_total: effectiveTravelFee
    });
    baseHardwareCost += effectiveTravelFee;
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

  const hasMultipleTechs = selection.mixed_camera_requirements?.some(req => req.technology && req.technology !== effectiveTech);
  if (hasMultipleTechs) {
    marginWarnings.push(`Warning: Mixed technology configurations (e.g. IP and HD) may require multiple recorders, which is not currently supported in auto-quoting.`);
  }

  // 7. Validation for Missing Hardware & Out of Stock
  let error = false;
  let errorMessage = undefined;

  // Check if any selected item is explicitly out of stock
  const outOfStockItems = [
    ...lineItems.filter(item => {
      const p = products.find(prod => prod.id === item.product_id) || addons.find(a => a.id === item.product_id);
      return p && p.stock_quantity === 0;
    }),
    ...quoteAddons.filter(item => {
      const a = addons.find(addon => addon.id === item.addon_id);
      if (!a) return false;
      if (a.stock_quantity === undefined) return false;
      return a.stock_quantity < (item.qty || 1);
    }).map(i => ({ display_name: i.display_name }))
  ];

  if (outOfStockItems.length > 0) {
    error = true;
    errorMessage = `One or more selected items are out of stock: ${outOfStockItems.map(i => i.display_name).join(', ')}`;
  } else if (selection.camera_count > 0) {
    const hasCamera = lineItems.some(item => products.some(p => p.id === item.product_id && p.category === "cctv_camera"));
    if (!hasCamera) {
      error = true;
      errorMessage = "Missing required camera hardware in catalog.";
    } else {
      // Validate recorder capacity
      const recorderItem = lineItems.find(item => products.some(p => p.id === item.product_id && p.category === "recorder"));
      if (!recorderItem && effectiveTech !== "Wireless") {
        error = true;
        errorMessage = "Missing required recorder hardware in catalog.";
      } else if (recorderItem) {
        const rec = products.find(p => p.id === recorderItem.product_id);
        if (rec && (rec.channels || rec.max_cameras || 0) < selection.camera_count) {
          error = true;
          errorMessage = `Selected recorder supports up to ${rec.channels || rec.max_cameras} cameras, but ${selection.camera_count} are required.`;
        }
      }
      
      // Validate power supply capacity
      const powerItem = lineItems.find(item => [...products, ...addons].some(p => p.id === item.product_id && (p.category === "power_device" || p.category === "power")));
      if (powerItem) {
        const pwr = [...products, ...addons].find(p => p.id === powerItem.product_id);
        // Only validate if max_cameras is explicitly defined on the product
        if (pwr && pwr.max_cameras != null && pwr.max_cameras < selection.camera_count) {
          error = true;
          errorMessage = `Selected power supply supports up to ${pwr.max_cameras} cameras, but ${selection.camera_count} are required.`;
        }
      }
    }
  }

  return {
    plan_type: selection.plan_type,
    technology: effectiveTech,
    items: lineItems,
    addons: quoteAddons,
    base_hardware_cost: Math.round(baseHardwareCost - actualLaborCost - actualCablingCost),
    cabling_cost: actualCablingCost,
    labor_cost: actualLaborCost,
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
  // Synthesize mixed_camera_requirements from indoor/outdoor counts if present
  let mixedReqs = selection.mixed_camera_requirements;
  if (!mixedReqs && (selection.indoor_camera_count !== undefined || selection.outdoor_camera_count !== undefined)) {
    const indoor = selection.indoor_camera_count || 0;
    const outdoor = selection.outdoor_camera_count || 0;
    if (indoor > 0 && outdoor > 0) {
      mixedReqs = [
        { type: "Outdoor Bullet Camera", count: outdoor, features: ["bullet"] },
        { type: "Indoor Dome Camera", count: indoor, features: ["dome"] }
      ];
    } else if (outdoor > 0) {
      mixedReqs = [
        { type: "Outdoor Bullet Camera", count: outdoor, features: ["bullet"] }
      ];
    } else if (indoor > 0) {
      mixedReqs = [
        { type: "Indoor Dome Camera", count: indoor, features: ["dome"] }
      ];
    }
  }

  if (mixedReqs && mixedReqs.length > 0) {
    for (const req of mixedReqs) {
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
      if (typeLower.includes("indoor") || typeLower.includes("dome")) extraFeatures.push("dome");
      if (typeLower.includes("outdoor") || typeLower.includes("bullet")) extraFeatures.push("bullet");
      
      proxySelection.requested_features = extraFeatures;
      
      const proxyTech = req.technology || tech;

      const camera = resolveCamera(proxySelection, products, addons, settings, proxyTech);
      if (camera) {
        const qty = req.count;
        const unitPrice = resolveUnitPrice(camera, qty);
        const lineTotal = unitPrice * qty;
        let featureLabel = "";
        if (req.features && req.features.length > 0) {
          const names = req.features
            .filter(f => f !== "bullet" && f !== "dome")
            .map(f => {
              if (f === "color") return "Color Night Vision";
              if (f === "audio") return "Audio/Mic";
              if (f === "ptz") return "PTZ";
              if (f === "solar") return "Solar";
              if (f === "4g") return "4G";
              return f;
            });
          if (names.length > 0) featureLabel = ` (${names.join(", ")})`;
        }

        items.push({
          product_id: camera.id!,
          display_name: `${req.type}: ${camera.display_name}${featureLabel}`,
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
  const hdd = resolveHDD(selection, [...products, ...addons] as any[], tech, recorder);
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
    let wiredCameraCount = selection.camera_count;
    if (selection.mixed_camera_requirements && selection.mixed_camera_requirements.length > 0) {
      wiredCameraCount = selection.mixed_camera_requirements
        .filter(req => {
          const t = req.type.toLowerCase();
          return !t.includes("solar") && !t.includes("4g") && !t.includes("wifi") && !t.includes("wireless");
        })
        .reduce((sum, req) => sum + req.count, 0);
    }

    if (wiredCameraCount > 0) {
      const qty = Math.ceil(wiredCameraCount / (transmission.max_cameras || 4));
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

  // Use explicitly requested meters per camera, or default to admin configured / 20m per wired camera
  const defaultMeters = settings.default_cable_length_per_camera || 20;
  const metersPerCamera = meters || selection.cable_length_meters || defaultMeters;
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
    display_name: `${typeLabel} (~${totalMeters}m) @ Rs.${ratePerMeter}/m`,
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
  
  let wiredCameraCount = selection.camera_count || 1;
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

  let totalRetail = 0;
  let totalCost = 0;

  const useRJ45 = tech === "IP" || selection.cable_type === "cat6";
  if (useRJ45) {
    const rate = settings.connector_rj45_cost || 25;
    const lineTotal = rate * wiredCameraCount;
    items.push({
      product_id: "connector_rj45",
      display_name: "RJ45 Connectors (Camera & Switch/Balun ends)",
      qty: wiredCameraCount,
      unit_price: rate,
      line_total: lineTotal
    });
    totalRetail += lineTotal;
    totalCost += Math.round(lineTotal * 0.5);
  } else {
    const rate = settings.connector_bnc_dc_cost || 70;
    const lineTotal = rate * wiredCameraCount;
    items.push({
      product_id: "connector_bnc_dc",
      display_name: "BNC & DC Connector Set",
      qty: wiredCameraCount,
      unit_price: rate,
      line_total: lineTotal
    });
    totalRetail += lineTotal;
    totalCost += Math.round(lineTotal * 0.5);
  }

  // Weatherproof PVC Camera Junction Boxes for all wired cameras (1 per camera)
  const junctionRate = 35;
  const junctionTotal = junctionRate * wiredCameraCount;
  items.push({
    product_id: "acc_junction_box",
    display_name: "PVC Weatherproof Camera Junction Box",
    brand: "TEAM CCTV",
    qty: wiredCameraCount,
    unit_price: junctionRate,
    line_total: junctionTotal
  });
  totalRetail += junctionTotal;
  totalCost += 20 * wiredCameraCount;

  return { items, totalRetail, totalCost };
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

  const amcAddonId = (settings as any).amc_addon_id || "amc_1yr";

  // Skip the dynamic AMC here — it is handled below
  // to avoid double-counting (price is % of hardware, not a fixed price).
  let staticAddonIds = [...selectedAddonIds].filter(id => id !== amcAddonId);

  // Conditional injection for SIM Router (No Broadband + Remote Viewing)
  if (selection.wants_remote_viewing && selection.broadband_status === "sim_router") {
    const router = addons.find(a => {
      const name = (a.technical_name || a.display_name || "").toLowerCase();
      return name.includes("sim router") || name.includes("4g router") || name.includes("4g 4 antenna");
    });
    if (router && router.id && !staticAddonIds.includes(router.id)) {
      staticAddonIds.push(router.id);
    }
  }

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
  if (selectedAddonIds.includes(amcAddonId)) {
    const pct = settings.amc_1yr_pct || 15;
    const amcPrice = Math.round(baseHardwareCost * (pct / 100));
    
    if (activeOffer?.type === "free_amc") {
      // Show both lines so customer sees the saving
      items.push({
        addon_id: amcAddonId,
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
        addon_id: amcAddonId,
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
  
  const hdd = resolveHDD(selection, [...products, ...addons] as any[], tech, recorder);
  const hddTotal = hdd ? (hdd.unit_price || hdd.price || 0) : 0;

  const transmission = resolveTransmission(selection, [...products, ...addons] as any[], tech);
  const transQty = transmission ? Math.ceil(qty / (transmission.max_cameras || 4)) : 0;
  const transTotal = transmission ? (transmission.unit_price || transmission.price || 0) * transQty : 0;

  const baseHardware = camTotal + recTotal + hddTotal + transTotal;

  const laborRate = tech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
  const laborTotal = laborRate * qty;

  const defaultMeters = settings.default_cable_length_per_camera || 20;
  const cableMeters = selection.cable_length_meters || defaultMeters; // Use explicitly selected meters or default
  const cableRate = tech === "IP" ? (settings.cable_copper_coated_ip || 12) : (settings.cable_copper_coated_hd || 8);
  const cableTotal = cableRate * (cableMeters * qty);

  let amcTotal = 0;
  const amcAddonId = (settings as any).amc_addon_id || "amc_1yr";
  if ((selection.selected_addons || []).includes(amcAddonId)) {
    const pct = settings.amc_1yr_pct || 15;
    amcTotal = Math.round(baseHardware * (pct / 100));
  }

  const grossSubtotal = baseHardware + laborTotal + cableTotal + amcTotal;
  const gstAmount = Math.round(grossSubtotal * ((settings.gst_rate || 18) / 100));
  
  return grossSubtotal + gstAmount;
}

function resolveCamera(selection: ConfiguratorSelection, products: Product[], addons: Addon[], settings: AppSettings, tech: string) {
  // Exclude products that are out of stock or on order — they are deactivated from quoting
  const isAvailable = (p: Product) => p.is_active && p.stock_status !== "out_of_stock" && p.stock_status !== "on_order" && p.stock_status !== "discontinued" && (p.stock_quantity === undefined || p.stock_quantity > 0);

  if (selection.selected_camera_id) {
    const cam = products.find(p => p.id === selection.selected_camera_id);
    if (cam && isAvailable(cam) && (cam.technologies || []).includes(tech as any)) {
      return cam;
    }
  }

  let pool = products.filter(p => p.category === "cctv_camera" && (p.technologies || []).includes(tech as any) && isAvailable(p));

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
      return camRes === resPref || camRes === resPref.replace("MP", "") || camRes + "MP" === resPref;
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
      const name = (cam.technical_name + " " + cam.display_name).toLowerCase();
      const formFactor = (cam.form_factor || "").toLowerCase();
      
      return selection.requested_features!.every(rf => {
        const rfLower = rf.toLowerCase().trim();
        if (rfLower === "dome") return formFactor === "dome" || name.includes("dome");
        if (rfLower === "bullet") return formFactor === "bullet" || name.includes("bullet");
        if (rfLower === "mic") return feats.some(f => f.includes("mic") || f.includes("audio")) || name.includes("mic") || name.includes("audio");
        if (rfLower === "color") return feats.some(f => f.includes("color") || f.includes("night")) || name.includes("color");
        if (rfLower === "ptz") return feats.some(f => f.includes("ptz")) || name.includes("ptz");
        return feats.includes(rfLower) || name.includes(rfLower);
      });
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
  const isAvailable = (p: Product) => p.is_active && p.stock_status !== "out_of_stock" && p.stock_status !== "on_order" && p.stock_status !== "discontinued" && (p.stock_quantity === undefined || p.stock_quantity > 0);

  if (selection.selected_recorder_id) {
    if (selection.selected_recorder_id === "none") return undefined;
    const rec = products.find(p => p.id === selection.selected_recorder_id);
    if (rec && isAvailable(rec) && (rec.technologies || []).includes(tech as any) && (rec.max_cameras || rec.channels || 0) >= selection.camera_count) {
      return rec;
    }
  }

  if (tech === "WiFi") return undefined; // WiFi cameras generally use SD Cards and no DVR/NVR


  const recorders = products.filter(p => {
    if (p.category !== "recorder" || !isAvailable(p)) return false;
    if (!(p.technologies || []).includes(tech as any)) return false;
    if ((p.max_cameras || p.channels || 0) < selection.camera_count) return false;

    // Filter HD DVR by resolution if applicable
    if (tech === "HD" && selection.resolution_preference) {
        const resPref = String(selection.resolution_preference).toUpperCase();
        const dvrName = String(p.display_name || "").toUpperCase();
        if ((resPref === "5MP" || resPref === "8MP") && dvrName.includes("2MP SUPPORTED")) {
            return false; // Don't use a 2MP DVR for 5MP cameras
        }
    }
    return true;
  });
  recorders.sort((a, b) => (a.max_cameras || a.channels || 0) - (b.max_cameras || b.channels || 0));
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
  // Last resort: any leading number, only if TB or GB is in the name
  const numMatch = (product.technical_name || product.display_name || "").match(/^(\d+)/);
  if (numMatch && (product.technical_name || product.display_name || "").match(/TB|GB/i)) {
     return parseFloat(numMatch[1]);
  }
  return 0;
}

function resolveHDD(selection: ConfiguratorSelection, addons: Addon[], tech: string, recorder?: Product, cameraProduct?: Product) {
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

  // 1. Compression technology: Default to H.264 for safer storage estimation if not specified
  const compression = (recorder?.compression as string) || "H.264";
  let compressionMultiplier = 1.0; // H.264 baseline safe side
  if (compression === "H.265") compressionMultiplier = 0.55;
  else if (compression === "H.265+" || compression === "H.265 Pro+") compressionMultiplier = 0.35;

  // 2. Base Daily GB per camera: Prefer catalog daily_gb_per_camera, fallback to resolution bitrate
  let baseGbPerDay = 18; // Default 2MP baseline at H.264
  if (selection.resolution_preference && selection.resolution_preference !== "all") {
    const res = String(selection.resolution_preference).toUpperCase();
    if (res.includes("8MP") || res.includes("4K")) baseGbPerDay = 68;
    else if (res.includes("6MP")) baseGbPerDay = 48;
    else if (res.includes("5MP") || res.includes("4MP")) baseGbPerDay = 36;
    else if (res.includes("2MP")) baseGbPerDay = 18;
  }

  // 3. Recording mode: Continuous (1.0) vs Smart Motion (0.55)
  const recordingMode = (selection as any).recording_mode || "continuous";
  const modeMultiplier = recordingMode === "motion" ? 0.55 : 1.0;

  // 4. Effective daily GB per camera and total required GB
  const effectiveDailyGb = Math.max(5, Math.round(baseGbPerDay * compressionMultiplier * modeMultiplier));
  const totalDailyGb = selection.camera_count * effectiveDailyGb;
  const requiredGB = totalDailyGb * recordingDays;
  const requiredTB = requiredGB / 1000;

  // 5. In-stock hard disks only
  const isAvailable = (p: any) => 
    p.is_active !== false && 
    p.stock_status !== "out_of_stock" && 
    p.stock_status !== "on_order" && 
    p.stock_status !== "discontinued" && 
    (p.stock_quantity === undefined || p.stock_quantity > 0);

  const hardDisks = hdds.filter(a => {
    const name = a.display_name.toLowerCase();
    return !((a as any).storage_type === "Micro SD" || name.includes("sd card") || name.includes("micro sd") || name.includes("memory card"));
  });
  if (hardDisks.length === 0) return undefined;

  const inStockDisks = hardDisks.filter(isAvailable);
  const candidateDisks = inStockDisks.length > 0 ? inStockDisks : hardDisks;
  candidateDisks.sort((a, b) => resolveHDDCapacity(a) - resolveHDDCapacity(b));

  // 6. Find best fit HDD from in-stock options
  let chosenHdd = candidateDisks.find(h => resolveHDDCapacity(h) >= requiredTB);
  if (!chosenHdd) {
    // If requirement exceeds single drive in stock (e.g. 6TB needed, but max in stock is 4TB for 1-SATA)
    // Strictly pick the largest available in-stock drive!
    chosenHdd = candidateDisks[candidateDisks.length - 1];
  }

  // 7. Calculate realistic actual backup days based on chosen drive
  const capacityTB = resolveHDDCapacity(chosenHdd);
  const capacityGB = capacityTB * 1000;
  const approxDays = Math.max(1, Math.floor(capacityGB / (totalDailyGb || 1)));

  // 8. Return enriched HDD with approx backup days in display name
  const modeLabel = recordingMode === "motion" ? "Motion" : "24×7";
  const backupNote = `(Approx. ${approxDays} Days Backup · ${modeLabel} @ ${compression})`;

  return {
    ...chosenHdd,
    display_name: `${chosenHdd.display_name} ${backupNote}`,
    approx_days: approxDays,
    compression_used: compression
  };
}

function resolveTransmission(selection: ConfiguratorSelection, addons: Addon[], tech: string) {
  if (selection.selected_power_id) {
    return addons.find(a => a.id === selection.selected_power_id);
  }

  const options = addons.filter(a => {
    const name = (a.technical_name || a.display_name || "").toLowerCase();
    const cat = (a.category || "").toLowerCase();

    // Must be in a plausible category
    const isPowerCat = cat.includes("power") || cat.includes("transmission") || cat.includes("switch") || cat.includes("network");
    if (!isPowerCat) return false;
    
    // EXPLICIT BLACKLIST: Never select these as core power supplies
    const isRouterOrAccessory = name.includes("router") || name.includes("4g") || name.includes("sim") || name.includes("injector") || name.includes("cable") || name.includes("splitter");

    if (tech === "IP") {
      // IP Cameras need a dedicated PoE Switch
      return name.includes("poe") && !name.includes("adapter") && !isRouterOrAccessory;
    } else {
      // HD Cameras need an SMPS or PSU
      return (name.includes("psu") || name.includes("smps") || name.includes("power")) && !name.includes("poe") && !isRouterOrAccessory;
    }
  });

  if (options.length === 0) {
    // Fallback: If strict filters fail, find ANY power supply that is definitely NOT a router or repair adapter
    const fallbackOptions = addons.filter(a => {
      const cat = (a.category || "").toLowerCase();
      const name = (a.technical_name || a.display_name || "").toLowerCase();
      const isRouter = name.includes("router") || name.includes("4g") || name.includes("sim");
      return (cat.includes("power") || name.includes("power") || name.includes("smps") || name.includes("poe")) && !name.includes("adapter") && !isRouter;
    });
    
    if (fallbackOptions.length === 0) return undefined;
    
    fallbackOptions.sort((a, b) => (a.max_cameras || 0) - (b.max_cameras || 0));
    return fallbackOptions.find(o => (o.max_cameras || 0) >= selection.camera_count) || fallbackOptions[fallbackOptions.length - 1];
  }

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

/**
 * Generates an authoritative pricing snapshot for a resolved system configuration.
 * Consolidates margin engine calculations, catalog pricing, addons, labor, and cabling.
 */
export function generatePricingSnapshot(
  resolvedSystem: ResolvedSystem,
  req: CCTVRequirement,
  addons: any[] = [],
  selectedAddonIds: string[] = [],
  settings: AppSettings,
  activeOffer?: any,
  referralCode?: string
): QuoteDelivery {
  const lineItems: any[] = [];
  const quoteAddons: any[] = [];
  
  let totalPurchaseCost = 0;
  let baseHardwareCost = 0;
  let cablingCost = 0;
  let laborCost = 0;
  let addonsTotal = 0;
  const marginWarnings: string[] = [];

  const marginPolicy: any = {
    ...DEFAULT_MARGIN_POLICY,
    ...((settings as any)?.margin_policy || {}),
    margin_hdd: settings?.margin_hdd ?? (settings as any)?.margin_policy?.margin_hdd ?? DEFAULT_MARGIN_POLICY.margin_hdd,
    margin_hdd_budget: settings?.margin_hdd_budget ?? (settings as any)?.margin_policy?.margin_hdd_budget ?? DEFAULT_MARGIN_POLICY.margin_hdd_budget,
    margin_cctv_camera: settings?.margin_cctv_camera ?? (settings as any)?.margin_policy?.margin_cctv_camera ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera,
    margin_cctv_camera_budget: settings?.margin_cctv_camera_budget ?? (settings as any)?.margin_policy?.margin_cctv_camera_budget ?? DEFAULT_MARGIN_POLICY.margin_cctv_camera_budget,
    margin_recorder: settings?.margin_recorder ?? (settings as any)?.margin_policy?.margin_recorder ?? DEFAULT_MARGIN_POLICY.margin_recorder,
    margin_junction_box: settings?.margin_junction_box ?? (settings as any)?.margin_policy?.margin_junction_box ?? DEFAULT_MARGIN_POLICY.margin_junction_box,
    margin_connectors: settings?.margin_connectors ?? (settings as any)?.margin_policy?.margin_connectors ?? DEFAULT_MARGIN_POLICY.margin_connectors,
    margin_hdmi_cable: settings?.margin_hdmi_cable ?? (settings as any)?.margin_policy?.margin_hdmi_cable ?? DEFAULT_MARGIN_POLICY.margin_hdmi_cable,
    margin_rack: settings?.margin_rack ?? (settings as any)?.margin_policy?.margin_rack ?? DEFAULT_MARGIN_POLICY.margin_rack,
    margin_power_supply: settings?.margin_power_supply ?? (settings as any)?.margin_policy?.margin_power_supply ?? DEFAULT_MARGIN_POLICY.margin_power_supply,
  };
  const planType = (resolvedSystem.plan_type || "recommended") as PlanType;

  // 1. Cameras
  for (const cam of resolvedSystem.cameras) {
    const qty = cam.qty;
    const baseCost = cam.product.baseCost || cam.product.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, cam.product.category, planType, marginPolicy, cam.product.brand);
    
    lineItems.push({
      product_id: cam.product.id,
      display_name: cam.product.display_name,
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: cam.product.stock_status,
      brand: cam.product.brand
    });
    baseHardwareCost += calc.sellingPriceExTax * qty;
    totalPurchaseCost += calc.workingCost * qty;
  }

  // 2. Recorder
  if (resolvedSystem.recorder) {
    const baseCost = resolvedSystem.recorder.baseCost || resolvedSystem.recorder.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.recorder.category, planType, marginPolicy, resolvedSystem.recorder.brand);
    lineItems.push({
      product_id: resolvedSystem.recorder.id,
      display_name: resolvedSystem.recorder.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.recorder.stock_status,
      brand: resolvedSystem.recorder.brand
    });
    baseHardwareCost += calc.sellingPriceExTax;
    totalPurchaseCost += calc.workingCost;
  }

  // 3. Storage
  if (resolvedSystem.storage) {
    const baseCost = resolvedSystem.storage.baseCost || resolvedSystem.storage.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.storage.category, planType, marginPolicy, resolvedSystem.storage.brand);
    lineItems.push({
      product_id: resolvedSystem.storage.id,
      display_name: resolvedSystem.storage.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.storage.stock_status,
      brand: resolvedSystem.storage.brand
    });
    baseHardwareCost += calc.sellingPriceExTax;
    totalPurchaseCost += calc.workingCost;
  }

  // 4. Power Supply
  if (resolvedSystem.power) {
    const baseCost = resolvedSystem.power.baseCost || resolvedSystem.power.unit_price || 0;
    const calc = MarginEngine.calculateUnitPricing(baseCost, resolvedSystem.power.category, planType, marginPolicy, resolvedSystem.power.brand);
    lineItems.push({
      product_id: resolvedSystem.power.id,
      display_name: resolvedSystem.power.display_name,
      qty: 1,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax,
      base_cost_at_quote: baseCost,
      stock_status_at_quote: resolvedSystem.power.stock_status,
      brand: resolvedSystem.power.brand
    });
    baseHardwareCost += calc.sellingPriceExTax;
    totalPurchaseCost += calc.workingCost;
  }

  // 5. Cable (Derived from Catalog/Settings rather than hardcoded 25/15)
  if (resolvedSystem.cable_meters > 0) {
    const isIP = resolvedSystem.plan_type?.includes("IP");
    const cableName = isIP ? "CAT6 IP Camera Cable" : "3+1 HD Camera Cable";
    const baseCost = isIP 
      ? (settings.cable_copper_coated_ip || (settings as any).wire_cost_per_meter || 15)
      : (settings.cable_copper_coated_hd || (settings as any).wire_cost_per_meter || 12);
    const calc = MarginEngine.calculateUnitPricing(baseCost, 'cable', planType, marginPolicy);
    const qty = resolvedSystem.cable_meters;
    
    lineItems.push({
      product_id: isIP ? "cable_cat6" : "cable_3plus1",
      display_name: cableName,
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost
    });
    cablingCost += calc.sellingPriceExTax * qty;
    totalPurchaseCost += calc.workingCost * qty;
  }

  // 6. Connectors (Derived from Settings)
  if (resolvedSystem.connectors_qty > 0) {
    const isIP = resolvedSystem.plan_type?.includes("IP");
    const baseCost = isIP ? (settings.connector_rj45_cost || 25) : (settings.connector_bnc_dc_cost || 70);
    const calc = MarginEngine.calculateUnitPricing(baseCost, 'accessory', planType, marginPolicy);
    const qty = resolvedSystem.connectors_qty;

    lineItems.push({
      product_id: isIP ? "conn_rj45" : "conn_bnc_dc",
      display_name: isIP ? "RJ45 Connectors" : "BNC & DC Connectors",
      qty,
      unit_price: calc.sellingPriceExTax,
      line_total: calc.sellingPriceExTax * qty,
      base_cost_at_quote: baseCost
    });
    baseHardwareCost += calc.sellingPriceExTax * qty;
    totalPurchaseCost += calc.workingCost * qty;
  }

  // 7. Labor & Prep (Derived from Settings rather than hardcoded 500/400)
  const wiredCameraCount = resolvedSystem.cameras.reduce((sum: number, c: any) => {
    return c.product.technologies?.includes("Wireless") ? sum : (sum + c.qty);
  }, 0);

  if (wiredCameraCount > 0) {
    const isIP = resolvedSystem.plan_type?.includes("IP");
    const baseRate = isIP 
      ? (settings.labor_ip_per_camera || settings.labor_full_installation_rate || 500)
      : (settings.labor_hd_per_camera || settings.labor_full_installation_rate || 400);
    const rate = Math.round(baseRate * (1 + marginPolicy.labor_margin));
    const laborTotal = rate * wiredCameraCount;

    lineItems.push({
      product_id: "labor_install",
      display_name: `Installation & Termination (${resolvedSystem.plan_type?.split("_")[0] || "HD"})`,
      qty: wiredCameraCount,
      unit_price: rate,
      line_total: laborTotal,
      base_cost_at_quote: baseRate
    });
    laborCost += laborTotal;
    totalPurchaseCost += baseRate * wiredCameraCount;
  }

  // 8. Site Prep Surcharges
  const flags = (resolvedSystem as any).site_surcharge_flags || {};
  const prepCfg = (settings as any).site_preparation || {
    ladderArrangementFee: 500,
    marbleLaborSurcharge: 400,
    metalInstallationSurcharge: 200,
    furnishedSiteSurcharge: 300,
    heavyWallDrillingSurcharge: 600
  };

  const addSurcharge = (id: string, name: string, cost: number) => {
    const price = Math.round(cost * (1 + marginPolicy.labor_margin));
    lineItems.push({
      product_id: id,
      display_name: name,
      qty: 1,
      unit_price: price,
      line_total: price,
      base_cost_at_quote: cost
    });
    laborCost += price;
    totalPurchaseCost += cost;
  };

  if (flags.requiresLadderFee) addSurcharge("surcharge_ladder", "Ladder / Scaffolding Arrangement Fee", prepCfg.ladderArrangementFee);
  if (flags.requiresMarbleSurcharge) addSurcharge("surcharge_marble", "Specialized Drilling (Marble/Stone)", prepCfg.marbleLaborSurcharge);
  if (flags.requiresMetalSurcharge) addSurcharge("surcharge_metal", "Metal/Pole Installation Surcharge", prepCfg.metalInstallationSurcharge);
  if (flags.requiresFurnishedSurcharge) addSurcharge("surcharge_furnished", "Furnished Site Care & Cleanup Premium", prepCfg.furnishedSiteSurcharge);
  if (flags.requiresHeavyDrillingSurcharge) addSurcharge("surcharge_wall_drilling", "Heavy Wall/Floor Penetration Surcharge", prepCfg.heavyWallDrillingSurcharge);

  // 9. Add-ons (CRITICAL FIX: Support Addons - Do Not Drop!)
  if (selectedAddonIds && selectedAddonIds.length > 0 && addons && addons.length > 0) {
    for (const addonId of selectedAddonIds) {
      const addonObj = addons.find((a: any) => a.id === addonId);
      if (addonObj) {
        const baseCost = addonObj.baseCost || addonObj.unit_price || 0;
        const calc = MarginEngine.calculateUnitPricing(baseCost, 'accessory', planType, marginPolicy);
        const qty = 1;
        const lineTotal = calc.sellingPriceExTax * qty;
        
        quoteAddons.push({
          addon_id: addonObj.id,
          display_name: addonObj.display_name || addonObj.name,
          category: addonObj.category || "addon",
          unit_price: calc.sellingPriceExTax,
          qty,
          line_total: lineTotal,
        });

        lineItems.push({
          product_id: addonObj.id,
          display_name: addonObj.display_name || addonObj.name,
          qty,
          unit_price: calc.sellingPriceExTax,
          line_total: lineTotal,
          base_cost_at_quote: baseCost,
        });

        addonsTotal += lineTotal;
        totalPurchaseCost += calc.workingCost * qty;
      }
    }
  }

  // 10. Geo Multiplier
  const geoMultiplier = (settings as any).geo_multiplier || 1.0;

  // 10.5. STQC Compliance Customizer
  if (req.wants_stqc_compliance) {
    const stqcCostPerCamera = 450;
    const totalStqcCostExTax = stqcCostPerCamera * (req.camera_count || 1);
    lineItems.push({
      product_id: "upgrade_stqc_compliance",
      display_name: `STQC / BIS-ER Certified Hardware Upgrade (${req.camera_count} cameras)`,
      qty: req.camera_count || 1,
      unit_price: stqcCostPerCamera,
      line_total: totalStqcCostExTax,
    });
    baseHardwareCost += totalStqcCostExTax;
    totalPurchaseCost += 300 * (req.camera_count || 1);
  }

  // 11. Final Financials with MarginEngine
  const mappedLineItems = lineItems.map(li => ({ sellingPriceExTax: li.unit_price, qty: li.qty }));
  const totals = MarginEngine.calculateDocumentTotals(mappedLineItems, 0, geoMultiplier, marginPolicy);

  const grossProfitValue = totals.finalExTax - totalPurchaseCost;
  const grossProfitPercent = totals.finalExTax > 0 ? (grossProfitValue / totals.finalExTax) * 100 : 0;

  return {
    plan_type: resolvedSystem.plan_type,
    technology: (resolvedSystem.plan_type?.split("_")[0] || "HD"),
    items: lineItems,
    addons: quoteAddons,
    base_hardware_cost: baseHardwareCost,
    cabling_cost: cablingCost,
    labor_cost: laborCost,
    addons_total: addonsTotal,
    gross_subtotal: totals.rawSubtotal,
    referral_discount: 0,
    net_taxable_amount: totals.finalExTax,
    gst_rate: marginPolicy.gst_rate * 100,
    gst_amount: totals.gstAmount,
    total_payable: totals.totalPayable,
    total_purchase_cost: totalPurchaseCost,
    gross_profit_value: grossProfitValue,
    gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
    margin_warnings: marginWarnings,
    recommendation_reasons: []
  };
}
