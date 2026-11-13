import type { CanonicalRequirement, CameraRequirement } from "../schema/canonical-requirement.ts";
import { WIRELESS_FAMILIES, type Technology } from "../schema/enums.ts";
import type { FrozenContext, FrozenProduct } from "../types/certification.ts";
import { isQuotableProduct, productChannelCapacity, productSupportsTechnology } from "../types/oracle.ts";

export interface BomLine {
  sku: string;
  quantity: number;
  unit_price?: number;
  reason: string;
}

export interface OracleBom {
  cameras: BomLine[];
  recorder?: BomLine;
  storage: BomLine[];
  power: BomLine[];
  connectors: BomLine[];
  junction_boxes?: BomLine;
  junction_lines?: BomLine[];
  cabling?: {
    cable_meters: number;
    wastage_factor: number;
    labour_free_meters_per_camera: number;
    margin_percent: number;
    cable_lines?: BomLine[];
  };
  wireless_families: string[];
  manual_quote: boolean;
  issues: string[];
}

function productKey(product: FrozenProduct): string {
  return product.id ?? product.sku;
}

function cameraCount(requirement: CanonicalRequirement, technology?: Technology): number {
  const explicit = requirement.cameras
    .filter((camera) => !technology || camera.technology === technology)
    .reduce((sum, camera) => sum + camera.count, 0);
  if (explicit > 0 || requirement.cameras.length > 0) return explicit;
  return technology === requirement.technology || technology === undefined ? requirement.camera_count : 0;
}

function effectiveCameraRequirements(requirement: CanonicalRequirement): CameraRequirement[] {
  if (requirement.cameras.length > 0) return [...requirement.cameras];
  if (requirement.camera_count <= 0 || !requirement.technology) return [];
  return [{ technology: requirement.technology, count: requirement.camera_count }];
}

function parseMp(value?: string): number {
  if (!value) return 0;
  const normalized = value.trim().toLowerCase();
  if (/\b4k\b/.test(normalized)) return 8;
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:mp|megapixel)/i);
  return match ? Number(match[1]) : 0;
}

function parseProductMp(product: FrozenProduct): number {
  const explicit =
    Number((product as any).max_supported_resolution_mp) ||
    Number((product as any).max_supported_mp) ||
    Number((product as any).resolution_mp) ||
    0;
  if (explicit > 0) return explicit;
  return parseMp(product.resolution) || parseMp(product.resolution_tier) || parseMp(nameText(product));
}

function recorderMinimumMp(maxMp: number): number {
  if (maxMp <= 2) return 2;
  if (maxMp <= 5) return 5;
  return 8;
}

function selectCheapestCompatible(products: readonly FrozenProduct[], predicate: (product: FrozenProduct) => boolean): FrozenProduct | undefined {
  return products
    .filter((product) => isQuotableProduct(product) && predicate(product))
    .sort((a, b) => (a.unit_price ?? Number.POSITIVE_INFINITY) - (b.unit_price ?? Number.POSITIVE_INFINITY))[0];
}

function nameText(product: FrozenProduct): string {
  return `${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`.toLowerCase();
}

function brandMatches(product: FrozenProduct, brand?: string): boolean {
  return !brand || brand.toLowerCase() === "all" || `${product.brand ?? ""} ${product.model ?? ""} ${product.display_name ?? product.name ?? ""}`.toLowerCase().includes(brand.toLowerCase());
}

function isProductWeatherproof(product: FrozenProduct): boolean {
  const rawIp = product.ip_rating || (product as any).specifications?.ip_rating || (product as any).specifications?.ipRating || "";
  const ip = String(rawIp).toUpperCase().trim();
  const form = String(product.form_factor || "").toLowerCase().trim();
  const inOut = String((product as any).indoor_outdoor || "").toLowerCase().trim();

  if (
    ip === "INDOOR" ||
    ip === "INDOOR ONLY" ||
    ip === "NONE" ||
    ip === "IP20" ||
    ip === "IP40" ||
    form === "indoor_pt" ||
    form === "indoor" ||
    inOut === "indoor"
  ) {
    return false;
  }
  if (/^IP6[5-8]/i.test(ip)) return true;
  if (inOut === "outdoor" || inOut === "both" || inOut === "indoor/outdoor") {
    if (String((product as any).body_material ?? "").toLowerCase() === "metal" || form === "outdoor_pt") return true;
  }
  if (form === "bullet" && ip !== "INDOOR" && inOut !== "indoor") return true;
  if (nameText(product).includes("bullet") || nameText(product).includes("outdoor")) return true;
  return false;
}

function isProductIndoorSafe(product: FrozenProduct): boolean {
  const rawIp = product.ip_rating || (product as any).specifications?.ip_rating || (product as any).specifications?.ipRating || "";
  const ip = String(rawIp).toUpperCase().trim();
  const form = String(product.form_factor || "").toLowerCase().trim();
  const inOut = String((product as any).indoor_outdoor || "").toLowerCase().trim();

  if (ip === "INDOOR" || ip === "INDOOR ONLY" || ip === "IP20" || ip === "IP40" || inOut === "indoor") return true;
  if (form === "dome" || form === "indoor_pt" || form === "indoor" || form === "turret" || form === "cube" || form === "box") return true;
  if (nameText(product).includes("dome") || nameText(product).includes("indoor")) return true;
  return !isProductWeatherproof(product);
}

