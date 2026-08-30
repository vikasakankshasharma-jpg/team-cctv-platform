const fs = require('fs');

let code = fs.readFileSync('lib/product-resolver.ts', 'utf8');

// 1. Change return type to include lifecycleWarnings
code = code.replace(
  '): { budget: ResolvedSystem; recommended: ResolvedSystem; premium: ResolvedSystem } {',
  '): { budget: ResolvedSystem; recommended: ResolvedSystem; premium: ResolvedSystem; lifecycleWarnings: string[] } {'
);

// 2. Add Lifecycle filtering and warnings
const filterLogic = `  const lifecycleWarnings: string[] = [];
  const pool = catalog.filter(p => {
    if (!p.is_active || p.is_quotation_eligible === false) return false;
    if (p.stock_status === "out_of_stock" || p.stock_status === "discontinued") return false;
    
    if (p.stock_status === "on_demand") {
      lifecycleWarnings.push(\`ON_DEMAND_WARNING: Product \${p.display_name} is on-demand and may have longer lead times or unconfirmed pricing.\`);
    }
    return true;
  });`;

code = code.replace(
  /  const pool = catalog\.filter\(p =>[\s\S]*?is_quotation_eligible !== false\n  \);/m,
  filterLogic
);

// 3. Update return object to include lifecycleWarnings
code = code.replace(
  '      connectors_qty: config.connectors_count || 0\n    }\n  };\n}',
  '      connectors_qty: config.connectors_count || 0\n    },\n    lifecycleWarnings\n  };\n}'
);

// 4. Advanced Camera Resolution (Dome vs Bullet)
const resolveCamerasLogic = `function resolveCameras(config: CCTVConfiguration, req: CCTVRequirement, pool: Product[]) {
  const cams = pool.filter(p => p.category === "CAMERA_HD" || p.category === "CAMERA_IP" || p.category === "cctv_camera");
  
  const getCameraBySpec = (formFactor: string, targetTier: string) => {
    let filtered = cams.filter(p => {
      const matchForm = (p.specifications as any)?.formFactor === formFactor;
      const matchTier = targetTier === "BUDGET" ? p.brand === "Budget Brand" : p.brand !== "Budget Brand";
      return matchForm && matchTier;
    });
    if (filtered.length === 0) {
      // Fallback
      filtered = cams.filter(p => (p.specifications as any)?.formFactor === formFactor);
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
}`;

code = code.replace(
  /function resolveCameras\(config: CCTVConfiguration, req: CCTVRequirement, pool: Product\[\]\) \{[\s\S]*?  \};\n\}/m,
  resolveCamerasLogic
);

fs.writeFileSync('lib/product-resolver.ts', code);
