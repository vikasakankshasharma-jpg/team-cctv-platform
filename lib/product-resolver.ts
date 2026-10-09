
import { Product, CCTVRequirement, CCTVConfiguration, ResolvedSystem } from "@/types";

export function isTechMatch(p: any, targetTech: string): boolean {
  if (!targetTech) return true;
  let targetUpper = String(targetTech).toUpperCase();
  if (targetUpper.includes("DIGITAL IP") || targetUpper.includes("NETWORK")) targetUpper = "IP";
  if (targetUpper.includes("ANALOG")) targetUpper = "HD";
  
  const techs = (p.technologies || [p.technology]).filter(Boolean).map((t: any) => String(t).toUpperCase());
  if (techs.length === 0 || techs.includes("COMMON")) return true;
  
  return techs.some((t: string) => {
    if (targetUpper === "IP") return t.includes("IP") || t.includes("DIGITAL IP") || t.includes("NETWORK");
    if (targetUpper === "HD") return t.includes("HD") || t.includes("ANALOG");
    if (targetUpper === "WIFI" || targetUpper === "WIRELESS") return t.includes("WIFI") || t.includes("WIRELESS");
    return t === targetUpper;
  });
}

export function isBrandMatch(p: Product, brandFilter: string): boolean {
  if (!brandFilter || brandFilter === "Budget" || brandFilter === "All Brands") return true;
  const filterLower = brandFilter.toLowerCase().replace(/[\s-]+/g, "");
  
  let pBrand = p.brand;
  if (!pBrand) {
     if (p.display_name.toLowerCase().includes("cp plus")) pBrand = "CP Plus";
     else if (p.display_name.toLowerCase().includes("hikvision")) pBrand = "Hikvision";
     else if (p.display_name.toLowerCase().includes("prama")) pBrand = "Prama";
     else if (p.display_name.toLowerCase().includes("dahua")) pBrand = "Dahua";
  }
  if (pBrand) {
     const lower = pBrand.toLowerCase().replace(/[\s-]+/g, "");
     if (lower === "cpplus" && filterLower === "cpplus") return true;
     if (lower === filterLower) return true;
  }
  
  if (p.brand?.toLowerCase().includes(brandFilter.toLowerCase())) return true;
  if (p.display_name?.toLowerCase().includes(brandFilter.toLowerCase())) return true;
  
  return false;
}

export function resolveProducts(
  config: CCTVConfiguration,
  req: CCTVRequirement,
  catalog: Product[],
  brandFilter?: string
): { plans: Record<string, ResolvedSystem>; lifecycleWarnings: string[] } {
  
  const lifecycleWarnings: string[] = [];
  const pool = catalog.filter(p => {
    if (!p.is_active || p.is_quotation_eligible === false) return false;
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
     let tech = c.technology || "HD";
     let res = (c.specifications as any)?.resolution || c.resolution;
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

      const recorder = resolveRecorderForPermutation(permConfig, pool, brandFilter);
      const storage = resolveStorageForPermutation(permConfig, pool, brandFilter, cameras);
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
      const pForm = p.form_factor
        || (p.specifications as any)?.formFactor
        || (p as any).type
        || (p.display_name?.toLowerCase().includes("bullet") ? "bullet"
           : (p.display_name?.toLowerCase().includes("dome") ? "dome" : ""));
      const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
      
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

function resolveRecorderForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string) {
  if (!config.recorder_channels) return undefined;
  const isBudget = !brandFilter || brandFilter === "Budget";
  
  const recs = pool.filter(p => {
    if (p.category !== "recorder") return false;
    if ((p.channels || p.max_cameras || 0) < config.recorder_channels) return false;
    if (!isTechMatch(p, config.technology)) return false;
      return true;
    });
    if (recs.length === 0) return undefined;
  // Sort ascending by channel count (prefer smallest that fits), then by price
  recs.sort((a, b) => {
    const aCh = (a.channels || a.max_cameras || 0);
    const bCh = (b.channels || b.max_cameras || 0);
    if (aCh !== bCh) return aCh - bCh;
    return (a.unit_price || 0) - (b.unit_price || 0);
  });

  if (isBudget) {
    const budgetRecs = recs.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetRecs.length > 0) return budgetRecs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    return recs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  if (brandFilter) {
    const brandRecs = recs.filter(p => isBrandMatch(p, brandFilter));
    if (brandRecs.length > 0) return brandRecs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    return undefined; // Strictly enforce recorder brand
  }

  // Fallback if no specific brand was requested
  return recs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}

function resolveStorageForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string, resolvedCameras?: { product: Product, qty: number }[]) {
  if (config.storage_gb === 0 || config.storage_gb === undefined) return undefined;

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
  
  if (valid.length === 0 && storageItems.length > 0) {
    valid = [...storageItems].sort((a, b) => getTb(b) - getTb(a)).slice(0, 1);
  }
  
  if (valid.length === 0) return undefined;
  
  if (brandFilter && brandFilter !== "Budget" && brandFilter !== "All Brands") {
    const brandStorage = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandStorage.length > 0) {
      return brandStorage.sort((a, b) => {
        const tbDiff = getTb(a) - getTb(b);
        if (tbDiff !== 0) return tbDiff;
        return (a.unit_price || 0) - (b.unit_price || 0);
      })[0];
    }
  }
  
  return valid.sort((a, b) => {
    const tbDiff = getTb(a) - getTb(b);
    if (tbDiff !== 0) return tbDiff;
    return (a.unit_price || 0) - (b.unit_price || 0);
  })[0];
}

