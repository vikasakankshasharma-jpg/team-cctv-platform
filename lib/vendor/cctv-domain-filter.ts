/**
 * @file secure-easy/lib/vendor/cctv-domain-filter.ts
 * @description Enterprise CCTV Domain Filter & Attribute Classifier.
 * Strictly scopes vendor catalog items to genuine CCTV surveillance installations.
 * Permanently filters out non-surveillance consumer clutter (TVs, desktop switches, PC parts).
 * Enforces 100% GST-paid standard with ₹0.00 mathematical reconciliation.
 */

import type { VendorCategory } from "../../types";

export type CCTVDomainCategory =
  | "cctv_camera"
  | "recorder"
  | "storage"
  | "power_device"
  | "cable"
  | "connector"
  | "camera_mount"
  | "rack"
  | "network"
  | "display"
  | "hdmi_cable"
  | "accessories";

export interface ReverseGSTBreakup {
  gross_price: number;
  taxable_base: number;
  cgst_9: number;
  sgst_9: number;
  total_gst: number;
  is_reconciled: boolean;
}

export interface CCTVProductMetadata {
  brand: string | null;
  technology: "HD" | "IP" | "WiFi" | "4G" | "Hybrid" | "Analog" | null;
  form_factor: "Bullet" | "Dome" | "PTZ" | "Turret" | "Cube" | null;
  resolution_mp: number | null;
  channels: number | null;
  storage_capacity: string | null;
  is_surveillance_grade: boolean;
  power_specs: {
    voltage_v?: number | null;
    amperage_a?: number | null;
    wattage_w?: number | null;
    poe_ports?: number | null;
    poe_budget_w?: number | null;
  };
  cable_specs: {
    type?: "3+1" | "CAT6" | "CAT5e" | "2-core" | null;
    length_m?: number | null;
    is_pure_copper?: boolean;
  };
  weatherproof_rating: "IP67" | "IP66" | "Indoor" | null;
  audio_feature: "Built-in Mic" | "Two-Way Audio" | null;
}

export interface InventoryLookupContext {
  isListedInInventory?: boolean;
  inventoryCategory?: CCTVDomainCategory | string;
  matchedSku?: string;
  matchedId?: string;
}

export interface CCTVFilterResult {
  is_cctv_eligible: boolean;
  category: CCTVDomainCategory | "rejected";
  confidence_score: number; // 0 to 100
  rejection_reason?: string;
  metadata: CCTVProductMetadata;
  reverse_gst: ReverseGSTBreakup;
  is_pre_approved_inventory?: boolean;
}

export interface PriceDriftAnalysis {
  old_price: number;
  new_price: number;
  drift_amount: number;
  drift_percent: number;
  has_significant_drift: boolean; // > 5%
  status: "NO_CHANGE" | "SAFE_AUTO_UPDATE" | "HIGH_DRIFT_ADMIN_APPROVAL" | "STOCK_STATUS_CHANGED" | "NEW_PRODUCT";
  alert_message?: string;
  reverse_gst: ReverseGSTBreakup;
}

/**
 * Computes statutory 18% reverse GST breakdown from a GST-inclusive gross price.
 * Formula: Taxable Base = Gross / 1.18
 * CGST = (Gross - Base) / 2
 * SGST = (Gross - Base) - CGST
 * Guaranteed ₹0.00 mathematical reconciliation: Base + Total GST === Gross.
 */
