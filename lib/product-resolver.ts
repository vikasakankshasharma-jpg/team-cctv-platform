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
): { budget: ResolvedSystem; recommended: ResolvedSystem; premium: ResolvedSystem } {
  
  // Filter catalog to eligible items
  const pool = catalog.filter(p => 
    p.is_active && 
    p.stock_status !== "out_of_stock" && 
    p.stock_status !== "discontinued" &&
    p.is_quotation_eligible !== false
  );

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
      connectors_qty: config.connectors_count || 0
    },
    recommended: {
      plan_type: "recommended",
      cameras: cameras.recommended,
      recorder: recorders.recommended,
      storage: storage.recommended,
      power: power.recommended,
      cable_meters: config.cable_meters || 0,
      connectors_qty: config.connectors_count || 0
    },
    premium: {
      plan_type: "premium",
      cameras: cameras.premium,
      recorder: recorders.premium,
      storage: storage.premium,
      power: power.premium,
      cable_meters: config.cable_meters || 0,
      connectors_qty: config.connectors_count || 0
    }
  };
}

function resolveCameras(config: CCTVConfiguration, req: CCTVRequirement, pool: Product[]) {
  // Simplistic placeholder for resolving cameras per bucket
  const cams = pool.filter(p => p.category === "cctv_camera" && (p.technologies || []).includes(config.technology as any));
  
  // Sort by price or tier
  const sorted = [...cams].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  
  const budgetCam = sorted[0];
  const recCam = sorted[Math.floor(sorted.length / 2)] || budgetCam;
  const premCam = sorted[sorted.length - 1] || recCam;

  const getMapped = (cam: Product) => {
    if (req.mixed_camera_requirements && req.mixed_camera_requirements.length > 0) {
       return req.mixed_camera_requirements.map((r: any) => ({ product: cam, qty: r.count, bucket_type: r.type }));
    }
    return [{ product: cam, qty: config.total_cameras }];
  };

  return {
    budget: budgetCam ? getMapped(budgetCam) : [],
    recommended: recCam ? getMapped(recCam) : [],
    premium: premCam ? getMapped(premCam) : [],
  };
}

function resolveRecorders(config: CCTVConfiguration, pool: Product[]) {
  if (!config.recorder_channels) return { budget: undefined, recommended: undefined, premium: undefined };
  
  const recs = pool.filter(p => 
    p.category === "recorder" && 
    (p.channels || p.max_cameras) === config.recorder_channels &&
    (p.technologies || []).includes(config.technology as any)
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
  const valid = storageItems.filter(p => (p.storage_capacity_tb || 0) * 1024 >= config.storage_gb!);
  
  const sorted = [...valid].sort((a, b) => (a.storage_capacity_tb || 0) - (b.storage_capacity_tb || 0));
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
  const valid = powerItems.filter(p => (p.power_wattage_w || 0) >= config.power_wattage_w!);

  const sorted = [...valid].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  return {
    budget: sorted[0],
    recommended: sorted[0],
    premium: sorted[sorted.length - 1] || sorted[0]
  };
}


