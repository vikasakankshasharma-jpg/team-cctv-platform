
import { Product, CCTVRequirement, CCTVConfiguration, ResolvedSystem } from "@/types";
import { isBrandMatch as isBrandMatchFromUtils } from "./brand-utils";

export function isTechMatch(p: any, targetTech: string): boolean {
  if (!targetTech) return true;
  let targetUpper = String(targetTech).toUpperCase();
  if (targetUpper.includes("DIGITAL IP") || targetUpper.includes("NETWORK")) targetUpper = "IP";
  if (targetUpper.includes("ANALOG")) targetUpper = "HD";
  
  const techs = (p.technologies || [p.technology]).filter(Boolean).map((t: any) => String(t).toUpperCase());
  if (techs.length > 0) {
    if (techs.includes("COMMON") || techs.includes("BOTH")) return true;
    return techs.some((t: string) => {
      if (targetUpper === "IP") return t.includes("IP") || t.includes("DIGITAL IP") || t.includes("NETWORK");
      if (targetUpper === "HD") return t.includes("HD") || t.includes("ANALOG");
      if (targetUpper === "WIFI" || targetUpper === "WIRELESS") return t.includes("WIFI") || t.includes("WIRELESS");
      return t === targetUpper;
    });
  }

  // If no explicit tech field, infer safely from technical name, display name, and tags
  const name = `${p.technical_name || ""} ${p.display_name || ""} ${(p.tags || []).join(" ")}`.toUpperCase();
  if (targetUpper === "IP") {
    if (name.includes("DVR") && !name.includes("NVR")) return false;
    if (name.includes("SMPS") || name.includes("BNC")) return false;
    return name.includes("IP") || name.includes("NVR") || name.includes("POE") || name.includes("CAT6") || name.includes("RJ45");
  }
  if (targetUpper === "HD") {
    if (name.includes("NVR") && !name.includes("DVR")) return false;
    if (name.includes("POE") || name.includes("RJ45")) return false;
    return name.includes("HD") || name.includes("DVR") || name.includes("SMPS") || name.includes("COAXIAL") || name.includes("3+1") || name.includes("BNC");
  }
  if (targetUpper === "WIFI" || targetUpper === "WIRELESS") {
    if (name.includes("DVR") || name.includes("NVR") || name.includes("SMPS") || name.includes("BNC") || name.includes("COAXIAL")) return false;
    return !!p.has_wifi || !!p.has_4g_sim || name.includes("WIFI") || name.includes("WI-FI") || name.includes("WIRELESS") || name.includes("4G");
  }
  return true;
}

export function isBrandMatch(p: Product, brandFilter: string): boolean {
  return isBrandMatchFromUtils(p, brandFilter);
}

export function parseResolutionMP(item: any): number {
  if (!item) return 2;
  if (typeof item === "number") return item;
  if (typeof item.resolution_mp === "number" && item.resolution_mp > 0) return item.resolution_mp;
  
  const text = (
    (typeof item === "string" ? item : "") + " " +
    (item.resolution || "") + " " +
    (item.specifications?.resolution || "") + " " +
    (item.technical_name || "") + " " +
    (item.display_name || "")
  ).toUpperCase();

  if (text.includes("8MP") || text.includes("4K") || text.includes("12MP")) return 8;
  if (text.includes("6MP")) return 6;
  if (text.includes("5MP") || text.includes("3K")) return 5;
  if (text.includes("4MP") || text.includes("2K")) return 4;
  if (text.includes("3MP")) return 3;
  if (text.includes("2MP") || text.includes("1080P") || text.includes("1080")) return 2;
  return 2;
}