function productSupportsPowerTech(product: FrozenProduct, targetTech: Technology): boolean {
  const techs = (Array.isArray(product.technologies) ? product.technologies : [product.technology])
    .filter(Boolean)
    .map((t) => String(t).toUpperCase());
  if (techs.includes("COMMON") || techs.includes("BOTH")) return true;
  if (productSupportsTechnology(product, targetTech)) return true;
  const upperText = `${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`.toUpperCase();
  if (targetTech === "HD") {
    if (upperText.includes("NVR") || upperText.includes("POE") || upperText.includes("RJ45")) return false;
    return upperText.includes("SMPS") || upperText.includes("PSU") || upperText.includes("HD");
  }
  if (targetTech === "IP") {
    if (upperText.includes("SMPS") || upperText.includes("DVR")) return false;
    return upperText.includes("POE") || upperText.includes("IP");
  }
  return false;
}

function selectCameraProduct(context: FrozenContext, camera: CameraRequirement, requirement: CanonicalRequirement): FrozenProduct | undefined {
  let pool = context.products.filter(
    (product) =>
      isQuotableProduct(product) &&
      (!product.category || product.category === "cctv_camera") &&
      productSupportsTechnology(product, camera.technology),
  );

  // Specialty guardrail mirrors production resolveCamera
  const featuresLower = (camera.requested_features ?? []).map((f) => f.toLowerCase().trim());
  const wirelessFamilyLower = String(camera.wireless_family ?? "").toLowerCase();
  const hasSpecialtyReq =
    featuresLower.some((f) => ["ptz", "solar", "4g", "wireless", "panoramic"].includes(f)) ||
    wirelessFamilyLower.includes("ptz") ||
    wirelessFamilyLower.includes("4g") ||
    wirelessFamilyLower.includes("solar");
  const isWirelessTech = camera.technology === "Wireless";

  if (!hasSpecialtyReq && !isWirelessTech) {
    const nonSpecialty = pool.filter((cam) => {
      const text = nameText(cam);
      const feats = (Array.isArray((cam as any).features) ? (cam as any).features : []).map((f: unknown) => String(f).toLowerCase());
      return !["ptz", "solar", "4g", "wireless", "panoramic"].some((sp) => text.includes(sp) || feats.includes(sp));
    });
    if (nonSpecialty.length > 0) pool = nonSpecialty;
  }

  if (camera.brand && camera.brand.toLowerCase() !== "all") {
    const brandPool = pool.filter((p) => brandMatches(p, camera.brand));
    if (brandPool.length > 0) pool = brandPool;
  }

  // Environmental matching
  const isOutdoorReq =
    featuresLower.includes("outdoor") ||
    featuresLower.includes("bullet") ||
    wirelessFamilyLower.includes("outdoor");
  const isIndoorReq =
    featuresLower.includes("indoor") ||
    featuresLower.includes("dome") ||
    (!isOutdoorReq && !hasSpecialtyReq);

  if (isOutdoorReq) {
    const outdoorPool = pool.filter((cam) => isProductWeatherproof(cam));
    if (outdoorPool.length > 0) {
      pool = outdoorPool;
    } else {
      const fallbackOutdoor = context.products.filter(
        (p) =>
          isQuotableProduct(p) &&
          (!p.category || p.category === "cctv_camera") &&
          productSupportsTechnology(p, camera.technology) &&
          isProductWeatherproof(p),
      );
      if (fallbackOutdoor.length > 0) pool = fallbackOutdoor;
    }
  } else if (isIndoorReq) {
    const indoorPool = pool.filter((cam) => isProductIndoorSafe(cam));
    if (indoorPool.length > 0) pool = indoorPool;
  }

  // Wireless sub-technology preference (4G Cellular vs Wi-Fi)
  if (isWirelessTech) {
    const is4GExplicit =
      wirelessFamilyLower === "4g_solar" ||
      wirelessFamilyLower.includes("4g") ||
      featuresLower.includes("4g") ||
      featuresLower.includes("sim") ||
      requirement.broadband_status === "independent_4g";
    if (is4GExplicit) {
      const simPool = pool.filter((cam) => {
        const feats = (Array.isArray((cam as any).features) ? (cam as any).features : []).map((f: unknown) => String(f).toLowerCase());
        return Boolean((cam as any).has_4g || (cam as any).has_4g_sim || feats.includes("4g") || feats.includes("sim") || nameText(cam).includes("4g"));
      });
      if (simPool.length > 0) pool = simPool;
    } else {
      const wifiPool = pool.filter((cam) => {
        const feats = (Array.isArray((cam as any).features) ? (cam as any).features : []).map((f: unknown) => String(f).toLowerCase());
        return Boolean((cam as any).has_wifi || feats.includes("wifi") || nameText(cam).includes("wi-fi") || nameText(cam).includes("wifi"));
      });
      if (wifiPool.length > 0) pool = wifiPool;
    }
  }

  // Resolution matching with closest higher auto-upgrade (matching resolveCamera)
  if (camera.resolution && camera.resolution.toLowerCase() !== "all") {
    const requestedMp = parseMp(camera.resolution);
    if (requestedMp > 0) {
      const exact = pool.filter((p) => parseProductMp(p) === requestedMp);
      if (exact.length > 0) {
        pool = exact;
      } else {
        const sortedByDist = [...pool].sort((a, b) => {
          const aMp = parseProductMp(a);
          const bMp = parseProductMp(b);
          const aDiff = aMp >= requestedMp ? aMp - requestedMp : 100 + (requestedMp - aMp);
          const bDiff = bMp >= requestedMp ? bMp - requestedMp : 100 + (requestedMp - bMp);
          if (aDiff !== bDiff) return aDiff - bDiff;
          return (a.unit_price ?? Infinity) - (b.unit_price ?? Infinity);
        });
        if (sortedByDist.length > 0) {
          const bestMp = parseProductMp(sortedByDist[0]);
          pool = pool.filter((p) => parseProductMp(p) === bestMp);
        }
      }
    }
  }

  // Remaining requested features (e.g. ptz, audio, color)
  const remaining = featuresLower.filter((f) => !["bullet", "dome", "outdoor", "indoor", "wifi", "wireless"].includes(f));
  if (remaining.length > 0) {
    const featPool = pool.filter((cam) => {
      const text = nameText(cam);
      const feats = (Array.isArray((cam as any).features) ? (cam as any).features : []).map((f: unknown) => String(f).toLowerCase());
      return remaining.every((rf) => feats.includes(rf) || text.includes(rf));
    });
    if (featPool.length > 0) pool = featPool;
  }

  pool.sort((a, b) => (a.unit_price ?? Infinity) - (b.unit_price ?? Infinity));
  if (pool.length === 0) return undefined;

  const planType = String((requirement as any).plan_type ?? "").toLowerCase();
  const sensorPref = String((requirement as any).sensor_preference ?? "").toLowerCase();
  if (planType === "budget" || sensorPref === "standard_ir") return pool[0];
  if (planType === "premium") return pool[pool.length - 1];
  return pool[Math.floor(pool.length / 2)];
}

