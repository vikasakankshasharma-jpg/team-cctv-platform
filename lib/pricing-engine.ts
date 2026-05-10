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
  activeOffer?: {
    type: "discount_percent" | "free_amc";
    value?: number;
    campaign_id: string;
  };
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
    evaluatedAddonRules,
    activeOffer
  } = params;

  // ─────────────────────────────────────────────
  // STEP 0: Industrial Gate
  // ─────────────────────────────────────────────
  const isIndustrial = selection.camera_count > (settings.max_supported_cameras || 16);

  const lineItems: QuoteLineItem[] = [];
  let baseHardwareCost = 0;
  let totalPurchaseCost = 0;
  const marginWarnings: string[] = [];

  // ─────────────────────────────────────────────
  // STEP 1: Process Technology Paths
  // ─────────────────────────────────────────────

  if (!isIndustrial) {
    if (selection.technology === "IP") {
      // --- IP PATH ---

      // 1.1 Select Camera (1-5)
      let ipCameras = products.filter(p => p.category === "camera" && p.technology === "IP" && p.is_active);
      
      // Filter by requested features
      if (selection.requested_features && selection.requested_features.length > 0) {
        ipCameras = ipCameras.filter(cam => {
          if (!cam.features) return false;
          return selection.requested_features!.every(reqFeat => cam.features!.includes(reqFeat));
        });
      }

      // Filter by brand
      if (selection.brand_preference && selection.brand_preference !== "all") {
        ipCameras = ipCameras.filter(p => p.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
      }

      // Filter by budget (estimated base cost subtraction)
      if (selection.max_budget) {
        const estBase = (selection.camera_count * (settings.labor_ip_per_camera || 500)) + 
                        (selection.camera_count * 25 * (settings.cable_copper_coated_ip || 40)) + 
                        5000; // avg NVR + HDD + PoE
        const maxCamPrice = (selection.max_budget - estBase) / selection.camera_count;
        ipCameras = ipCameras.filter(p => p.unit_price <= maxCamPrice);
      }

      // Sort by focus point
      if (selection.focus_point === "quality") {
        ipCameras.sort((a, b) => b.unit_price - a.unit_price);
      } else {
        ipCameras.sort((a, b) => a.unit_price - b.unit_price);
      }

      // We map options 1-5 to the seeded cam_ip_opt1...cam_ip_opt5
      let selectedCamera: Product | undefined;
      if (selection.selected_camera_id) {
        selectedCamera = products.find(p => p.id === selection.selected_camera_id);
      } else {
        const optionNum = selection.selected_camera_option || 4; // Default to CP Plus 2MP Color
        selectedCamera = ipCameras.find(p => p.technical_name === `cam_ip_opt${optionNum}`) || 
                               ipCameras[Math.min(optionNum - 1, Math.max(0, ipCameras.length - 1))] ||
                               ipCameras[0];
      }

      if (selectedCamera) {
        let unitPrice = selectedCamera.unit_price;
        if (selectedCamera.bulk_discount_threshold && selection.camera_count >= selectedCamera.bulk_discount_threshold) {
          unitPrice = selectedCamera.bulk_unit_price || unitPrice;
        }
        
        const lineTotal = unitPrice * selection.camera_count;
        baseHardwareCost += lineTotal;
        totalPurchaseCost += (selectedCamera.base_cost || 0) * selection.camera_count;
        if ((selectedCamera.base_cost || 0) > unitPrice) {
          marginWarnings.push(`Camera option sold below cost: ${selectedCamera.display_name}`);
        }
        lineItems.push({
          product_id: selectedCamera.id!,
          display_name: selectedCamera.display_name,
          qty: selection.camera_count,
          unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      // 1.2 Select compatible NVR (path-based)
      // Find recorders whose compatible_paths include a prefix of the camera's catalog_path
      const camPath = selectedCamera?.catalog_path || "UNTAGGED";
      const nvrs = products.filter(p =>
        p.category === "recorder" &&
        p.technology === "IP" &&
        p.is_active &&
        (p.compatible_paths ?? []).some(cp => camPath.startsWith(cp)) &&
        (p.max_cameras ?? p.channels ?? 0) >= selection.camera_count
      );
      nvrs.sort((a, b) => (a.max_cameras ?? a.channels ?? 0) - (b.max_cameras ?? b.channels ?? 0));
      const selectedNvr = nvrs[0]; // smallest compatible NVR

      if (selectedNvr) {
        baseHardwareCost += selectedNvr.unit_price;
        totalPurchaseCost += (selectedNvr.base_cost || 0);
        if ((selectedNvr.base_cost || 0) > selectedNvr.unit_price) {
          marginWarnings.push(`NVR sold below cost: ${selectedNvr.display_name}`);
        }
        lineItems.push({
          product_id: selectedNvr.id!,
          display_name: selectedNvr.display_name,
          qty: 1,
          unit_price: selectedNvr.unit_price,
          line_total: selectedNvr.unit_price
        });
      }

      // 1.3 Select PoE Switch (path-based, capacity-aware)
      const poeOptions = products.filter(p =>
        p.category === "accessory" &&
        p.technology === "IP" &&
        p.is_active &&
        p.technical_name.startsWith("poe_") &&
        (p.compatible_paths ?? []).some(cp => camPath.startsWith(cp))
      );
      // Sort by max_cameras ASCENDING to prefer smallest compatible switch
      poeOptions.sort((a, b) => (a.max_cameras ?? 0) - (b.max_cameras ?? 0));
      const idealPoe = poeOptions.find(p => (p.max_cameras ?? 0) >= selection.camera_count) || poeOptions[poeOptions.length - 1];

      if (idealPoe) {
        // For 9-16 cameras, stack multiple switches
        const switchCapacity = idealPoe.max_cameras ?? 8;
        const switchQty = Math.ceil(selection.camera_count / switchCapacity);
        baseHardwareCost += idealPoe.unit_price * switchQty;
        totalPurchaseCost += (idealPoe.base_cost || 0) * switchQty;
        if ((idealPoe.base_cost || 0) > idealPoe.unit_price) {
          marginWarnings.push(`PoE Switch sold below cost: ${idealPoe.display_name}`);
        }
        lineItems.push({ product_id: idealPoe.id!, display_name: idealPoe.display_name, qty: switchQty, unit_price: idealPoe.unit_price, line_total: idealPoe.unit_price * switchQty });
      }

    } else {
      // --- HD PATH ---

      // 1.1 Select Camera (1-2)
      let hdCameras = products.filter(p => p.category === "camera" && p.technology === "HD" && p.is_active);
      
      // Filter by requested features
      if (selection.requested_features && selection.requested_features.length > 0) {
        hdCameras = hdCameras.filter(cam => {
          if (!cam.features) return false;
          return selection.requested_features!.every(reqFeat => cam.features!.includes(reqFeat));
        });
      }

      // Filter by brand
      if (selection.brand_preference && selection.brand_preference !== "all") {
        hdCameras = hdCameras.filter(p => p.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
      }

      // Filter by budget
      if (selection.max_budget) {
        const estBase = (selection.camera_count * (settings.labor_hd_per_camera || 400)) + 
                        (selection.camera_count * 25 * (settings.cable_copper_coated_hd || 12)) + 
                        4000; // avg DVR + HDD + PSU
        const maxCamPrice = (selection.max_budget - estBase) / selection.camera_count;
        hdCameras = hdCameras.filter(p => p.unit_price <= maxCamPrice);
      }

      // Sort by focus point
      if (selection.focus_point === "quality") {
        hdCameras.sort((a, b) => b.unit_price - a.unit_price);
      } else {
        hdCameras.sort((a, b) => a.unit_price - b.unit_price);
      }

      let selectedCamera: Product | undefined;
      if (selection.selected_camera_id) {
        selectedCamera = products.find(p => p.id === selection.selected_camera_id);
      } else {
        const optionNum = selection.selected_camera_option || 1; // Default to CP Plus 2.4MP
        selectedCamera = hdCameras.find(p => p.technical_name === `cam_hd_opt${optionNum}`) || 
                               hdCameras[Math.min(optionNum - 1, Math.max(0, hdCameras.length - 1))] ||
                               hdCameras[0];
      }

      if (selectedCamera) {
        const lineTotal = selectedCamera.unit_price * selection.camera_count;
        baseHardwareCost += lineTotal;
        totalPurchaseCost += (selectedCamera.base_cost || 0) * selection.camera_count;
        if ((selectedCamera.base_cost || 0) > selectedCamera.unit_price) {
          marginWarnings.push(`Camera option sold below cost: ${selectedCamera.display_name}`);
        }
        lineItems.push({
          product_id: selectedCamera.id!,
          display_name: selectedCamera.display_name,
          qty: selection.camera_count,
          unit_price: selectedCamera.unit_price,
          line_total: lineTotal
        });

        // 1.2 Select compatible DVR using catalog_path
        const camPathHD = selectedCamera.catalog_path || "UNTAGGED";
        const dvrs = products.filter(p =>
          p.category === "recorder" &&
          p.technology === "HD" &&
          p.is_active &&
          (p.compatible_paths ?? []).some(cp => camPathHD.startsWith(cp)) &&
          (p.max_cameras ?? p.channels ?? 0) >= selection.camera_count
        );
        dvrs.sort((a, b) => (a.max_cameras ?? a.channels ?? 0) - (b.max_cameras ?? b.channels ?? 0));
        const selectedDvr = dvrs[0]; // smallest compatible DVR

        if (selectedDvr) {
          baseHardwareCost += selectedDvr.unit_price;
          totalPurchaseCost += (selectedDvr.base_cost || 0);
          if ((selectedDvr.base_cost || 0) > selectedDvr.unit_price) {
            marginWarnings.push(`DVR sold below cost: ${selectedDvr.display_name}`);
          }
          lineItems.push({
            product_id: selectedDvr.id!,
            display_name: selectedDvr.display_name,
            qty: 1,
            unit_price: selectedDvr.unit_price,
            line_total: selectedDvr.unit_price
          });
        }
      }

      // 1.3 Select Power Supply (path-based, capacity-aware)
      const camPathForPsu = selectedCamera?.catalog_path || "UNTAGGED";
      const psuOptions = products.filter(p =>
        p.category === "accessory" &&
        p.technology === "HD" &&
        p.is_active &&
        p.technical_name.startsWith("psu_") &&
        (p.compatible_paths ?? []).some(cp => camPathForPsu.startsWith(cp))
      );
      psuOptions.sort((a, b) => (b.max_cameras ?? 0) - (a.max_cameras ?? 0));
      const idealPsu = psuOptions.find(p => (p.max_cameras ?? 0) >= selection.camera_count) || psuOptions[0];

      if (idealPsu) {
        // For 9-16 cameras, stack multiple PSUs
        const psuCapacity = idealPsu.max_cameras ?? 4;
        const psuQty = Math.ceil(selection.camera_count / psuCapacity);
        baseHardwareCost += idealPsu.unit_price * psuQty;
        totalPurchaseCost += (idealPsu.base_cost || 0) * psuQty;
        if ((idealPsu.base_cost || 0) > idealPsu.unit_price) {
          marginWarnings.push(`Power Supply sold below cost: ${idealPsu.display_name}`);
        }
        lineItems.push({ product_id: idealPsu.id!, display_name: idealPsu.display_name, qty: psuQty, unit_price: idealPsu.unit_price, line_total: idealPsu.unit_price * psuQty });
      }
    }

    // 1.4 Auto-Calculate HDD
    // Use the daily_gb_per_camera from the selected camera (or fallback)
    const selectedCam = lineItems.find(item => products.find(p => p.id === item.product_id)?.category === "camera");
    const camProduct = selectedCam ? products.find(p => p.id === selectedCam.product_id) : null;
    const dailyGB = camProduct?.daily_gb_per_camera || (selection.technology === "IP" ? 10 : 8);
    
    const recordingDays = selection.recording_days || 7; // Fallback to 7 days
    const requiredGB = selection.camera_count * dailyGB * recordingDays;
    const requiredTB = requiredGB / 1000; // Using 1000 as per PDF logic (approx)

    const hdds = products.filter(p => 
      p.category === "accessory" && 
      p.is_active && 
      p.technical_name.toLowerCase().includes("hdd") &&
      (p.technology === selection.technology || p.technology === "both")
    );

    const getTB = (p: Product) => {
      const name = p.technical_name.toLowerCase();
      const tbMatch = name.match(/(\d+)tb/i);
      if (tbMatch) return parseFloat(tbMatch[1]);
      const gbMatch = name.match(/(\d+)gb/i);
      if (gbMatch) return parseFloat(gbMatch[1]) / 1000;
      return 0;
    };

    hdds.sort((a, b) => getTB(a) - getTB(b));
    const selectedHdd = hdds.find(s => getTB(s) >= requiredTB) || hdds[hdds.length - 1];

    if (selectedHdd) {
      baseHardwareCost += selectedHdd.unit_price;
      totalPurchaseCost += (selectedHdd.base_cost || 0);
      if ((selectedHdd.base_cost || 0) > selectedHdd.unit_price) {
        marginWarnings.push(`Storage Drive sold below cost: ${selectedHdd.display_name}`);
      }
      lineItems.push({
        product_id: selectedHdd.id!,
        display_name: selectedHdd.display_name,
        qty: 1,
        unit_price: selectedHdd.unit_price,
        line_total: selectedHdd.unit_price
      });
    }
  }

  // ─────────────────────────────────────────────
  // STEP 2: Cabling & Labor
  // ─────────────────────────────────────────────
  let wireCost = 0;
  let laborCost = 0;

  if (!isIndustrial) {
    // Add installation as a line item to match real quote PDFs
    const laborRate = selection.technology === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
    const laborTotal = laborRate * selection.camera_count;
    lineItems.push({
      product_id: "labor_install",
      display_name: selection.technology === "IP" ? "Installation with RJ45/Clip (in Normal Conditions)" : "Installation with BNC/DC/Clip (in Normal Conditions)",
      qty: selection.camera_count,
      unit_price: laborRate,
      line_total: laborTotal
    });
    baseHardwareCost += laborTotal;
    
    // Wire cost is no longer automatically added; it is an optional add-on in the catalog
    wireCost = 0;
    laborCost = 0; // Set to 0 because we added it to baseHardwareCost

    // HIGH-REACH EQUIPMENT FEE
    if (selection.ceiling_height === "high" || selection.ceiling_height === "very_high") {
      // Inject standard ladder/scaffolding fee. E.g., ₹1000 flat or ₹200 per camera
      // We will do a flat ₹1500 for high ceilings for the crew.
      const highReachFee = 1500;
      lineItems.push({
        product_id: "fee_high_reach",
        display_name: "High-Reach Equipment & Risk Fee (Scaffolding/Tall Ladder)",
        qty: 1,
        unit_price: highReachFee,
        line_total: highReachFee
      });
      baseHardwareCost += highReachFee;
    }
  }

  // ─────────────────────────────────────────────
  // STEP 3: Add-ons
  // ─────────────────────────────────────────────
  let addonsTotal = 0;
  const quoteAddons: QuoteAddon[] = [];

  if (!isIndustrial) {
    for (const addon of addons) {
      if (!addon.is_active) continue;
      const ruleResult = evaluatedAddonRules[addon.id!];
      const action = ruleResult ? ruleResult.action : "show_optional";

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
    
    // AMC CALCULATION (if requested)
    if (selection.wants_amc) {
      const amcPercent = settings.amc_1yr_pct || 15; // 15% hardware cost
      const amcTotal = Math.round(baseHardwareCost * (amcPercent / 100));
      
      addonsTotal += amcTotal;
      quoteAddons.push({
        addon_id: "amc_1yr",
        display_name: `1-Year Annual Maintenance Contract (${amcPercent}% of Hardware)`,
        price: amcTotal,
        qty: 1
      });

      if (activeOffer?.type === "free_amc") {
        addonsTotal -= amcTotal;
        quoteAddons.push({
          addon_id: "promo_free_amc",
          display_name: "Follow-Up Promo: Free 1-Year AMC",
          price: -amcTotal,
          qty: 1
        });
      }
    }
  }

  const grossSubtotal = baseHardwareCost + wireCost + laborCost + addonsTotal;
  
  let campaignDiscount = 0;
  if (activeOffer?.type === "discount_percent" && activeOffer.value) {
    campaignDiscount = Math.round(grossSubtotal * (activeOffer.value / 100));
    // Add it as a line item so it shows up in the addons/discounts section
    addonsTotal -= campaignDiscount;
    quoteAddons.push({
      addon_id: "promo_discount",
      display_name: `Special Promotional Discount (${activeOffer.value}%)`,
      price: -campaignDiscount,
      qty: 1
    });
  }

  // Calculate referral discount after campaign discount
  const adjustedGross = grossSubtotal - campaignDiscount;
  const referralDiscount = Math.round(adjustedGross * (referralDiscountPercent / 100)) + referralDiscountFlat;
  const netTaxableAmount = Math.max(0, adjustedGross - referralDiscount);
  const gstAmount = Math.round(netTaxableAmount * (settings.gst_rate / 100));
  const totalPayable = netTaxableAmount + gstAmount;

  const grossProfitValue = netTaxableAmount - totalPurchaseCost;
  const grossProfitPercent = netTaxableAmount > 0 ? (grossProfitValue / netTaxableAmount) * 100 : 0;
  
  if (settings.minimum_margin_threshold && grossProfitPercent < settings.minimum_margin_threshold) {
    marginWarnings.push(`Overall margin (${grossProfitPercent.toFixed(1)}%) is below minimum threshold (${settings.minimum_margin_threshold}%).`);
  }

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
    total_payable: Math.round(totalPayable),
    requiresIndustrialQuote: isIndustrial,
    total_purchase_cost: Math.round(totalPurchaseCost),
    gross_profit_value: Math.round(grossProfitValue),
    gross_profit_percent: Number(grossProfitPercent.toFixed(2)),
    margin_warnings: marginWarnings
  };
}