function resolvePowerForPermutation(config: CCTVConfiguration, pool: Product[], brandFilter?: string) {
  if (config.wired_cameras === 0) return undefined;
  const isBudget = !brandFilter || brandFilter === "Budget";

  const powerItems = pool.filter(p => p.category === "power_device");
  
  const getPowerCh = (p: Product) => {
    return p.max_cameras || p.channels || 0;
  };
  
  const isPoe = (p: Product) => {
    const name = (p.technical_name || p.display_name || "").toLowerCase();
    const isRouterOrAccessory = name.includes("router") || name.includes("4g") || name.includes("sim") || name.includes("injector") || name.includes("cable") || name.includes("splitter");
    return (name.includes("poe") || name.includes("p.o.e") || name.includes("p-o-e")) && !name.includes("adapter") && !isRouterOrAccessory;
  };

  const isSmps = (p: Product) => {
    const name = (p.technical_name || p.display_name || "").toLowerCase();
    const isRouterOrAccessory = name.includes("router") || name.includes("4g") || name.includes("sim") || name.includes("injector") || name.includes("cable") || name.includes("splitter");
    return (name.includes("psu") || name.includes("smps") || name.includes("power")) && !(name.includes("poe") || name.includes("p.o.e") || name.includes("p-o-e")) && !isRouterOrAccessory;
  };

  let valid = powerItems.filter(p => {
      const matchTech = isTechMatch(p, config.technology);
      const matchHardware = config.technology === "IP" ? isPoe(p) : isSmps(p);
      const matchCams = getPowerCh(p) === config.recorder_channels;
      return matchTech && matchHardware && matchCams;
  });

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          const matchTech = isTechMatch(p, config.technology);
          const matchHardware = config.technology === "IP" ? isPoe(p) : isSmps(p);
          const matchCams = getPowerCh(p) >= config.recorder_channels;
          return matchTech && matchHardware && matchCams;
      });
  }

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          const matchTech = isTechMatch(p, config.technology);
          const matchHardware = config.technology === "IP" ? isPoe(p) : isSmps(p);
          return matchTech && matchHardware;
      });
  }
  
  if (valid.length === 0) valid = powerItems;
  if (valid.length === 0) return undefined;

  if (isBudget) {
    const budgetPsu = valid.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetPsu.length > 0) return budgetPsu.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    return valid.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  if (brandFilter) {
    const brandPsu = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandPsu.length > 0) return brandPsu.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  return valid.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}