function cameraMaxMp(requirement: CanonicalRequirement, selectedCameras: FrozenProduct[] = []): number {
  const fromReq = effectiveCameraRequirements(requirement).reduce((max, camera) => Math.max(max, parseMp(camera.resolution)), 0);
  const fromSelected = selectedCameras.reduce((max, cam) => Math.max(max, parseProductMp(cam)), 0);
  return Math.max(fromReq, fromSelected);
}

function selectTransmissionSwitches(context: FrozenContext, ipCount: number): { product?: FrozenProduct; quantity: number; capacity: number } {
  const candidates = context.products
    .filter((product) => {
      if (!isQuotableProduct(product)) return false;
      const text = nameText(product);
      const isRouterOrAcc = text.includes("router") || text.includes("4g") || text.includes("sim") || text.includes("injector") || text.includes("cable") || text.includes("splitter") || text.includes("enclosure") || text.includes("rack");
      return !isRouterOrAcc && /poe|p\.o\.e|poe.*switch/i.test(text) && !text.includes("adapter") && productSupportsPowerTech(product, "IP");
    })
    .map((product) => ({ product, capacity: product.max_cameras ?? productChannelCapacity(product) ?? 0 }))
    .filter(({ capacity }) => capacity > 0)
    .sort((a, b) => {
      const tierDelta = a.capacity - b.capacity;
      if (tierDelta !== 0) return tierDelta;
      return (a.product.unit_price ?? Infinity) - (b.product.unit_price ?? Infinity);
    });

  const first = candidates.find(({ capacity }) => capacity >= ipCount) ?? candidates[candidates.length - 1];
  if (!first) return { quantity: 0, capacity: 4 };
  return { product: first.product, quantity: Math.ceil(ipCount / first.capacity), capacity: first.capacity };
}

function parseCableLength(product: FrozenProduct): number {
  const text = `${product.display_name ?? product.name ?? ""} ${product.technical_name ?? ""}`.toLowerCase();
  if (typeof (product as any).cable_length_m === "number" && (product as any).cable_length_m > 0) {
    return (product as any).cable_length_m;
  }
  if (typeof product.capacity === "number" && product.capacity > 0) {
    return product.capacity;
  }
  const match = text.match(/(\d+)\s*(?:m|mtr|mtrs|meter|meters|roll|rolls)\b/i);
  return match ? Number(match[1]) : 0;
}

function isCableProduct(product: FrozenProduct, requirement: CanonicalRequirement): boolean {
  if (product.category && product.category !== "cable") return false;
  if ((product as any).subcategory === "electrical_wire") return false;
  const text = nameText(product);
  if (!text.includes("cable") && !text.includes("3+1") && !text.includes("lan") && !text.includes("cat6")) return false;
  if (text.includes("electrical") || text.includes("2-core") || text.includes("hdmi")) return false;

  const tech = requirement.technology ?? requirement.cameras[0]?.technology ?? "HD";
  const isIp = tech === "IP" || (requirement.cable_type ?? "").toLowerCase().includes("cat6");
  if (isIp) {
    return productSupportsTechnology(product, "IP") || text.includes("cat6") || text.includes("lan");
  }
  return productSupportsTechnology(product, "HD") || text.includes("3+1") || text.includes("coax") || text.includes("rg59");
}

