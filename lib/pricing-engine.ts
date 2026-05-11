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
  let wireCost = 0;
  let laborCost = 0;
  let addonsTotal = 0;
  const quoteAddons: QuoteAddon[] = [];
  const marginWarnings: string[] = [];

  // ─────────────────────────────────────────────
  // STEP 1: Process Technology Paths
  // ─────────────────────────────────────────────

  // Detect technology from selected camera if possible
  let effectiveTech = selection.technology;
  if (selection.selected_camera_id) {
    const cam = products.find(p => p.id === selection.selected_camera_id);
    if (cam && cam.technology && cam.technology !== "both") {
      effectiveTech = cam.technology as "HD" | "IP";
    }
  }

  if (!isIndustrial) {
    if (effectiveTech === "IP") {
      // --- IP PATH ---

      const hasFeature = (cam: Product, reqFeat: string) => {
        const rf = reqFeat.toLowerCase();
        const camFeats = (cam.features || []).map(f => f.toLowerCase());
        const name = (cam.display_name + " " + cam.technical_name).toLowerCase();
        
        const check = (tag: string) => camFeats.includes(tag) || name.includes(tag);

        if (rf === "mic" || rf === "audio") return check("mic") || check("audio");
        if (rf === "color" || rf === "color_night") return check("color") || check("color_night");
        if (rf === "ptz") return check("ptz");
        if (rf === "wifi") return check("wifi");
        
        return check(rf);
      };

      // 1.1 Select Camera (1-5)
      let ipCameras = products.filter(p => p.category === "camera" && p.technology === "IP" && p.is_active);
      
      if (selection.requested_features && selection.requested_features.length > 0) {
        ipCameras = ipCameras.filter(cam => {
          return selection.requested_features!.every(reqFeat => hasFeature(cam, reqFeat));
        });
      }

      if (ipCameras.length === 0) {
        ipCameras = products.filter(p => p.category === "camera" && p.technology === "IP" && p.is_active);
      }

      if (selection.brand_preference && selection.brand_preference !== "all") {
        const branded = ipCameras.filter(p => p.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
        if (branded.length > 0) ipCameras = branded;
      }

      if (selection.max_budget) {
        const estBase = (selection.camera_count * (settings.labor_ip_per_camera || 500)) + 
                        (selection.camera_count * 25 * (settings.cable_copper_coated_ip || 40)) + 
                        5000;
        const maxCamPrice = (selection.max_budget - estBase) / selection.camera_count;
        const affordable = ipCameras.filter(p => p.unit_price <= maxCamPrice);
        if (affordable.length > 0) ipCameras = affordable;
      }

      if (selection.focus_point === "quality") {
        ipCameras.sort((a, b) => b.unit_price - a.unit_price);
      } else {
        ipCameras.sort((a, b) => a.unit_price - b.unit_price);
      }

      let selectedCamera: Product | undefined;
      if (selection.selected_camera_id) {
        selectedCamera = products.find(p => p.id === selection.selected_camera_id);
      } else {
        const optionNum = selection.selected_camera_option || 1;
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
        lineItems.push({
          product_id: selectedCamera.id!,
          display_name: selectedCamera.display_name,
          brand: selectedCamera.brand,
          qty: selection.camera_count,
          unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      // 1.2 Select compatible NVR
      const camPath = selectedCamera?.catalog_path || "UNTAGGED";
      let nvrs = products.filter(p =>
        p.category === "recorder" &&
        p.technology === "IP" &&
        p.is_active &&
        (p.max_cameras ?? p.channels ?? 0) >= selection.camera_count
      );
      const pathMatchedNvrs = nvrs.filter(p => (p.compatible_paths ?? []).some(cp => camPath.startsWith(cp)));
      if (pathMatchedNvrs.length > 0) nvrs = pathMatchedNvrs;
      nvrs.sort((a, b) => (a.max_cameras ?? a.channels ?? 0) - (b.max_cameras ?? b.channels ?? 0));
      const selectedNvr = nvrs[0];

      if (selectedNvr) {
        baseHardwareCost += selectedNvr.unit_price;
        totalPurchaseCost += (selectedNvr.base_cost || 0);
        lineItems.push({
          product_id: selectedNvr.id!,
          display_name: selectedNvr.display_name,
          brand: selectedNvr.brand,
          qty: 1,
          unit_price: selectedNvr.unit_price,
          line_total: selectedNvr.unit_price
        });
      }

      // 1.3 Select PoE Switch
      let poeOptions = products.filter(p =>
        p.category === "accessory" &&
        p.technology === "IP" &&
        p.is_active &&
        p.technical_name.startsWith("poe_")
      );
      const pathMatchedPoe = poeOptions.filter(p => (p.compatible_paths ?? []).some(cp => camPath.startsWith(cp)));
      if (pathMatchedPoe.length > 0) poeOptions = pathMatchedPoe;
      poeOptions.sort((a, b) => (a.max_cameras ?? 0) - (b.max_cameras ?? 0));
      const idealPoe = poeOptions.find(p => (p.max_cameras ?? 0) >= selection.camera_count) || poeOptions[poeOptions.length - 1];

      if (idealPoe) {
        const switchCapacity = idealPoe.max_cameras ?? 8;
        const switchQty = Math.ceil(selection.camera_count / switchCapacity);
        baseHardwareCost += idealPoe.unit_price * switchQty;
        totalPurchaseCost += (idealPoe.base_cost || 0) * switchQty;
        lineItems.push({ product_id: idealPoe.id!, display_name: idealPoe.display_name, qty: switchQty, unit_price: idealPoe.unit_price, line_total: idealPoe.unit_price * switchQty });
      }

    } else {
      // --- HD PATH ---
      
      const hasFeature = (cam: Product, reqFeat: string) => {
        const rf = reqFeat.toLowerCase();
        const camFeats = (cam.features || []).map(f => f.toLowerCase());
        const name = (cam.display_name + " " + cam.technical_name).toLowerCase();
        const check = (tag: string) => camFeats.includes(tag) || name.includes(tag);
        if (rf === "mic" || rf === "audio") return check("mic") || check("audio");
        if (rf === "color" || rf === "color_night") return check("color") || check("color_night");
        return check(rf);
      };

      // 1.1 Select Camera (1-2)
      let hdCameras = products.filter(p => p.category === "camera" && p.technology === "HD" && p.is_active);
      
      if (selection.requested_features && selection.requested_features.length > 0) {
        hdCameras = hdCameras.filter(cam => {
          return selection.requested_features!.every(reqFeat => hasFeature(cam, reqFeat));
        });
      }
      if (hdCameras.length === 0) {
        hdCameras = products.filter(p => p.category === "camera" && p.technology === "HD" && p.is_active);
      }

      if (selection.brand_preference && selection.brand_preference !== "all") {
        const branded = hdCameras.filter(p => p.brand?.toLowerCase() === selection.brand_preference?.toLowerCase());
        if (branded.length > 0) hdCameras = branded;
      }

      if (selection.max_budget) {
        const estBase = (selection.camera_count * (settings.labor_hd_per_camera || 400)) + 
                        (selection.camera_count * 25 * (settings.cable_copper_coated_hd || 12)) + 
                        4000;
        const maxCamPrice = (selection.max_budget - estBase) / selection.camera_count;
        const affordable = hdCameras.filter(p => p.unit_price <= maxCamPrice);
        if (affordable.length > 0) hdCameras = affordable;
      }

      if (selection.focus_point === "quality") {
        hdCameras.sort((a, b) => b.unit_price - a.unit_price);
      } else {
        hdCameras.sort((a, b) => a.unit_price - b.unit_price);
      }

      let selectedCamera: Product | undefined;
      if (selection.selected_camera_id) {
        selectedCamera = products.find(p => p.id === selection.selected_camera_id);
      } else {
        const optionNum = selection.selected_camera_option || 1;
        selectedCamera = hdCameras.find(p => p.technical_name === `cam_hd_opt${optionNum}`) || 
                         hdCameras[Math.min(optionNum - 1, Math.max(0, hdCameras.length - 1))] ||
                         hdCameras[0];
      }

      if (selectedCamera) {
        const lineTotal = selectedCamera.unit_price * selection.camera_count;
        baseHardwareCost += lineTotal;
        totalPurchaseCost += (selectedCamera.base_cost || 0) * selection.camera_count;
        lineItems.push({
          product_id: selectedCamera.id!,
          display_name: selectedCamera.display_name,
          brand: selectedCamera.brand,
          qty: selection.camera_count,
          unit_price: selectedCamera.unit_price,
          line_total: lineTotal
        });

        // 1.2 Select compatible DVR
        const camPathHD = selectedCamera.catalog_path || "UNTAGGED";
        let dvrs = products.filter(p =>
          p.category === "recorder" &&
          p.technology === "HD" &&
          p.is_active &&
          (p.max_cameras ?? p.channels ?? 0) >= selection.camera_count
        );
        const pathMatchedDvrs = dvrs.filter(p => (p.compatible_paths ?? []).some(cp => camPathHD.startsWith(cp)));
        if (pathMatchedDvrs.length > 0) dvrs = pathMatchedDvrs;
        dvrs.sort((a, b) => (a.max_cameras ?? a.channels ?? 0) - (b.max_cameras ?? b.channels ?? 0));
        const selectedDvr = dvrs[0];

        if (selectedDvr) {
          baseHardwareCost += selectedDvr.unit_price;
          totalPurchaseCost += (selectedDvr.base_cost || 0);
          lineItems.push({
            product_id: selectedDvr.id!,
            display_name: selectedDvr.display_name,
            brand: selectedDvr.brand,
            qty: 1,
            unit_price: selectedDvr.unit_price,
            line_total: selectedDvr.unit_price
          });
        }
      }

      // 1.3 Select Power Supply
      const camPathForPsu = selectedCamera?.catalog_path || "UNTAGGED";
      let psuOptions = products.filter(p =>
        p.category === "accessory" &&
        p.technology === "HD" &&
        p.is_active &&
        p.technical_name.startsWith("psu_")
      );
      const pathMatchedPsu = psuOptions.filter(p => (p.compatible_paths ?? []).some(cp => camPathForPsu.startsWith(cp)));
      if (pathMatchedPsu.length > 0) psuOptions = pathMatchedPsu;
      psuOptions.sort((a, b) => (a.max_cameras ?? 0) - (b.max_cameras ?? 0));
      const idealPsu = psuOptions.find(p => (p.max_cameras ?? 0) >= selection.camera_count) || psuOptions[0];

      if (idealPsu) {
        const psuCapacity = idealPsu.max_cameras ?? 4;
        const psuQty = Math.ceil(selection.camera_count / psuCapacity);
        baseHardwareCost += idealPsu.unit_price * psuQty;
        totalPurchaseCost += (idealPsu.base_cost || 0) * psuQty;
        lineItems.push({ product_id: idealPsu.id!, display_name: idealPsu.display_name, qty: psuQty, unit_price: idealPsu.unit_price, line_total: idealPsu.unit_price * psuQty });
      }
    }

    // 1.4 Auto-Calculate HDD
    const selectedCam = lineItems.find(item => products.find(p => p.id === item.product_id)?.category === "camera");
    const camProduct = selectedCam ? products.find(p => p.id === selectedCam.product_id) : null;
    const dailyGB = camProduct?.daily_gb_per_camera || (selection.technology === "IP" ? 10 : 8);
    const recordingDays = selection.recording_days || 7;
    const requiredGB = selection.camera_count * dailyGB * recordingDays;
    const requiredTB = requiredGB / 1000;

    const hdds = products.filter(p => 
      p.category === "accessory" && 
      p.is_active && 
      p.technical_name.toLowerCase().includes("hdd") &&
      (p.technology === effectiveTech || p.technology === "both")
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
      lineItems.push({ 
        product_id: selectedHdd.id!, 
        display_name: selectedHdd.display_name, 
        brand: selectedHdd.brand,
        qty: 1, 
        unit_price: selectedHdd.unit_price, 
        line_total: selectedHdd.unit_price 
      });
    }

    // ─────────────────────────────────────────────
    // STEP 2: Cabling & Labor
    // ─────────────────────────────────────────────
    let wireCost = 0;
    let laborCost = 0;

    const laborRate = effectiveTech === "IP" ? (settings.labor_ip_per_camera || 500) : (settings.labor_hd_per_camera || 400);
    const laborTotal = laborRate * selection.camera_count;
    lineItems.push({
      product_id: "labor_install",
      display_name: selection.technology === "IP" ? "Installation with RJ45/Clip (in Normal Conditions)" : "Installation with BNC/DC/Clip (in Normal Conditions)",
      qty: selection.camera_count,
      unit_price: laborRate,
      line_total: laborTotal
    });
    baseHardwareCost += laborTotal;

    // HIGH-REACH EQUIPMENT FEE
    if (selection.ceiling_height === "high" || selection.ceiling_height === "very_high") {
      const highReachFee = 1500;
      baseHardwareCost += highReachFee;
      lineItems.push({ product_id: "fee_high_reach", display_name: "High-Reach Equipment & Safety Fee", qty: 1, unit_price: highReachFee, line_total: highReachFee });
    }

    // ─────────────────────────────────────────────
    // STEP 3: Add-ons & Discounts
    // ─────────────────────────────────────────────

    if (selection.selected_addons && selection.selected_addons.length > 0) {
      selection.selected_addons.forEach(addonId => {
        const addon = addons.find(a => a.id === addonId);
        if (addon) {
          let price = addon.price;
          let qty = 1;
          if (addon.pricing_type === "per_camera") qty = selection.camera_count;
          const lineTotal = price * qty;
          addonsTotal += lineTotal;
          quoteAddons.push({ addon_id: addon.id!, display_name: addon.display_name, price: price, qty: qty });
        }
      });
    }

    // Auto-AMC if selected
    if (selection.selected_addons?.includes("amc_1yr")) {
      const amcPercent = settings.amc_1yr_pct || 15;
      const amcTotal = Math.round(baseHardwareCost * (amcPercent / 100));
      addonsTotal += amcTotal;
      quoteAddons.push({ addon_id: "amc_1yr", display_name: `1-Year Annual Maintenance Contract (${amcPercent}% of Hardware)`, price: amcTotal, qty: 1 });

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
    addonsTotal -= campaignDiscount;
    quoteAddons.push({ addon_id: "promo_discount", display_name: `Special Promotional Discount (${activeOffer.value}%)`, price: -campaignDiscount, qty: 1 });
  }

  const adjustedGross = grossSubtotal - campaignDiscount;
  const referralDiscount = Math.round(adjustedGross * (referralDiscountPercent / 100)) + referralDiscountFlat;
  const netTaxableAmount = Math.max(0, adjustedGross - referralDiscount);
  const gstAmount = Math.round(netTaxableAmount * (settings.gst_rate / 100));
  const totalPayable = netTaxableAmount + gstAmount;

  const grossProfitValue = netTaxableAmount - totalPurchaseCost;
  const grossProfitPercent = netTaxableAmount > 0 ? (grossProfitValue / netTaxableAmount) * 100 : 0;
  
  if (settings.minimum_margin_threshold && grossProfitPercent < settings.minimum_margin_threshold) {
    marginWarnings.push(`Overall margin (${grossProfitPercent.toFixed(1)}%) is below minimum threshold.`);
  }

  return {
    plan_type: selection.plan_type,
    technology: effectiveTech || selection.technology,
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