export function getRecorderMaxSupportedMP(recorder: Product): number {
  if (!recorder) return 2;
  const isIP = String(recorder.technology || "").toUpperCase().includes("IP") ||
               (recorder.technologies || []).some((t: any) => String(t).toUpperCase().includes("IP")) ||
               String(recorder.display_name || "").toUpperCase().includes("IP") ||
               String(recorder.display_name || "").toUpperCase().includes("NVR");
  
  const text = (
    (recorder.resolution || "") + " " +
    (recorder.specifications?.resolution || "") + " " +
    (recorder.technical_name || "") + " " +
    (recorder.display_name || "")
  ).toUpperCase();

  if (text.includes("8MP") || text.includes("4K") || text.includes("12MP")) return 8;
  if (text.includes("6MP")) return 6;
  if (text.includes("5MP") || text.includes("3K")) return 5;
  if (text.includes("4MP") || text.includes("2K")) return 4;
  if (text.includes("3MP")) return 3;
  if (text.includes("2MP") || text.includes("1080P") || text.includes("UPTO2MP")) return 2;

  // Commercial IP NVRs support at least 8MP/4K by default unless stated otherwise
  if (isIP) return 8;

  // HD DVRs default to 2MP
  return 2;
}

export function getProductChannelCapacity(p: any): number {
  if (!p) return 0;
  if (typeof p.channels === "number" && p.channels > 0) return p.channels;
  if (typeof p.max_cameras === "number" && p.max_cameras > 0) return p.max_cameras;
  if (typeof p.network_ports === "number" && p.network_ports > 0) return p.network_ports;
  
  const text = `${p.technical_name || ""} ${p.display_name || ""} ${(p.tags || []).join(" ")} ${p.sku || ""}`.toLowerCase();
  const match = text.match(/(\d+)\s*(?:ch|port|channel|channels|ports)\b/i);
  if (match) return parseInt(match[1], 10);
  return 0;
}

export function resolveProducts(
  config: CCTVConfiguration,
  req: CCTVRequirement,
  catalog: Product[],
  brandFilter?: string
): { plans: Record<string, ResolvedSystem>; lifecycleWarnings: string[] } {
  
  const lifecycleWarnings: string[] = [];
  const pool = catalog.filter(p => {
    if (!p.is_active || p.is_quotation_eligible === false || p.is_deleted === true) return false;
    // Allow out_of_stock products as per vendor tie-up, rely strictly on is_active
    if ((p.stock_status as string) === "on_demand") {
      lifecycleWarnings.push(`ON_DEMAND_WARNING: Product [${p.id}] ${p.display_name} is on-demand.`);
    }
    return true;
  });

  // Find all available Camera combinations
  const allCameras = pool.filter(p => (p.category as any) === "CAMERA_HD" || (p.category as any) === "CAMERA_IP" || p.category === "cctv_camera");
  const combinations = new Set<string>(); // e.g. "HD_2MP", "IP_5MP"
  
  allCameras.forEach(c => {
     let tech = c.technology || (c.technologies && c.technologies[0]) || (c.display_name?.toUpperCase().includes("IP") ? "IP" : "HD");
     let res = (c.specifications as any)?.resolution || c.resolution || (c.resolution_mp ? `${c.resolution_mp}MP` : undefined);
     if (!res) {
        if (c.display_name?.toLowerCase().includes("2mp")) res = "2MP";
        else if (c.display_name?.toLowerCase().includes("4mp")) res = "4MP";
        else if (c.display_name?.toLowerCase().includes("5mp")) res = "5MP";
        else if (c.display_name?.toLowerCase().includes("6mp")) res = "6MP";
        else if (c.display_name?.toLowerCase().includes("8mp")) res = "8MP";
     }
     if (tech && res) combinations.add(`${tech}_${res}`);
  });

  const plans: Record<string, ResolvedSystem> = {};

  combinations.forEach(combo => {
      const [tech, res] = combo.split("_");
      
      // Override config for this permutation
      const permConfig: any = { ...config, technology: tech };
      
      const cameras = resolveCamerasForPermutation(permConfig, res, allCameras, brandFilter);
      if (cameras.length === 0) return; // Skip if we can't find a complete set

      const recorder = resolveRecorderForPermutation(permConfig, pool, brandFilter, res);
      const storage = resolveStorageForPermutation(permConfig, pool, brandFilter, cameras);
      if ((storage as any)?.is_downgraded) {
        lifecycleWarnings.push(`STORAGE_DOWNGRADE_WARNING [${combo}]: ${(storage as any).downgrade_note}`);
      }
      const power = resolvePowerForPermutation(permConfig, pool, brandFilter);

      plans[combo] = {
        plan_type: combo,
        cameras,
        recorder,
        storage,
        power,
        cable_meters: permConfig.cable_meters || 0,
        connectors_qty: permConfig.connectors_count || 0,
        site_surcharge_flags: permConfig.site_surcharge_flags
      } as any;
  });

  return { plans, lifecycleWarnings };
}