function buildCableLines(context: FrozenContext, requiredMeters: number, requirement: CanonicalRequirement): BomLine[] {
  if (requiredMeters <= 0) return [];
  const cables = context.products.filter((product) => isQuotableProduct(product) && isCableProduct(product, requirement));
  if (cables.length === 0) return [];

  const bundles: Array<{ product: FrozenProduct; length: number }> = [];
  let perMeterCable: FrozenProduct | undefined;

  for (const c of cables) {
    const len = parseCableLength(c);
    const text = nameText(c);
    const isExplicitPerMeter = text.includes("per mtr") || text.includes("per meter") || text.includes("per unit") || (c.sku ?? "").toLowerCase().includes("-pu");
    const isCheap = (c.unit_price !== undefined && c.unit_price < 200) || (c.base_cost !== undefined && c.base_cost < 100);

    if (isExplicitPerMeter || len === 1 || (len === 0 && isCheap)) {
      if (!perMeterCable || (c.unit_price ?? Infinity) < (perMeterCable.unit_price ?? Infinity)) {
        if ((c.base_cost ?? 0) < 150) perMeterCable = c;
      }
    } else if (len > 1) {
      bundles.push({ product: c, length: len });
    }
  }

  const cableMarginPct = Number(context.app_settings.margin_cable ?? 50);
  const isConduit = requirement.wiring_type === "conduit";
  const conduitRate = isConduit ? Number(context.app_settings.conduit_cost_per_meter ?? 20) : 0;

  let baseCostPerMeter = 12;
  let perMeterId = "cabling_material";

  if (perMeterCable) {
    baseCostPerMeter = perMeterCable.base_cost ?? 12;
    perMeterId = productKey(perMeterCable);
  } else if (bundles.length > 0) {
    const cheapestByCost = [...bundles].sort((a, b) => (a.product.base_cost ?? Infinity) - (b.product.base_cost ?? Infinity))[0];
    baseCostPerMeter = typeof (cheapestByCost.product as any).per_meter_cost === "number"
      ? (cheapestByCost.product as any).per_meter_cost
      : (cheapestByCost.product.base_cost ?? 0) / cheapestByCost.length;
    perMeterId = productKey(cheapestByCost.product);
  } else {
    const isIp = (requirement.technology ?? requirement.cameras[0]?.technology) === "IP" || (requirement.cable_type ?? "").toLowerCase().includes("cat6");
    baseCostPerMeter = isIp
      ? Number(context.app_settings.cable_copper_coated_ip ?? 12)
      : Number(context.app_settings.cable_copper_coated_hd ?? 8);
  }

  const cableRetailPerMeter = perMeterCable?.unit_price ?? Math.round(baseCostPerMeter * (1 + cableMarginPct / 100));
  const finalRatePerMeter = Math.round(cableRetailPerMeter + conduitRate);

  let best: {
    bundle?: FrozenProduct;
    bundleCount: number;
    remainderMeters: number;
    totalRetail: number;
    finalBundleRetail: number;
  } = {
    bundleCount: 0,
    remainderMeters: requiredMeters,
    totalRetail: finalRatePerMeter * requiredMeters,
    finalBundleRetail: 0,
  };

  for (const { product: b, length: bLen } of bundles) {
    const bundleCount = Math.floor(requiredMeters / bLen);
    const remainderMeters = requiredMeters % bLen;
    const pureBundleRetail = b.unit_price ?? Math.round((b.base_cost ?? 0) * (1 + cableMarginPct / 100));
    const finalBundleRetail = Math.round(pureBundleRetail + bLen * conduitRate);
    const comboRetail = bundleCount * finalBundleRetail + remainderMeters * finalRatePerMeter;
    if (comboRetail < best.totalRetail) {
      best = { bundle: b, bundleCount, remainderMeters, totalRetail: comboRetail, finalBundleRetail };
    }
  }

  const result: BomLine[] = [];
  if (best.bundle && best.bundleCount > 0) {
    result.push({
      sku: productKey(best.bundle),
      quantity: best.bundleCount,
      unit_price: best.finalBundleRetail,
      reason: "Optimal cable bundle combination.",
    });
  }
  if (best.remainderMeters > 0) {
    result.push({
      sku: perMeterId,
      quantity: best.remainderMeters,
      unit_price: finalRatePerMeter,
      reason: "Per-meter cable for remainder run.",
    });
  }
  return result;
}

function storageCapacityTb(product: FrozenProduct): number {
  const explicit = Number((product as any).storage_tb ?? (product as any).storage_capacity_tb ?? (product as any).capacity_tb ?? 0);
  if (explicit > 0) return explicit;
  if (typeof product.capacity === "number" && product.capacity > 0) {
    return product.capacity >= 100 ? product.capacity / 1000 : product.capacity;
  }
  const capStr = typeof product.capacity === "string" ? product.capacity : "";
  const text = `${capStr} ${nameText(product)}`;
  const tbMatch = text.match(/(\d+(?:\.\d+)?)\s*tb/i);
  if (tbMatch) return Number(tbMatch[1]);
  const gbMatch = text.match(/(\d+(?:\.\d+)?)\s*gb/i);
  if (gbMatch) return Number(gbMatch[1]) / 1000;
  return 0;
}

