import fs from "fs";

const newContent = `
import { Product, CCTVRequirement, CCTVConfiguration, ResolvedSystem } from "@/types";

export function resolveProducts(
  config: CCTVConfiguration,
  req: CCTVRequirement,
  catalog: Product[]
): { plans: Record<string, ResolvedSystem>; lifecycleWarnings: string[] } {
  
  const lifecycleWarnings: string[] = [];
  const pool = catalog.filter(p => {
    if (!p.is_active || p.is_quotation_eligible === false) return false;
    if (p.stock_status === "out_of_stock" || p.stock_status === "discontinued") return false;
    if ((p.stock_status as string) === "on_demand") {
      lifecycleWarnings.push(\`ON_DEMAND_WARNING: Product [\${p.id}] \${p.display_name} is on-demand.\`);
    }
    return true;
  });

  // Find all available Camera combinations
  const allCameras = pool.filter(p => p.category === "CAMERA_HD" || p.category === "CAMERA_IP" || p.category === "cctv_camera");
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
     if (tech && res) combinations.add(\`\${tech}_\${res}\`);
  });

  const plans: Record<string, ResolvedSystem> = {};

  combinations.forEach(combo => {
      const [tech, res] = combo.split("_");
      
      // Override config for this permutation
      const permConfig = { ...config, technology: tech };
      
      const cameras = resolveCamerasForPermutation(permConfig, res, allCameras);
      if (cameras.length === 0) return; // Skip if we can't find a complete set

      const recorder = resolveRecorderForPermutation(permConfig, pool);
      const storage = resolveStorageForPermutation(permConfig, pool);
      const power = resolvePowerForPermutation(permConfig, pool);

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

function resolveCamerasForPermutation(config: CCTVConfiguration, targetResolution: string, cams: Product[]) {
  const getCameraBySpec = (formFactor: string) => {
    let filtered = cams.filter(p => {
      // Must match Technology
      if (p.technology && p.technology !== config.technology) return false;
      
      // Must match Form Factor
      const pForm = (p.specifications as any)?.formFactor || p.type || (p.display_name?.toLowerCase().includes("bullet") ? "bullet" : (p.display_name?.toLowerCase().includes("dome") ? "dome" : ""));
      const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
      
      // Must match Resolution
      const pRes = (p.specifications as any)?.resolution || p.resolution;
      let matchRes = false;
      if (!pRes) {
         matchRes = p.display_name?.toLowerCase().includes(targetResolution.toLowerCase()) || false;
      } else {
         matchRes = pRes === targetResolution || pRes.includes(targetResolution);
      }

      return matchForm && matchRes;
    });

    if (filtered.length === 0) return undefined;

    // Prefer CP Plus if available, otherwise pick the cheapest
    const cpPlus = filtered.filter(p => p.brand?.toLowerCase().includes("cp plus") || p.brand?.toLowerCase().includes("cpplus"));
    if (cpPlus.length > 0) return cpPlus.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    
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

function resolveRecorderForPermutation(config: CCTVConfiguration, pool: Product[]) {
  if (!config.recorder_channels) return undefined;
  
  const recs = pool.filter(p => 
    p.category === "recorder" && 
    (p.channels || p.max_cameras) === config.recorder_channels &&
    ((p.technologies || []).includes(config.technology as any) || p.technology === config.technology)
  );

  if (recs.length === 0) return undefined;

  // Prefer CP Plus
  const cpPlus = recs.filter(p => p.brand?.toLowerCase().includes("cp plus") || p.brand?.toLowerCase().includes("cpplus"));
  if (cpPlus.length > 0) return cpPlus.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];

  return recs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}

function resolveStorageForPermutation(config: CCTVConfiguration, pool: Product[]) {
  if (config.storage_gb === 0 || config.storage_gb === undefined) return undefined;

  const storageItems = pool.filter(p => p.category === "storage" || p.storage_type === "Hard Disk");
  const getTb = (p: Product) => {
    if (p.storage_capacity_tb) return p.storage_capacity_tb;
    if (typeof p.capacity === "string") {
      if (p.capacity.includes("TB")) return parseInt(p.capacity.replace("TB", "")) || 0;
      if (p.capacity.includes("GB")) return (parseInt(p.capacity.replace("GB", "")) || 0) / 1024;
    }
    return 0;
  };

  let valid = storageItems.filter(p => getTb(p) * 1024 >= config.storage_gb!);
  if (valid.length === 0 && storageItems.length > 0) {
    valid = [...storageItems].sort((a, b) => getTb(b) - getTb(a)).slice(0, 1);
  }
  
  if (valid.length === 0) return undefined;
  return valid.sort((a, b) => getTb(a) - getTb(b))[0];
}

function resolvePowerForPermutation(config: CCTVConfiguration, pool: Product[]) {
  if (config.wired_cameras === 0) return undefined;

  const powerItems = pool.filter(p => p.category === "power_device");
  
  let valid = powerItems.filter(p => {
      const matchTech = !p.technology || p.technology === config.technology;
      const matchCams = (p.max_cameras || 0) === config.recorder_channels;
      return matchTech && matchCams;
  });

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          const matchTech = !p.technology || p.technology === config.technology;
          const matchCams = (p.max_cameras || 0) >= config.recorder_channels;
          return matchTech && matchCams;
      });
  }

  if (valid.length === 0) {
      valid = powerItems.filter(p => !p.technology || p.technology === config.technology);
  }
  
  if (valid.length === 0) valid = powerItems;
  if (valid.length === 0) return undefined;

  // Prefer CP Plus
  const cpPlus = valid.filter(p => p.brand?.toLowerCase().includes("cp plus") || p.brand?.toLowerCase().includes("cpplus"));
  if (cpPlus.length > 0) return cpPlus.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];

  return valid.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}
`;

fs.writeFileSync("lib/product-resolver.ts", newContent);
console.log("Rewrote product-resolver.ts completely!");
