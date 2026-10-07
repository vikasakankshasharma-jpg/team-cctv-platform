import fs from "fs";
let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

// 1. Fix resolveCameras
content = content.replace(
  `const cams = pool.filter(p => (p.category as string) === "CAMERA_HD" || (p.category as string) === "CAMERA_IP" || p.category === "cctv_camera");`,
  `const cams = pool.filter(p => {
    const isCam = (p.category as string) === "CAMERA_HD" || (p.category as string) === "CAMERA_IP" || p.category === "cctv_camera";
    return isCam && p.technology === config.technology;
  });`
);

// 2. Fix resolveStorage
content = content.replace(
  `  const valid = storageItems.filter(p => {
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
  const selected = sorted[0]; // Cheapest valid storage`,
  `  const getTb = (p) => {
    if (p.storage_capacity_tb) return p.storage_capacity_tb;
    if (typeof p.capacity === 'string') {
      if (p.capacity.includes('TB')) return parseInt(p.capacity.replace('TB', '')) || 0;
      if (p.capacity.includes('GB')) return (parseInt(p.capacity.replace('GB', '')) || 0) / 1024;
    }
    return 0;
  };

  let valid = storageItems.filter(p => getTb(p) * 1024 >= config.storage_gb);
  
  if (valid.length === 0 && storageItems.length > 0) {
    valid = [...storageItems].sort((a, b) => getTb(b) - getTb(a)).slice(0, 1);
  }
  
  const sorted = [...valid].sort((a, b) => getTb(a) - getTb(b));
  const selected = sorted[0]; // Cheapest valid storage`
);

// 3. Fix resolvePower
content = content.replace(
  `function resolvePower(config: CCTVConfiguration, pool: Product[]) {
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
}`,
  `function resolvePower(config: CCTVConfiguration, pool: Product[]) {
  if (config.wired_cameras === 0) return { budget: undefined, recommended: undefined, premium: undefined };

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

  const sorted = [...valid].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  
  const budget = sorted.find(p => p.brand?.toLowerCase() === 'budget') || sorted[0];
  const premium = sorted.filter(p => p.brand?.toLowerCase() !== 'budget').sort((a, b) => (b.unit_price || 0) - (a.unit_price || 0))[0] || sorted[sorted.length - 1];
  
  return {
    budget: budget,
    recommended: sorted.filter(p => p.brand?.toLowerCase() !== 'budget')[0] || budget,
    premium: premium
  };
}`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Done");