function dailyGbPerCamera(mp: number): number {
  if (mp >= 7.5) return 35.0; // 8MP / 4K
  if (mp >= 3.5) return 20.0; // 4MP / 5MP / 6MP
  return 14.0; // 2MP / 2.4MP / 3MP H.265 baseline
}

function requiredStorageTb(requirement: CanonicalRequirement, totalCameraCount: number, maxMp: number): number {
  const days = requirement.recording_days ?? 0;
  if (days <= 0) return 0;
  if (typeof requirement.target_storage_tb === "number") return requirement.target_storage_tb;
  const modeMultiplier = requirement.recording_mode === "motion" ? 0.85 : 1.0;
  const effectiveDailyGb = Math.round(dailyGbPerCamera(maxMp) * modeMultiplier * 10) / 10;
  return (totalCameraCount * effectiveDailyGb * days) / 1000;
}

function isBudgetDrive(product: FrozenProduct): boolean {
  const brand = String(product.brand ?? "").toLowerCase();
  const text = nameText(product);
  const id = productKey(product);
  return brand.includes("budget") || id.startsWith("HDD-BUD") || brand.includes("pullout") || brand.includes("pull out") || text.includes("pull out") || text.includes("pullout");
}

function selectStorage(context: FrozenContext, requirement: CanonicalRequirement, requiredTb: number, totalCameraCount: number): BomLine[] {
  if (requiredTb <= 0) return [];
  const allHdds = context.products
    .filter((product) => {
      if (!isQuotableProduct(product)) return false;
      const text = nameText(product);
      if ((product as any).storage_type === "Micro SD" || /micro.?sd|sd card|sdcard|memory card/i.test(text)) return false;
      return product.category === "storage" || /hdd|hard disk|surveillance.*disk/i.test(text);
    });

  if (allHdds.length === 0) return [];

  const isEconomy = Boolean(requirement.is_economy_storage || requirement.target_storage_tb === 0.5 || requirement.recording_days === 7);
  const eligible = isEconomy ? allHdds : allHdds.filter((d) => !isBudgetDrive(d));
  const diskPool = eligible.length > 0 ? eligible : allHdds;

  const brandPool = requirement.preferred_storage_brand
    ? diskPool.filter((p) => brandMatches(p, requirement.preferred_storage_brand))
    : diskPool;
  const effectivePool = brandPool.length > 0 ? brandPool : diskPool;

  const withCap = effectivePool
    .map((product) => ({ product, capacity: storageCapacityTb(product) }))
    .filter(({ capacity }) => capacity > 0)
    .sort((a, b) => {
      const capDelta = a.capacity - b.capacity;
      if (capDelta !== 0) return capDelta;
      return (a.product.unit_price ?? Infinity) - (b.product.unit_price ?? Infinity);
    });

  if (withCap.length === 0) return [];

  let explicitTargetTb = requirement.target_storage_tb;
  if (!explicitTargetTb && requirement.recording_days && totalCameraCount <= 8) {
    if (requirement.recording_days === 7 || requirement.is_economy_storage) explicitTargetTb = 0.5;
    else if (requirement.recording_days === 15) explicitTargetTb = 1.0;
    else if (requirement.recording_days === 30) explicitTargetTb = 2.0;
    else if (requirement.recording_days === 60) explicitTargetTb = 4.0;
  }

  let chosen = explicitTargetTb
    ? withCap.find((h) => Math.abs(h.capacity - explicitTargetTb!) < 0.1)
    : undefined;

  if (!chosen) {
    chosen = withCap.find((h) => h.capacity >= requiredTb * 0.85);
  }
  if (!chosen) {
    chosen = withCap[withCap.length - 1];
  }

  return [{
    sku: productKey(chosen.product),
    quantity: 1,
    unit_price: chosen.product.unit_price,
    reason: `${requiredTb.toFixed(3)} TB required (H.265 ${totalCameraCount}ch); selected ${chosen.capacity} TB HDD.`,
  }];
}

