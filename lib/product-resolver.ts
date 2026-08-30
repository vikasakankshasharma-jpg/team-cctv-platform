import { CCTVConfiguration, Product, CCTVRequirement } from "@/types";

export interface ResolvedSystem {
  plan_type: "budget" | "recommended" | "premium";
  cameras: { product: Product; qty: number; bucket_type?: string }[];
  recorder?: Product;
  storage?: Product;
  power?: Product;
  cable_meters: number;
  connectors_qty: number;
}

export function resolveProducts(
  config: CCTVConfiguration,
  req: CCTVRequirement,
  catalog: Product[]
): { budget: ResolvedSystem; recommended: ResolvedSystem; premium: ResolvedSystem; lifecycleWarnings: string[] } {
  
  // Filter catalog to eligible items
  const lifecycleWarnings: string[] = [];
  const pool = catalog.filter(p => {
    if (!p.is_active || p.is_quotation_eligible === false) return false;
    if (p.stock_status === "out_of_stock" || p.stock_status === "discontinued") return false;
    
    if ((p.stock_status as string) === "on_demand") {
      lifecycleWarnings.push(`ON_DEMAND_WARNING: Product [${p.id}] ${p.display_name} is on-demand and may have longer lead times or unconfirmed pricing.`);
    }
    return true;
  });

  const cameras = resolveCameras(config, req, pool);
  const recorders = resolveRecorders(config, pool);
  const storage = resolveStorage(config, req, pool);
  const power = resolvePower(config, pool);

  return {
    budget: {
      plan_type: "budget",
      cameras: cameras.budget,
      recorder: recorders.budget,
      storage: storage.budget,
      power: power.budget,
      cable_meters: config.cable_meters || 0,
      connectors_qty: config.connectors_count || 0,
      site_surcharge_flags: config.site_surcharge_flags
    } as any,
    recommended: {
      plan_type: "recommended",
      cameras: cameras.recommended,
      recorder: recorders.recommended,
      storage: storage.recommended,
      power: power.recommended,
      cable_meters: config.cable_meters || 0,
      connectors_qty: config.connectors_count || 0,
      site_surcharge_flags: config.site_surcharge_flags
    } as any,
    premium: {
      plan_type: "premium",
      cameras: cameras.premium,
      recorder: recorders.premium,
      storage: storage.premium,
      power: power.premium,
      cable_meters: config.cable_meters || 0,
      connectors_qty: config.connectors_count || 0,
      site_surcharge_flags: config.site_surcharge_flags
    } as any,
    lifecycleWarnings
  };
}

function resolveCameras(config: CCTVConfiguration, req: CCTVRequirement, pool: Product[]) {
  const cams = pool.filter(p => (p.category as string) === "CAMERA_HD" || (p.category as string) === "CAMERA_IP" || p.category === "cctv_camera");
    const getCameraBySpec = (formFactor: string, targetTier: string) => {
      let filtered = cams.filter(p => {
        const pForm = (p.specifications as any)?.formFactor || p.type;
        const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
        const matchTier = targetTier === "BUDGET" ? p.brand === "Budget Brand" : p.brand !== "Budget Brand";
        return matchForm && matchTier;
      });
      if (filtered.length === 0) {
        // Fallback
        filtered = cams.filter(p => {
          const pForm = (p.specifications as any)?.formFactor || p.type;
          return pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
        });
      }
    if (filtered.length === 0) return cams[0]; // Desperate fallback
    return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  };

  const mapCameras = (tier: string) => {
    const res = [];
    if (config.indoor_cameras > 0) {
      const dome = getCameraBySpec('DOME', tier);
      if (dome) res.push({ product: dome, qty: config.indoor_cameras });
    }
    if (config.outdoor_cameras > 0) {
      const bullet = getCameraBySpec('BULLET', tier);
      if (bullet) res.push({ product: bullet, qty: config.outdoor_cameras });
    }
    
    // Fallback if split isn't there
    if (config.indoor_cameras === 0 && config.outdoor_cameras === 0 && config.total_cameras > 0) {
       const cam = getCameraBySpec('DOME', tier) || getCameraBySpec('BULLET', tier) || cams[0];
       if (cam) res.push({ product: cam, qty: config.total_cameras });
    }
    
    return res;
  };

  return {
    budget: mapCameras("BUDGET"),
    recommended: mapCameras("RECOMMENDED"),
    premium: mapCameras("PREMIUM"),
  };
}

function resolveRecorders(config: CCTVConfiguration, pool: Product[]) {
  if (!config.recorder_channels) return { budget: undefined, recommended: undefined, premium: undefined };
  
  const recs = pool.filter(p => 
    p.category === "recorder" && 
    (p.channels || p.max_cameras) === config.recorder_channels &&
    ((p.technologies || []).includes(config.technology as any) || p.technology === config.technology)
  );

  const sorted = [...recs].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  return {
    budget: sorted[0],
    recommended: sorted[Math.floor(sorted.length / 2)] || sorted[0],
    premium: sorted[sorted.length - 1] || sorted[0],
  };
}

function resolveStorage(config: CCTVConfiguration, req: CCTVRequirement, pool: Product[]) {
  if (config.storage_gb === 0 || config.storage_gb === undefined) {
    return { budget: undefined, recommended: undefined, premium: undefined };
  }

  // Very basic approximation: find HDD > storage_gb
  const storageItems = pool.filter(p => p.category === "storage" || p.storage_type === "Hard Disk");
  const valid = storageItems.filter(p => {
    let tb = p.storage_capacity_tb || 0;
    if (tb === 0 && typeof p.capacity === 'string' && p.capacity.includes('TB')) {
      tb = parseInt(p.capacity.replace('TB', '')) || 0;
    }
    return tb * 1024 >= config.storage_gb!;
  });
  
  const sorted = [...valid].sort((a, b) => {
    let aTb = a.storage_capacity_tb || (typeof a.capacity === 'string' ? parseInt(a.capacity.replace('TB', '')) || 0 : 0);
    let bTb = b.storage_capacity_tb || (typeof b.capacity === 'string' ? parseInt(b.capacity.replace('TB', '')) || 0 : 0);
    return aTb - bTb;
  });
  const selected = sorted[0]; // Cheapest valid storage

  return {
    budget: selected,
    recommended: selected, // Often same for all tiers unless they want enterprise drives
    premium: sorted[sorted.length - 1] || selected
  };
}

function resolvePower(config: CCTVConfiguration, pool: Product[]) {
  if ((config.power_wattage_w || 0) === 0) return { budget: undefined, recommended: undefined, premium: undefined };

  const powerItems = pool.filter(p => p.category === "power_device");
  let valid = powerItems.filter(p => (p.power_wattage_w || 0) >= config.power_wattage_w!);
  if (valid.length === 0) valid = powerItems; // fallback to any power supply if wattage missing

  const sorted = [...valid].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  return {
    budget: sorted[0],
    recommended: sorted[0],
    premium: sorted[sorted.length - 1] || sorted[0]
  };


}