export function calculateReverseGST(grossPrice: number): ReverseGSTBreakup {
  const gross = Math.round(grossPrice * 100) / 100;
  if (gross <= 0) {
    return {
      gross_price: 0,
      taxable_base: 0,
      cgst_9: 0,
      sgst_9: 0,
      total_gst: 0,
      is_reconciled: true,
    };
  }

  const taxableBase = Math.round((gross / 1.18) * 100) / 100;
  const totalGst = Math.round((gross - taxableBase) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = Math.round((totalGst - cgst) * 100) / 100;

  const isReconciled = Math.abs(taxableBase + totalGst - gross) < 0.0001;

  return {
    gross_price: gross,
    taxable_base: taxableBase,
    cgst_9: cgst,
    sgst_9: sgst,
    total_gst: totalGst,
    is_reconciled: isReconciled,
  };
}

/**
 * Analyzes price drift between current system price and newly scraped vendor price.
 * Flags drift > 5% for mandatory admin approval.
 */
export function analyzePriceDrift(
  oldPrice: number,
  newPrice: number,
  stockChanged: boolean = false
): PriceDriftAnalysis {
  const reverseGst = calculateReverseGST(newPrice);
  const oldP = Math.round(oldPrice * 100) / 100;
  const newP = Math.round(newPrice * 100) / 100;

  if (oldP === 0 && newP > 0) {
    return {
      old_price: 0,
      new_price: newP,
      drift_amount: newP,
      drift_percent: 100,
      has_significant_drift: true,
      status: "NEW_PRODUCT",
      alert_message: `New product staged at ₹${newP.toLocaleString("en-IN")} (GST-inclusive)`,
      reverse_gst: reverseGst,
    };
  }

  const driftAmount = Math.round((newP - oldP) * 100) / 100;
  const driftPercent = oldP > 0 ? Math.round((Math.abs(driftAmount) / oldP) * 1000) / 10 : 0;
  const hasSignificantDrift = driftPercent > 5;

  let status: PriceDriftAnalysis["status"] = "NO_CHANGE";
  let alertMessage: string | undefined = undefined;

  if (driftAmount === 0) {
    if (stockChanged) {
      status = "STOCK_STATUS_CHANGED";
      alertMessage = "Price unchanged; vendor stock availability changed.";
    } else {
      status = "NO_CHANGE";
    }
  } else if (hasSignificantDrift) {
    status = "HIGH_DRIFT_ADMIN_APPROVAL";
    alertMessage = `High Price Drift Alert: Cost drifted by ${driftPercent}% (${driftAmount > 0 ? "+" : ""}₹${driftAmount}) from ₹${oldP} to ₹${newP}. Requires Admin Review.`;
  } else {
    status = "SAFE_AUTO_UPDATE";
    alertMessage = `Minor drift of ${driftPercent}% (${driftAmount > 0 ? "+" : ""}₹${driftAmount}). Within 5% auto-sync tolerance.`;
  }

  return {
    old_price: oldP,
    new_price: newP,
    drift_amount: driftAmount,
    drift_percent: driftPercent,
    has_significant_drift: hasSignificantDrift,
    status,
    alert_message: alertMessage,
    reverse_gst: reverseGst,
  };
}

/**
 * Identifies explicitly banned non-CCTV consumer electronics and office clutter.
 */
export function isNonCCTVConsumerProduct(title: string, rawUrl: string = ""): { isRejected: boolean; reason?: string } {
  const t = title.toLowerCase();
  const u = rawUrl.toLowerCase();

  // 1. Consumer Televisions (Bravia, Smart TV, OLED, etc.)
  if (
    u.includes("/display/television") ||
    t.includes("television") ||
    t.includes("smart tv") ||
    t.includes("oled") ||
    t.includes("google tv") ||
    t.includes("android tv") ||
    /\b(sony|samsung|lg|xiaomi|vu|redmi|tcl|oneplus|realme)\s+\d+["']?\s*(inch|4k|led|tv|smart)/i.test(t)
  ) {
    return { isRejected: true, reason: "Consumer entertainment television (not a dedicated CCTV surveillance monitor)" };
  }

  // 2. Desktop unmanaged non-PoE switches (plastic office hubs)
  if (
    u.includes("/networking/networking-desktop-switch") ||
    (t.includes("desktop switch") && !t.includes("poe")) ||
    (t.includes("plastic switch") && !t.includes("poe"))
  ) {
    return { isRejected: true, reason: "Unmanaged desktop switch without PoE (CCTV IP cameras require surveillance PoE switches)" };
  }

  // 3. Consumer PC SATA/NVMe SSDs (not 24/7 surveillance HDDs or endurance MicroSD)
  if (
    (t.includes("internal ssd") || t.includes("nvme") || t.includes("m.2 ssd") || t.includes("sata ssd") || t.includes("a400")) &&
    !t.includes("cctv") && !t.includes("surveillance")
  ) {
    return { isRejected: true, reason: "Consumer PC solid-state drive (unsuitable for 24x7 continuous surveillance write streams)" };
  }

  // 4. Consumer Home Wi-Fi Range Extenders & Mesh Pods (without 4G SIM or outdoor P2P)
  if (
    (t.includes("range extender") || t.includes("repeater") || t.includes("mesh router") || t.includes("halo")) &&
    !t.includes("4g") && !t.includes("sim") && !t.includes("outdoor") && !t.includes("cpe") && !t.includes("p2p") && !t.includes("bridge")
  ) {
    return { isRejected: true, reason: "Consumer indoor home Wi-Fi repeater (not an outdoor CCTV P2P bridge or 4G surveillance router)" };
  }

  // 5. Generic Consumer PC Peripherals & Audio
  if (
    t.includes("keyboard") ||
    t.includes("mouse pad") ||
    t.includes("mousepad") ||
    t.includes("gaming mouse") ||
    t.includes("earphone") ||
    t.includes("headphone") ||
    t.includes("speaker") ||
    t.includes("soundbar") ||
    t.includes("laptop bag") ||
    t.includes("ram ddr") ||
    t.includes("motherboard") ||
    t.includes("thermal paste") ||
    t.includes("toner") ||
    t.includes("ink cartridge")
  ) {
    return { isRejected: true, reason: "General IT / consumer PC peripheral unrelated to CCTV security infrastructure" };
  }

  // 6. Ultra-long commercial AV fiber optic HDMI cables (> 20 meters) not used in standard CCTV installations
  // Note: 1.5m, 3m, 5m, 10m, 15m, and 20m copper HDMI cables are standard CCTV display links (e.g. HDMI-10M, HDMI-15M, HDMI-20M in catalog)
  if (
    t.includes("hdmi") &&
    (/\b(25m|30m|40m|50m|100m|25 meter|30 meter|40 meter|50 meter)\b/i.test(t) || t.includes("optical fiber hdmi") || t.includes("aoc4k") || t.includes("fibre 4k"))
  ) {
    return { isRejected: true, reason: "Ultra-long commercial AV fiber optic cable (>20m); CCTV display installations standardize on 1.5m to 20m copper runs" };
  }

  return { isRejected: false };
}

/**
 * Classifies and verifies a product strictly for CCTV installation setups.
 * SUPREME INVARIANT: If the product is already listed in the platform inventory/product list,
 * it is ALWAYS sovereign, whitelisted, and allowed (admin-analyzed and pre-approved).
 */
export function classifyCCTVProduct(
  title: string,
  rawUrl: string = "",
  hintCategory?: string,
  inventoryContext?: InventoryLookupContext
): CCTVFilterResult {
  const t = title.toLowerCase();
  const u = rawUrl.toLowerCase();

  // SUPREME GROUND TRUTH INVARIANT:
  // If the product is already listed in our system inventory / product list,
  // it is ALWAYS ALLOWED as an admin-analyzed & pre-approved item!
  if (inventoryContext?.isListedInInventory) {
    const validCategory = (inventoryContext.inventoryCategory as CCTVDomainCategory) ||
      (hintCategory as CCTVDomainCategory) ||
      "accessories";
    return {
      is_cctv_eligible: true,
      category: validCategory,
      confidence_score: 100,
      metadata: extractCCTVMetadata(title, validCategory),
      reverse_gst: calculateReverseGST(0),
      is_pre_approved_inventory: true,
    };
  }

  // First, check explicit non-CCTV rejection for NEW unlisted vendor items
  const rejection = isNonCCTVConsumerProduct(title, rawUrl);
  if (rejection.isRejected) {
    return {
      is_cctv_eligible: false,
      category: "rejected",
      confidence_score: 0,
      rejection_reason: rejection.reason,
      metadata: extractCCTVMetadata(title),
      reverse_gst: calculateReverseGST(0),
    };
  }

  // Identify CCTV Subsystem Category (Evaluation Precedence Invariant: Specific Components before Broad Entities)
  let category: CCTVDomainCategory | null = null;
  let confidence = 95;

  // 1. CCTV Display HDMI Cables (1.5m, 3m, 5m, 10m, 15m, 20m for DVR/NVR to security display monitor)
  if (
    t.includes("hdmi") &&
    (/\b(1\.5m|1\.5 meter|2m|3m|3 meter|5m|5 meter|10m|10 meter|15m|15 meter|20m|20 meter)\b/i.test(t) || u.includes("/cables2/hdmi-cables"))
  ) {
    category = "hdmi_cable";
  }
  // 2. Connectors: BNC, 12V DC Pin, RJ45 Modular Plug (Check before camera!)
  else if (
    t.includes("bnc") ||
    t.includes("dc pin") ||
    t.includes("dc power pin") ||
    t.includes("power pin") ||
    t.includes("dc jack") ||
    t.includes("dc female") ||
    t.includes("dc male") ||
    (t.includes("connector") && (t.includes("pin") || t.includes("plug") || t.includes("jack") || t.includes("dc") || t.includes("video") || t.includes("cctv"))) ||
    (t.includes("rj45") && (t.includes("connector") || t.includes("plug") || t.includes("modular")))
  ) {
    category = "connector";
  }
  // 3. Camera Mount / Junction Box: PVC Weatherproof Junction Box, CCTV Brackets (Check before camera!)
  else if (
    t.includes("pvc box") ||
    t.includes("junction box") ||
    t.includes("cctv box") ||
    t.includes("camera mount") ||
    t.includes("cctv stand") ||
    t.includes("camera stand") ||
    (t.includes("bracket") && !t.includes("camera"))
  ) {
    category = "camera_mount";
  }
  // 4. Storage: 24x7 Surveillance HDDs & Surveillance MicroSD Cards (Check before camera!)
  else if (
    t.includes("surveillance hard disk") ||
    t.includes("skyhawk") ||
    t.includes("purple") ||
    t.includes("s300") ||
    (t.includes("hdd") && (t.includes("surveillance") || t.includes("cctv"))) ||
    t.includes("micro sd") ||
    t.includes("microsd") ||
    t.includes("sd card") ||
    t.includes("memory card") ||
    u.includes("/data-storage/sd") ||
    u.includes("/data-storage/surveillance-hard-disk")
  ) {
    category = "storage";
  }
  // 5. Cable: 3+1 Coaxial CCTV Cable, CAT6 Pure Copper LAN Cable, 2-Core Power Wire (Check before camera!)
  else if (
    t.includes("3+1") ||
    t.includes("3:1") ||
    (t.includes("cctv cable") || t.includes("coaxial")) ||
    (t.includes("cat6") && (t.includes("305m") || t.includes("100m") || t.includes("copper") || t.includes("cable") || t.includes("roll") || t.includes("bundle"))) ||
    t.includes("2-core") ||
    u.includes("/cables2/31-cctv-cables") ||
    u.includes("/cables2/lan-cables-cat6")
  ) {
    category = "cable";
  }
  // 6. Power Devices: CCTV SMPS (12V Multi-Channel), PoE Switches, 12V Adapters (Check before camera!)
  else if (
    t.includes("smps") ||
    t.includes("power supply") ||
    t.includes("poe switch") ||
    t.includes("poe injector") ||
    (t.includes("adapter") && (t.includes("12v") || t.includes("cctv") || t.includes("camera"))) ||
    u.includes("/security/power-supply-adapter") ||
    u.includes("/networking/poe-switch")
  ) {
    category = "power_device";
  }
  // 7. Surveillance Racks: 2U, 3U, 4U, 6U Wall Mount CCTV Racks (Check before DVR!)
  else if (
    (t.includes("rack") || t.includes("cabinet")) &&
    (t.includes("2u") || t.includes("3u") || t.includes("4u") || t.includes("6u") || t.includes("cctv") || u.includes("/security/rack"))
  ) {
    category = "rack";
  }
  // 8. CCTV Network Transmission: Point-to-Point (P2P) Wireless Bridge, 4G SIM Surveillance Router
  else if (
    t.includes("point to point") ||
    t.includes("p2p") ||
    t.includes("cpe") ||
    t.includes("wireless bridge") ||
    (t.includes("router") && (t.includes("4g") || t.includes("sim") || t.includes("lte") || t.includes("outdoor"))) ||
    u.includes("/networking/point-to-point-p2p")
  ) {
    category = "network";
  }
  // 9. Dedicated CCTV Display Monitors
  else if (
    (t.includes("monitor") || t.includes("led monitor")) &&
    (t.includes("cctv") || t.includes("surveillance") || t.includes("hdmi") || u.includes("/display/led-monitor")) &&
    !t.includes("smart tv") && !t.includes("television")
  ) {
    category = "display";
  }
  // 10. Recorder: DVR, NVR, XVR (Check before camera!)
  else if (
    t.includes("dvr") ||
    t.includes("nvr") ||
    t.includes("xvr") ||
    t.includes("recorder") ||
    u.includes("/security/hd-dvr") ||
    u.includes("/security/ip-nvr")
  ) {
    category = "recorder";
  }
  // 11. CCTV Camera: HD, IP, WiFi, 4G, PTZ, Dome, Bullet, Turret, Cube
  else if (
    t.includes("camera") ||
    t.includes("bullet") ||
    t.includes("dome") ||
    t.includes("ptz") ||
    t.includes("turret") ||
    t.includes("fisheye") ||
    u.includes("/security/hd-camera") ||
    u.includes("/security/ip-camera") ||
    u.includes("/security/ptz-pt-4g-wifi-camera")
  ) {
    category = "cctv_camera";
  }

  // Fallback to hintCategory if valid CCTV category
  if (!category && hintCategory) {
    const validCCTVCats: CCTVDomainCategory[] = [
      "cctv_camera", "recorder", "storage", "power_device", "cable",
      "connector", "camera_mount", "rack", "network", "display", "hdmi_cable", "accessories"
    ];
    if (validCCTVCats.includes(hintCategory as CCTVDomainCategory)) {
      category = hintCategory as CCTVDomainCategory;
      confidence = 75;
    }
  }

  if (!category) {
    return {
      is_cctv_eligible: false,
      category: "rejected",
      confidence_score: 20,
      rejection_reason: "Item does not belong to any recognized CCTV installation subsystem (camera, recorder, surveillance storage, power, cabling, mount, rack, or transmission)",
      metadata: extractCCTVMetadata(title),
      reverse_gst: calculateReverseGST(0),
    };
  }

  const metadata = extractCCTVMetadata(title, category);

  return {
    is_cctv_eligible: true,
    category,
    confidence_score: confidence,
    metadata,
    reverse_gst: calculateReverseGST(0),
  };
}

/**
 * Extracts rich surveillance hardware attributes from product title.
 */
export function extractCCTVMetadata(title: string, category?: CCTVDomainCategory): CCTVProductMetadata {
  const t = title.toLowerCase();

  // 1. Brand Extraction
  let brand: string | null = null;
  if (t.includes("cp plus") || t.includes("cp-plus") || t.includes("cpplus")) brand = "CP Plus";
  else if (t.includes("hikvision")) brand = "Hikvision";
  else if (t.includes("dahua")) brand = "Dahua";
  else if (t.includes("prama")) brand = "Prama";
  else if (t.includes("trueview")) brand = "Trueview";
  else if (t.includes("seagate")) brand = "Seagate";
  else if (t.includes("western digital") || t.includes("wd ") || t.includes("wd purple")) brand = "WD";
  else if (t.includes("toshiba")) brand = "Toshiba";
  else if (t.includes("consistent")) brand = "Consistent";
  else if (t.includes("d-link") || t.includes("dlink")) brand = "D-Link";
  else if (t.includes("tp-link") || t.includes("tplink")) brand = "TP-Link";
  else if (t.includes("securelink") || t.includes("secureye")) brand = "Securelink";
  else if (t.includes("hi-focus") || t.includes("hifocus")) brand = "Hi-Focus";
  else if (t.includes("a+ products") || t.includes("apl")) brand = "A+ Products";
  else if (t.includes("erd")) brand = "ERD";
  else if (t.includes("kingston")) brand = "Kingston";
  else if (t.includes("sandisk")) brand = "SanDisk";

  // 2. Technology Extraction
  let technology: CCTVProductMetadata["technology"] = null;
  if (t.includes("4g") || t.includes("lte") || t.includes("sim")) technology = "4G";
  else if (t.includes("wifi") || t.includes("wi-fi") || t.includes("wireless")) technology = "WiFi";
  else if (t.includes("ip") || t.includes("network") || t.includes("poe")) technology = "IP";
  else if (t.includes("hd") || t.includes("ahd") || t.includes("tvi") || t.includes("cvi") || t.includes("analog")) technology = "HD";
  else if (t.includes("hybrid") || t.includes("xvr") || t.includes("tribrid")) technology = "Hybrid";

  // 3. Form Factor Extraction
  let form_factor: CCTVProductMetadata["form_factor"] = null;
  if (t.includes("ptz") || t.includes("pan tilt") || /\bpt\b/i.test(t)) form_factor = "PTZ";
  else if (t.includes("bullet")) form_factor = "Bullet";
  else if (t.includes("dome")) form_factor = "Dome";
  else if (t.includes("turret") || t.includes("eyeball")) form_factor = "Turret";
  else if (t.includes("cube")) form_factor = "Cube";

  // 4. Resolution Extraction
  let resolution_mp: number | null = null;
  if (t.includes("2.4mp") || t.includes("2.4 mp")) resolution_mp = 2.4;
  else if (t.includes("2mp") || t.includes("2 mp") || t.includes("1080p") || t.includes("full hd")) resolution_mp = 2;
  else if (t.includes("3mp") || t.includes("3 mp")) resolution_mp = 3;
  else if (t.includes("4mp") || t.includes("4 mp") || t.includes("2k")) resolution_mp = 4;
  else if (t.includes("5mp") || t.includes("5 mp")) resolution_mp = 5;
  else if (t.includes("8mp") || t.includes("8 mp") || t.includes("4k")) resolution_mp = 8;

  // 5. Recorder / SMPS Channels Extraction
  let channels: number | null = null;
  const chMatch = t.match(/(\d+)\s*(?:ch|channel|port|pt)\b/i);
  if (chMatch) channels = parseInt(chMatch[1], 10);

  // 6. Storage Capacity & Surveillance Grade
  let storage_capacity: string | null = null;
  const tbMatch = t.match(/(\d+)\s*tb\b/i);
  const gbMatch = t.match(/(\d+)\s*gb\b/i);
  if (tbMatch) storage_capacity = `${tbMatch[1]}TB`;
  else if (gbMatch) storage_capacity = `${gbMatch[1]}GB`;

  const is_surveillance_grade =
    t.includes("purple") ||
    t.includes("skyhawk") ||
    t.includes("s300") ||
    t.includes("surveillance") ||
    t.includes("high endurance") ||
    (t.includes("micro sd") && (t.includes("purple") || t.includes("endurance") || t.includes("consistent")));

  // 7. Power Specs
  const voltageMatch = t.match(/(\d+(?:\.\d+)?)\s*v\b/i);
  const amperageMatch = t.match(/(\d+(?:\.\d+)?)\s*a\b/i);
  const wattageMatch = t.match(/(\d+(?:\.\d+)?)\s*w\b/i);
  const poePortMatch = t.match(/(\d+)\s*(?:port|ch)\s*poe/i);

  // 8. Cable Specs
  let cableType: "3+1" | "CAT6" | "CAT5e" | "2-core" | null = null;
  if (t.includes("3+1") || t.includes("3:1") || t.includes("coaxial")) cableType = "3+1";
  else if (t.includes("cat6")) cableType = "CAT6";
  else if (t.includes("cat5")) cableType = "CAT5e";
  else if (t.includes("2-core") || t.includes("2 core")) cableType = "2-core";

  const lengthMatch = t.match(/(\d+)\s*(?:m|meter|mtr|meters)\b/i);
  const length_m = lengthMatch ? parseInt(lengthMatch[1], 10) : (t.includes("305m") ? 305 : (t.includes("90m") ? 90 : (t.includes("180m") ? 180 : null)));
  const is_pure_copper = t.includes("pure copper") || t.includes("solid copper") || t.includes("cu ") || (!t.includes("cca") && (t.includes("d-link") || t.includes("dlink")));

  // 9. Weatherproof
  let weatherproof_rating: CCTVProductMetadata["weatherproof_rating"] = null;
  if (t.includes("ip67")) weatherproof_rating = "IP67";
  else if (t.includes("ip66")) weatherproof_rating = "IP66";
  else if (t.includes("outdoor") || form_factor === "Bullet") weatherproof_rating = "IP67";
  else if (t.includes("indoor") || form_factor === "Dome") weatherproof_rating = "Indoor";

  // 10. Audio Support
  let audio_feature: CCTVProductMetadata["audio_feature"] = null;
  if (t.includes("two-way") || t.includes("2-way") || t.includes("talk") || t.includes("speaker")) audio_feature = "Two-Way Audio";
  else if (t.includes("audio") || t.includes("mic") || t.includes("built-in mic") || t.includes("with mic")) audio_feature = "Built-in Mic";

  return {
    brand,
    technology,
    form_factor,
    resolution_mp,
    channels,
    storage_capacity,
    is_surveillance_grade,
    power_specs: {
      voltage_v: voltageMatch ? parseFloat(voltageMatch[1]) : null,
      amperage_a: amperageMatch ? parseFloat(amperageMatch[1]) : null,
      wattage_w: wattageMatch ? parseFloat(wattageMatch[1]) : null,
      poe_ports: poePortMatch ? parseInt(poePortMatch[1], 10) : (category === "power_device" && channels ? channels : null),
      poe_budget_w: wattageMatch ? parseFloat(wattageMatch[1]) : null,
    },
    cable_specs: {
      type: cableType,
      length_m,
      is_pure_copper,
    },
    weatherproof_rating,
    audio_feature,
  };
}