function selectMicroSd(context: FrozenContext, wirelessCount: number, requirement: CanonicalRequirement, selectedWirelessCams: FrozenProduct[]): BomLine[] {
  if (wirelessCount <= 0) return [];
  const sdCards = context.products.filter((candidate) => {
    if (!isQuotableProduct(candidate)) return false;
    const text = nameText(candidate);
    return (candidate as any).storage_type === "Micro SD" || /micro.?sd|sd card|sdcard|memory card/i.test(text);
  });
  if (sdCards.length === 0) return [];

  const days = requirement.recording_days ?? 0;
  const maxMp = cameraMaxMp(requirement, selectedWirelessCams);
  const baseGbPerDay = maxMp >= 6 ? 25.0 : maxMp >= 3 ? 16.0 : 10.5;
  const modeMultiplier = requirement.recording_mode === "continuous" ? 1.0 : 0.43;
  const singleCameraDailyGb = Math.max(3.0, Math.round(baseGbPerDay * modeMultiplier * 10) / 10);
  const requiredCardGb = singleCameraDailyGb * days;

  const getCardGb = (c: FrozenProduct): number => {
    const explicit = Number((c as any).storage_capacity_gb ?? 0);
    if (explicit > 0) return explicit;
    const text = `${c.display_name ?? c.name ?? ""} ${c.technical_name ?? ""} ${c.capacity ?? ""}`;
    const match = text.match(/(\d+)\s*GB/i);
    return match ? parseInt(match[1], 10) : 32;
  };

  const maxCameraCardGb = Number((selectedWirelessCams[0] as any)?.max_sd_capacity_gb ?? 128);
  const eligibleCards = sdCards.filter((c) => getCardGb(c) <= maxCameraCardGb);
  const candidates = eligibleCards.length > 0 ? eligibleCards : sdCards;
  const sortedCards = [...candidates].sort((a, b) => {
    const gbDiff = getCardGb(a) - getCardGb(b);
    if (gbDiff !== 0) return gbDiff;
    return (a.unit_price ?? Infinity) - (b.unit_price ?? Infinity);
  });

  const chosen = sortedCards.find((c) => getCardGb(c) >= requiredCardGb) ?? sortedCards[sortedCards.length - 1];
  return chosen
    ? [{ sku: productKey(chosen), quantity: wirelessCount, unit_price: chosen.unit_price, reason: `${requiredCardGb.toFixed(1)} GB required per wireless camera.` }]
    : [];
}

function isPackAccessory(product: FrozenProduct): boolean {
  const text = `${product.id ?? ""} ${product.sku ?? ""} ${product.display_name ?? product.name ?? ""}`.toLowerCase();
  return /pack of \d+|\bpkt\b|\bbox\b|\bbundle\b|\bjar\b|\bpack\b/i.test(text);
}

function resolveJunctionMount(context: FrozenContext, tech: "HD" | "IP"): FrozenProduct | undefined {
  const pool = [...context.products, ...context.addons].filter((p) => isQuotableProduct(p) && p.category === "camera_mount");
  if (tech === "IP") {
    return (
      pool.find((p) => productKey(p) === "mount_pvc_junction_box_ip_475") ??
      pool.find((p) => /ip|4\.75|475/i.test(`${productKey(p)} ${nameText(p)}`)) ??
      pool.find((p) => productKey(p) === "mount_pvc_junction_box_4x4") ??
      pool[0]
    );
  }
  return (
    pool.find((p) => productKey(p) === "mount_pvc_junction_box_4x4") ??
    pool.find((p) => !/ip[_ -]?475|\bfor ip\b|4\.75/i.test(`${productKey(p)} ${nameText(p)}`)) ??
    pool[0]
  );
}