function resolveCamerasForPermutation(config: CCTVConfiguration, targetResolution: string, cams: Product[], brandFilter?: string) {
  const isBudget = !brandFilter || brandFilter === "Budget";

  const getCameraBySpec = (formFactor: string) => {
    let filtered = cams.filter(p => {
      // Must match Technology — handle both legacy `technology` (string) and new `technologies` (array)
        if (!isTechMatch(p, config.technology)) return false;
      
      // Must match Form Factor — use form_factor (primary) with multiple fallbacks
      const pFormRaw = String(
        p.form_factor
        || (p.specifications as any)?.formFactor
        || (p as any).type
        || (p.display_name?.toLowerCase().includes("bullet") ? "bullet"
           : (p.display_name?.toLowerCase().includes("dome") ? "dome" : ""))
      ).toLowerCase();
      
      const targetForm = formFactor.toLowerCase();
      let matchForm = pFormRaw === targetForm;
      if (!matchForm) {
        if (targetForm === "dome") {
          // Indoor-safe forms: dome, turret, indoor_pt, or explicit Indoor rating
          const isExplicitIndoor = p.ip_rating === "Indoor" || p.ip_rating === "Indoor Only";
          const isNotOutdoor = !pFormRaw.includes("bullet") && !pFormRaw.includes("outdoor");
          matchForm = pFormRaw.includes("dome") || pFormRaw.includes("turret") || pFormRaw.includes("indoor") || pFormRaw === "indoor_pt" || (isExplicitIndoor && isNotOutdoor);
        } else if (targetForm === "bullet") {
          // Outdoor weatherproof forms: bullet, outdoor_pt, ptz, or IP65/IP66/IP67 rated
          const isWeatherproof = p.ip_rating === "IP65" || p.ip_rating === "IP66" || p.ip_rating === "IP67";
          matchForm = pFormRaw.includes("bullet") || pFormRaw.includes("outdoor") || pFormRaw === "outdoor_pt" || pFormRaw === "ptz" || isWeatherproof;
        }
      }
      
      // Must match Resolution
      const pRes = (p.specifications as any)?.resolution || (p as any).resolution;
        let matchRes = false;
        const normalizeRes = (r: string) => String(r || "").toUpperCase().replace(/\s+/g, "").replace("MEGAPIXEL", "MP");
        const normTarget = normalizeRes(targetResolution);
        
        if (!pRes) {
           matchRes = normalizeRes(p.display_name).includes(normTarget);
        } else {
           const normPRes = normalizeRes(pRes);
           matchRes = normPRes === normTarget || normPRes.includes(normTarget);
        }

      return matchForm && matchRes;
    });

    if (filtered.length === 0) return undefined;

    if (isBudget) {
      // For Budget tier: prefer products marked "budget", otherwise pick the cheapest available product
      const budgetItems = filtered.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
      if (budgetItems.length > 0) return budgetItems.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
      return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    }

    if (brandFilter) {
      const brandItems = filtered.filter(p => isBrandMatch(p, brandFilter));
      if (brandItems.length > 0) return brandItems.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
      return undefined; // Strictly enforce camera brand
    }

    // Fallback if no specific brand was requested
    return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  };

  const res = [];
  if (config.indoor_cameras > 0) {
    const dome = getCameraBySpec('DOME');
    if (dome) res.push({ product: dome, qty: config.indoor_cameras });
  }
  if (config.outdoor_cameras > 0) {
    const bullet = getCameraBySpec('BULLET');
    if (bullet) res.push({ product: bullet, qty: config.outdoor_cameras });
  }
  
  if (config.indoor_cameras === 0 && config.outdoor_cameras === 0 && config.total_cameras > 0) {
     const cam = getCameraBySpec('DOME') || getCameraBySpec('BULLET');
     if (cam) res.push({ product: cam, qty: config.total_cameras });
  }
  
  // Validate that we got what we needed
  const totalFound = res.reduce((sum, c) => sum + c.qty, 0);
  if (totalFound < config.total_cameras) return []; // Incomplete setup

  return res;
}

function resolveRecorderForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string, targetResolution?: string) {
  const upperTech = String(config.technology || "").toUpperCase();
  if (upperTech === "WIRELESS" || upperTech === "WIFI") return undefined;
  if (!config.recorder_channels) return undefined;
  const isBudget = !brandFilter || brandFilter === "Budget" || brandFilter === "Budget Brand";
  const requiredMaxMP = parseResolutionMP(targetResolution || "2MP");
  const isIP = String(config.technology || "").toUpperCase() === "IP";
  
  const recs = pool.filter(p => {
    if (p.category !== "recorder" || p.is_deleted === true) return false;
    if (getProductChannelCapacity(p) < config.recorder_channels!) return false;
    if (!isTechMatch(p, config.technology)) return false;
    
    // Strict hardware separation: DVR for HD, NVR for IP
    const name = `${p.technical_name || ""} ${p.display_name || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
    if (isIP && name.includes("dvr") && !name.includes("nvr")) return false;
    if (!isIP && name.includes("nvr") && !name.includes("dvr")) return false;

    if (getRecorderMaxSupportedMP(p) < requiredMaxMP) return false;
    return true;
  });
  if (recs.length === 0) return undefined;

  // Channel-tier sorter: prioritize smallest channel count that fits (e.g. 4ch before 8ch before 32ch),
  // then lowest price (so cheaper 5MP is picked over 2MP when channel tier is the same).
  const sortRecorders = (arr: Product[]) => {
    return arr.sort((a, b) => {
      const aCh = getProductChannelCapacity(a);
      const bCh = getProductChannelCapacity(b);
      if (aCh !== bCh) return aCh - bCh;
      return (a.unit_price || 0) - (b.unit_price || 0);
    });
  };

  sortRecorders(recs);

  if (isBudget) {
    const budgetRecs = recs.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetRecs.length > 0) return sortRecorders(budgetRecs)[0];
    return recs[0];
  }

  if (brandFilter) {
    const brandRecs = recs.filter(p => isBrandMatch(p, brandFilter));
    if (brandRecs.length > 0) return sortRecorders(brandRecs)[0];
    if (brandFilter.toLowerCase().includes("budget")) {
      return recs[0];
    }
    return undefined; // Strictly enforce recorder brand for specific named brands
  }

  return recs[0];
}

function resolveStorageForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string, resolvedCameras?: { product: Product, qty: number }[]) {
  if (config.storage_gb === 0) return undefined;

  const isWireless = String(config.technology || "").toUpperCase() === "WIRELESS" || String(config.technology || "").toUpperCase() === "WIFI";

  if (isWireless) {
    const sdCards = pool.filter(p => {
      if (p.is_deleted === true || p.is_active === false) return false;
      const isStorage = p.category === "storage";
      const name = (p.display_name || "").toLowerCase();
      const isSd = (p as any).storage_type === "Micro SD" || name.includes("sd card") || name.includes("microsd");
      return isStorage && isSd;
    });

    if (sdCards.length === 0) return undefined;

    // Sized for 1 individual camera (MicroSD card in each camera slot)
    const singleCam = resolvedCameras && resolvedCameras.length > 0 ? resolvedCameras[0] : undefined;
    const baseDailyGb = singleCam?.product.daily_gb_per_camera || 14;
    const days = config.recording_days !== undefined ? config.recording_days : 15;
    const reqCardGb = Math.max(2.5, baseDailyGb * 0.40) * days; // Smart Motion (0.40) default

    const getGb = (p: Product) => {
      if ((p as any).storage_capacity_gb) return (p as any).storage_capacity_gb;
      const match = (p.display_name || "").match(/(\d+)\s*GB/i);
      return match ? parseInt(match[1]) : 0;
    };

    const sortedCards = [...sdCards].sort((a, b) => getGb(a) - getGb(b));
    let chosenCard = sortedCards.find(c => getGb(c) >= reqCardGb);
    let isDowngraded = false;
    let shortfallGb = 0;

    if (!chosenCard) {
      chosenCard = sortedCards[sortedCards.length - 1];
      isDowngraded = true;
      shortfallGb = Math.max(0, Math.round(reqCardGb - getGb(chosenCard)));
    }

    if (brandFilter && brandFilter !== "Budget" && brandFilter !== "All Brands") {
      const brandCard = sortedCards.filter(p => isBrandMatch(p, brandFilter)).find(c => getGb(c) >= reqCardGb);
      if (brandCard) chosenCard = brandCard;
    }

    if (isDowngraded && chosenCard) {
      return {
        ...chosenCard,
        is_downgraded: true,
        shortfall_gb: shortfallGb,
        downgrade_note: `Required ${Math.round(reqCardGb)}GB storage per camera, largest available MicroSD is ${getGb(chosenCard)}GB (${chosenCard.display_name}).`
      };
    }

    return chosenCard;
  }

  if (config.storage_gb === undefined) return undefined;
  let reqStorageGb = config.storage_gb!;
  if (resolvedCameras && resolvedCameras.length > 0) {
    let preciseDailyGb = 0;
    for (const cam of resolvedCameras) {
      const fallbackGb = config.technology === "HD" ? 20 : 40;
      const gbPerDay = cam.product.daily_gb_per_camera || fallbackGb;
      preciseDailyGb += gbPerDay * cam.qty;
    }
    const days = config.recording_days !== undefined ? config.recording_days : 15;
    reqStorageGb = preciseDailyGb * days;
  } else if (config.technology === "HD") {
    reqStorageGb = reqStorageGb * 0.75; // Reduce by 25% for HD (fallback)
  }

  const storageItems = pool.filter(p => p.category === "storage" || p.storage_type === "Hard Disk");
  const getTb = (p: Product) => {
    if (p.storage_capacity_tb) return p.storage_capacity_tb;
    
    let capStr = "";
    if (typeof p.capacity === "string") capStr = p.capacity.toUpperCase();
    else if (p.display_name) capStr = p.display_name.toUpperCase();
    
    const tbMatch = capStr.match(/(\d+)\s*TB/);
    if (tbMatch) return parseInt(tbMatch[1], 10);
    
    const gbMatch = capStr.match(/(\d+)\s*GB/);
    if (gbMatch) return parseInt(gbMatch[1], 10) / 1024;
    
    return 0;
  };

  let valid = storageItems.filter(p => getTb(p) * 1024 >= reqStorageGb);
  let isDowngraded = false;
  let shortfallGb = 0;
  
  if (valid.length === 0 && storageItems.length > 0) {
    valid = [...storageItems].sort((a, b) => getTb(b) - getTb(a)).slice(0, 1);
    isDowngraded = true;
    shortfallGb = Math.max(0, Math.round(reqStorageGb - (getTb(valid[0]) * 1024)));
  }
  
  if (valid.length === 0) return undefined;
  
  let chosen = valid.sort((a, b) => {
    const tbDiff = getTb(a) - getTb(b);
    if (tbDiff !== 0) return tbDiff;
    return (a.unit_price || 0) - (b.unit_price || 0);
  })[0];

  if (brandFilter && brandFilter !== "Budget" && brandFilter !== "All Brands") {
    const brandStorage = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandStorage.length > 0) {
      chosen = brandStorage.sort((a, b) => {
        const tbDiff = getTb(a) - getTb(b);
        if (tbDiff !== 0) return tbDiff;
        return (a.unit_price || 0) - (b.unit_price || 0);
      })[0];
    }
  }

  if (isDowngraded && chosen) {
    return {
      ...chosen,
      is_downgraded: true,
      shortfall_gb: shortfallGb,
      downgrade_note: `Required ${Math.round(reqStorageGb)}GB storage, largest available HDD is ${Math.round(getTb(chosen) * 1024)}GB (${chosen.display_name}).`
    };
  }
  
  return chosen;
}

function resolvePowerForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string) {
  if (config.wired_cameras === 0) return undefined;
  const isBudget = !brandFilter || brandFilter === "Budget" || brandFilter === "Budget Brand";

  const powerItems = pool.filter(p => p.category === "power_device" || (p.category as any) === "network");
  
  const getPowerCh = (p: Product) => {
    if (p.max_cameras && p.max_cameras > 0) return p.max_cameras;
    if (p.channels && p.channels > 0) return p.channels;
    
    const name = `${p.technical_name || ""} ${p.display_name || ""}`.toLowerCase();
    const match = name.match(/(\d+)\s*(ch|port|channels|ports)/i);
    if (match) return parseInt(match[1]);
    return 0;
  };
  
  const isPoe = (p: Product) => {
    const name = `${p.technical_name || ""} ${p.display_name || ""} ${(p.tags || []).join(" ")} ${p.sku || ""}`.toLowerCase();
    const isRouterOrAccessory = name.includes("router") || name.includes("4g") || name.includes("sim") || name.includes("injector") || name.includes("cable") || name.includes("splitter");
    return (name.includes("poe") || name.includes("p.o.e") || name.includes("p-o-e")) && !name.includes("adapter") && !isRouterOrAccessory;
  };

  const isSmps = (p: Product) => {
    const name = `${p.technical_name || ""} ${p.display_name || ""}`.toLowerCase();
    const isRouterOrAccessory = name.includes("router") || name.includes("4g") || name.includes("sim") || name.includes("injector") || name.includes("cable") || name.includes("splitter");
    return (name.includes("psu") || name.includes("smps") || name.includes("power")) && !(name.includes("poe") || name.includes("p.o.e") || name.includes("p-o-e")) && !isRouterOrAccessory;
  };

  const isIP = String(config.technology || "").toUpperCase() === "IP";

  let valid = powerItems.filter(p => {
      if (p.is_deleted === true) return false;
      const matchTech = isTechMatch(p, config.technology);
      const matchHardware = isIP ? isPoe(p) : isSmps(p);
      const matchCams = getProductChannelCapacity(p) === config.recorder_channels;
      return matchTech && matchHardware && matchCams;
  });

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          if (p.is_deleted === true) return false;
          const matchTech = isTechMatch(p, config.technology);
          const matchHardware = isIP ? isPoe(p) : isSmps(p);
          const matchCams = getProductChannelCapacity(p) >= config.recorder_channels!;
          return matchTech && matchHardware && matchCams;
      });
  }

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          if (p.is_deleted === true) return false;
          const matchTech = isTechMatch(p, config.technology);
          const matchHardware = isIP ? isPoe(p) : isSmps(p);
          return matchTech && matchHardware;
      });
  }
  
  if (valid.length === 0) {
    if (isIP) {
      valid = powerItems.filter(p => p.is_deleted !== true && isPoe(p));
    } else {
      valid = powerItems.filter(p => p.is_deleted !== true && isSmps(p));
    }
  }
  if (valid.length === 0) return undefined;

  const sortPowerDevices = (arr: Product[]) => {
    return arr.sort((a, b) => {
      const aCh = getProductChannelCapacity(a);
      const bCh = getProductChannelCapacity(b);
      if (isIP) {
        if (aCh !== bCh) return aCh - bCh;
        return (a.unit_price || 0) - (b.unit_price || 0);
      } else {
        const priceDiff = (a.unit_price || 0) - (b.unit_price || 0);
        if (priceDiff !== 0) return priceDiff;
        return aCh - bCh;
      }
    });
  };

  sortPowerDevices(valid);

  if (isBudget) {
    const budgetPsu = valid.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetPsu.length > 0) return sortPowerDevices(budgetPsu)[0];
    return valid[0];
  }

  if (brandFilter) {
    const brandPsu = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandPsu.length > 0) return sortPowerDevices(brandPsu)[0];
  }

  return valid[0];
}