export function calculateOracleBom(requirement: CanonicalRequirement, context: FrozenContext): OracleBom {
  const issues: string[] = [];
  const cameras: BomLine[] = [];
  const selectedCameraProducts: FrozenProduct[] = [];
  const selectedWirelessProducts: FrozenProduct[] = [];
  const cameraRequirements = effectiveCameraRequirements(requirement);

  for (const camera of cameraRequirements) {
    if (camera.count <= 0) continue;
    const selected = selectCameraProduct(context, camera, requirement);
    if (!selected) {
      issues.push(`CAMERA_SKU_NOT_FOUND:${camera.technology}:${camera.resolution ?? "unknown"}`);
      continue;
    }
    selectedCameraProducts.push(selected);
    if (camera.technology === "Wireless") selectedWirelessProducts.push(selected);
    cameras.push({
      sku: productKey(selected),
      quantity: camera.count,
      unit_price: selected.unit_price,
      reason: `${camera.technology} × ${camera.resolution ?? "unspecified"}${camera.brand ? ` × ${camera.brand}` : ""}`,
    });
  }

  const hd = cameraCount(requirement, "HD");
  const ip = cameraCount(requirement, "IP");
  const wireless = cameraCount(requirement, "Wireless");
  const wired = hd + ip;
  const connectors: BomLine[] = [];

  if (hd > 0) {
    const cat6 = (requirement.cable_type ?? "").toLowerCase().includes("cat6");
    const balun = selectCheapestCompatible(context.products, (product) => /balun|rj45.*connector/i.test(nameText(product)) && !/poe/i.test(nameText(product)) && !isPackAccessory(product));
    if (cat6 && balun) {
      connectors.push({ sku: productKey(balun), quantity: hd * 2, unit_price: balun.unit_price, reason: "Analog HD on CAT6: two RJ45/balun ends per camera." });
    } else if (cat6) {
      connectors.push({ sku: "connector_rj45_balun", quantity: hd * 2, reason: "Analog HD on CAT6: two RJ45/balun ends per camera." });
    } else {
      const bncCopper = context.products.find((p) => isQuotableProduct(p) && !isPackAccessory(p) && (productKey(p) === "connector_bnc_copper" || (p.category === "connector" && nameText(p).includes("bnc") && !/\bdc\b|\bset\b/i.test(nameText(p)))));
      const dcPin = context.products.find((p) => isQuotableProduct(p) && !isPackAccessory(p) && (productKey(p) === "connector_dc_pin" || (p.category === "connector" && /\bdc\b/i.test(nameText(p)) && !nameText(p).includes("bnc"))));
      if (bncCopper || dcPin) {
        if (bncCopper) connectors.push({ sku: productKey(bncCopper), quantity: hd * 2, unit_price: bncCopper.unit_price, reason: "Analog HD coax: 2 BNC connectors per camera." });
        if (dcPin) connectors.push({ sku: productKey(dcPin), quantity: hd, unit_price: dcPin.unit_price, reason: "Analog HD coax: 1 DC power pin per camera." });
      } else {
        const bnc = selectCheapestCompatible(context.products, (product) => /bnc.*dc|bnc.*connector|connector_bnc_dc/i.test(nameText(product)));
        connectors.push({ sku: bnc ? productKey(bnc) : "connector_bnc_dc", quantity: hd, unit_price: bnc?.unit_price, reason: "Analog HD coax: one BNC+DC set per camera (BNC=2N, DC pin=N)." });
      }
    }
  }

  const transmission = selectTransmissionSwitches(context, ip);
  if (ip > 0) {
    const perPieceRj45 = context.products.find((p) => isQuotableProduct(p) && !isPackAccessory(p) && (p.category === "connector" || productKey(p).includes("rj45")) && nameText(p).includes("rj45"));
    const connectorMarginPct = Number(context.app_settings.margin_connectors ?? 50);
    const rj45FallbackRate = Math.round(Number(context.app_settings.connector_rj45_cost ?? 5) * (1 + connectorMarginPct / 100));
    connectors.push({
      sku: perPieceRj45 ? productKey(perPieceRj45) : "connector_rj45",
      quantity: ip * 2 + transmission.quantity * 2,
      unit_price: perPieceRj45?.unit_price ?? rj45FallbackRate,
      reason: "IP RJ45: two per camera plus two uplink connectors per PoE switch.",
    });
  }

  const power: BomLine[] = [];
  if (hd > 0) {
    const smpsCandidates = context.products
      .filter((product) => {
        if (!isQuotableProduct(product)) return false;
        const text = nameText(product);
        const isRouterOrAcc = text.includes("router") || text.includes("4g") || text.includes("sim") || text.includes("injector") || text.includes("cable") || text.includes("splitter");
        return !isRouterOrAcc && /smps|power supply|psu/i.test(text) && !/poe|p\.o\.e/i.test(text) && productSupportsPowerTech(product, "HD");
      })
      .map((product) => ({ product, capacity: product.max_cameras ?? productChannelCapacity(product) ?? 0 }))
      .filter(({ capacity }) => capacity > 0);

    const validSmps = smpsCandidates
      .filter(({ capacity }) => capacity >= hd)
      .sort((a, b) => {
        const priceDiff = (a.product.unit_price ?? Infinity) - (b.product.unit_price ?? Infinity);
        if (priceDiff !== 0) return priceDiff;
        return a.capacity - b.capacity;
      });

    if (validSmps.length > 0) {
      const chosen = validSmps[0];
      power.push({
        sku: productKey(chosen.product),
        quantity: 1,
        unit_price: chosen.product.unit_price,
        reason: "HD uses cheapest qualifying SMPS power architecture (capacity >= hd cameras).",
      });
    } else if (smpsCandidates.length > 0) {
      const largest = [...smpsCandidates].sort((a, b) => b.capacity - a.capacity)[0];
      power.push({
        sku: productKey(largest.product),
        quantity: Math.ceil(hd / largest.capacity),
        unit_price: largest.product.unit_price,
        reason: "HD SMPS scaled to camera count.",
      });
    } else {
      issues.push("HD_SMPS_NOT_FOUND");
    }
  }
  if (ip > 0) {
    if (transmission.product) power.push({ sku: productKey(transmission.product), quantity: transmission.quantity, unit_price: transmission.product.unit_price, reason: "IP uses PoE-only power architecture; lowest valid port tier first, then price." });
    else issues.push("IP_POE_SWITCH_NOT_FOUND");

    if (transmission.quantity > 1) {
      const aggregator = selectCheapestCompatible([...context.products, ...context.addons], (product) => /gigabit|gbps|gigabit.*switch|aggregat/i.test(nameText(product)) && !/poe/i.test(nameText(product)));
      if (aggregator) power.push({ sku: productKey(aggregator), quantity: 1, unit_price: aggregator.unit_price, reason: "Multiple PoE switches require a real Gigabit aggregating switch." });
      else issues.push("GIGABIT_AGGREGATOR_NOT_FOUND");
    }
  }

  const maxMp = cameraMaxMp(requirement, selectedCameraProducts);
  const maxChannelsRequested = requirement.recorder_channels ?? requirement.recorder?.channel_capacity;
  const recorderCapacity = maxChannelsRequested ?? [4, 8, 16, 32].find((capacity) => capacity >= wired) ?? (wired > 0 ? wired : undefined);
  const minMp = recorderMinimumMp(maxMp);
  let recorder: BomLine | undefined;
  if (recorderCapacity && recorderCapacity > 0 && wired > 0) {
    const recorderTechnology = requirement.recorder_technology ?? requirement.recorder?.technology ?? (ip > 0 ? "IP" : "HD");
    const recorderBrand = requirement.recorder_brand ?? requirement.recorder?.brand;
    const isIpRec = String(recorderTechnology).toUpperCase() === "IP";
    const compatRecorders = context.products
      .filter((product) => {
        if (!isQuotableProduct(product)) return false;
        if (product.category && product.category !== "recorder") return false;
        const text = nameText(product);
        const recType = String((product as any).recorder_type ?? "").toUpperCase();
        if (isIpRec && (recType === "DVR" || (text.includes("dvr") && !text.includes("nvr")))) return false;
        if (!isIpRec && (recType === "NVR" || (text.includes("nvr") && !text.includes("dvr")))) return false;
        const channels = productChannelCapacity(product) ?? 0;
        const mp = parseProductMp(product);
        const technologyOk = recorderTechnology ? productSupportsTechnology(product, recorderTechnology as Technology) : true;
        return channels >= recorderCapacity && technologyOk && brandMatches(product, recorderBrand) && mp >= minMp && (/dvr|nvr|recorder/i.test(text) || product.category === "recorder");
      })
      .sort((a, b) => {
        const chDiff = (productChannelCapacity(a) ?? Infinity) - (productChannelCapacity(b) ?? Infinity);
        if (chDiff !== 0) return chDiff;
        return (a.unit_price ?? Infinity) - (b.unit_price ?? Infinity);
      });
    const recorderProduct = compatRecorders[0];
    if (recorderProduct) recorder = { sku: productKey(recorderProduct), quantity: 1, unit_price: recorderProduct.unit_price, reason: `${recorderCapacity}-channel recorder with >= ${minMp}MP support.` };
    else issues.push(`RECORDER_NOT_FOUND:${recorderCapacity}:${minMp}MP`);
  }

  const storage: BomLine[] = [];
  const storageSelected = requirement.storage_selected ?? requirement.storage?.selected ?? true;
  const recordingDays = requirement.recording_days ?? 0;
  if (storageSelected && recordingDays > 0) {
    const requiredTb = requiredStorageTb(requirement, wired, maxMp);
    if (wired > 0) {
      storage.push(...selectStorage(context, requirement, requiredTb, wired));
      if (storage.length === 0) issues.push("HDD_NOT_FOUND");
    }
    storage.push(...selectMicroSd(context, wireless, requirement, selectedWirelessProducts));
  }

  const junctionLines: BomLine[] = [];
  if (wired > 0) {
    const hdMount = hd > 0 ? resolveJunctionMount(context, "HD") : undefined;
    const ipMount = ip > 0 ? resolveJunctionMount(context, "IP") : undefined;
    const hdMountKey = hdMount ? productKey(hdMount) : "acc_junction_box";
    const ipMountKey = ipMount ? productKey(ipMount) : "acc_junction_box";
    const fallbackRate = Math.round(Number(context.app_settings.junction_box_cost ?? 20) * (1 + Number(context.app_settings.margin_junction_box ?? 50) / 100));

    if (hd > 0 && ip > 0 && hdMountKey === ipMountKey) {
      junctionLines.push({ sku: hdMountKey, quantity: wired, unit_price: hdMount?.unit_price ?? fallbackRate, reason: "Waterproof PVC junction box per wired camera." });
    } else {
      if (hd > 0) junctionLines.push({ sku: hdMountKey, quantity: hd, unit_price: hdMount?.unit_price ?? fallbackRate, reason: "Waterproof PVC 4x4 junction box per HD camera." });
      if (ip > 0) junctionLines.push({ sku: ipMountKey, quantity: ip, unit_price: ipMount?.unit_price ?? fallbackRate, reason: "Waterproof PVC 4.75x4.75 junction box per IP camera." });
    }
  }

  const cablingMode = requirement.cabling_mode ?? "all_new";
  const cableMeters = cablingMode === "all_existing" ? 0 : (requirement.cable_length_meters ?? 0);
  const cableLines = wired > 0 && cableMeters > 0 ? buildCableLines(context, cableMeters, requirement) : [];
  const cableMarginPct = Number(context.app_settings.margin_cable ?? 50);

  return {
    cameras,
    recorder,
    storage,
    power,
    connectors,
    junction_boxes: wired > 0 ? { sku: junctionLines[0]?.sku ?? "__CALCULATED_JUNCTION_BOX__", quantity: wired, unit_price: junctionLines[0]?.unit_price, reason: "One junction box per wired camera; junction boxes are BOM-owned, never duplicated in addons." } : undefined,
    junction_lines: junctionLines.length > 0 ? junctionLines : undefined,
    cabling: wired > 0 && cableMeters > 0 ? { cable_meters: cableMeters, wastage_factor: 1.0, labour_free_meters_per_camera: 15, margin_percent: cableMarginPct, cable_lines: cableLines } : undefined,
    wireless_families: Array.from(new Set(cameraRequirements.filter((camera) => camera.technology === "Wireless" && camera.wireless_family).map((camera) => camera.wireless_family!))).filter((family) => WIRELESS_FAMILIES.includes(family as never)),
    manual_quote: requirement.camera_count > 64 || hd > 16 || ip > 32 || wireless > 16,
    issues,
  };
}
