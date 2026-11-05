import { calculatePricing } from "../lib/pricing-engine";
import { ConfiguratorSelection } from "../types";

/**
 * Automated Test Suite: Storage Physics Parity & Multi-Tier Verification
 * Validates inverse camera scaling, technology differentiation, and transparency rules.
 */

const mockHdds = [
  { id: "HDD-BUD-500GB", brand: "Budget Brand", category: "storage", display_name: "Budget Brand 500GB Surveillance HDD", capacity: "500GB", storage_capacity_tb: 0.5, unit_price: 1800, base_cost: 1400, is_active: true, is_refurbished: true },
  { id: "HDD-BUD-1TB", brand: "Budget Brand", category: "storage", display_name: "Budget Brand 1TB Surveillance HDD", capacity: "1TB", storage_capacity_tb: 1.0, unit_price: 2880, base_cost: 2400, is_active: true, is_refurbished: true },
  { id: "HDD-BUD-2TB", brand: "Budget Brand", category: "storage", display_name: "Budget Brand 2TB Surveillance HDD", capacity: "2TB", storage_capacity_tb: 2.0, unit_price: 4560, base_cost: 3800, is_active: true, is_refurbished: true },
  { id: "HDD-BUD-4TB", brand: "Budget Brand", category: "storage", display_name: "Budget Brand 4TB Surveillance HDD", capacity: "4TB", storage_capacity_tb: 4.0, unit_price: 7440, base_cost: 6200, is_active: true, is_refurbished: true },
  { id: "HDD-SEA-1TB", brand: "Seagate", category: "storage", display_name: "Seagate SkyHawk 1TB Surveillance HDD", capacity: "1TB", storage_capacity_tb: 1.0, unit_price: 4154, base_cost: 3500, is_active: true, is_refurbished: false },
  { id: "HDD-SEA-2TB", brand: "Seagate", category: "storage", display_name: "Seagate SkyHawk 2TB Surveillance HDD", capacity: "2TB", storage_capacity_tb: 2.0, unit_price: 5800, base_cost: 5000, is_active: true, is_refurbished: false },
  { id: "HDD-SEA-4TB", brand: "Seagate", category: "storage", display_name: "Seagate SkyHawk 4TB Surveillance HDD", capacity: "4TB", storage_capacity_tb: 4.0, unit_price: 9500, base_cost: 8200, is_active: true, is_refurbished: false },
  { id: "SD-64GB", brand: "Sandisk", category: "storage", display_name: "Sandisk 64GB High Endurance MicroSD", storage_type: "Micro SD", storage_capacity_gb: 64, unit_price: 650, base_cost: 500, is_active: true },
  { id: "SD-128GB", brand: "Sandisk", category: "storage", display_name: "Sandisk 128GB High Endurance MicroSD", storage_type: "Micro SD", storage_capacity_gb: 128, unit_price: 1100, base_cost: 850, is_active: true },
];

const mockCams = [
  { id: "CAM-HD-2MP", brand: "Hikvision", category: "cctv_camera", display_name: "Hikvision 2MP HD Bullet", resolution: "2MP", technologies: ["HD"], unit_price: 1200, base_cost: 950, is_active: true },
  { id: "CAM-IP-2MP", brand: "Hikvision", category: "cctv_camera", display_name: "Hikvision 2MP IP Bullet", resolution: "2MP", technologies: ["IP"], unit_price: 2200, base_cost: 1800, is_active: true },
  { id: "CAM-WIFI-2MP", brand: "Hikvision", category: "cctv_camera", display_name: "Hikvision 2MP Wi-Fi Bullet", resolution: "2MP", technologies: ["Wireless"], unit_price: 2500, base_cost: 2000, is_active: true, has_wifi: true, max_sd_capacity_gb: 256 },
];

const mockRecorders = [
  { id: "DVR-4CH", brand: "Hikvision", category: "dvr_nvr", display_name: "Hikvision 4-Ch DVR", channels: 4, compression: "H.265 Pro+", unit_price: 2500, base_cost: 2000, is_active: true },
  { id: "DVR-8CH", brand: "Hikvision", category: "dvr_nvr", display_name: "Hikvision 8-Ch DVR", channels: 8, compression: "H.265 Pro+", unit_price: 3500, base_cost: 2800, is_active: true },
  { id: "DVR-16CH", brand: "Hikvision", category: "dvr_nvr", display_name: "Hikvision 16-Ch DVR", channels: 16, compression: "H.265 Pro+", unit_price: 5500, base_cost: 4500, is_active: true },
  { id: "NVR-8CH", brand: "Hikvision", category: "dvr_nvr", display_name: "Hikvision 8-Ch NVR", channels: 8, compression: "H.265+", unit_price: 4500, base_cost: 3800, is_active: true },
  { id: "NVR-16CH", brand: "Hikvision", category: "dvr_nvr", display_name: "Hikvision 16-Ch NVR", channels: 16, compression: "H.265+", unit_price: 6500, base_cost: 5500, is_active: true },
];

const settings: any = { labor_hd_per_camera: 400, labor_ip_per_camera: 500, cable_copper_coated_hd: 8, cable_copper_coated_ip: 12 };

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log("=================================================");
console.log("🧪 RUNNING STORAGE PHYSICS PARITY SUITE");
console.log("=================================================\n");

// --- TEST 1: HD Analog Inverse Scaling (500GB HDD) ---
console.log("--- 1. HD Analog 500GB Inverse Scaling ---");
const hd4Econ = calculatePricing({
  selection: { camera_count: 4, technology: "HD", plan_type: "budget", is_economy_storage: true, recording_days: 3, selected_addons: [] } as any,
  products: [...mockCams, ...mockRecorders] as any,
  addons: mockHdds as any,
  settings,
});
const hd4Storage = hd4Econ.items.find(i => i.product_id === "HDD-BUD-500GB");
const hd4Days = (hd4Storage as any)?.approx_days;
assert(hd4Days === 7, `4 cameras on 500GB must yield 7 days (Got: ${hd4Days})`);

const hd8Econ = calculatePricing({
  selection: { camera_count: 8, technology: "HD", plan_type: "budget", is_economy_storage: true, recording_days: 3, selected_addons: [] } as any,
  products: [...mockCams, ...mockRecorders] as any,
  addons: mockHdds as any,
  settings,
});
const hd8Storage = hd8Econ.items.find(i => i.product_id === "HDD-BUD-500GB");
const hd8Days = (hd8Storage as any)?.approx_days;
assert(hd8Days === 3, `8 cameras on 500GB must yield 3 days (Got: ${hd8Days}, NOT 6 days)`);
assert(hd8Days < hd4Days, `Storage days must strictly decrease as camera count increases (${hd8Days} < ${hd4Days})`);

// --- TEST 2: HD Analog Standard Quote picks Genuine Surveillance HDD ---
console.log("\n--- 2. HD Analog Standard Branded Quote Quality Tier ---");
const hd8Std = calculatePricing({
  selection: { camera_count: 8, technology: "HD", plan_type: "recommended", brand_preference: "hikvision", recording_days: 7, selected_addons: [] } as any,
  products: [...mockCams, ...mockRecorders] as any,
  addons: mockHdds as any,
  settings,
});
const hd8StdStorage = hd8Std.items.find(i => i.product_id === "HDD-SEA-1TB");
assert(!!hd8StdStorage, `Hikvision standard quote must select 100% Genuine Seagate SkyHawk 1TB (Got: ${hd8Std.items.find(i => i.display_name.includes("HDD"))?.display_name})`);
assert((hd8StdStorage as any)?.approx_days === 7, `8 cameras on 1TB must yield 7 days (Got: ${(hd8StdStorage as any)?.approx_days})`);

// --- TEST 3: IP Network Parity ---
console.log("\n--- 3. IP Network Native H.265 Parity ---");
const ip4Std = calculatePricing({
  selection: { camera_count: 4, technology: "IP", plan_type: "recommended", recording_days: 7, selected_addons: [] } as any,
  products: [...mockCams, ...mockRecorders] as any,
  addons: mockHdds as any,
  settings,
});
const ip4Storage = ip4Std.items.find(i => i.product_id === "HDD-SEA-1TB");
assert((ip4Storage as any)?.approx_days === 17, `4 IP cameras on 1TB must yield 17 days (Got: ${(ip4Storage as any)?.approx_days})`);

const ip8Std = calculatePricing({
  selection: { camera_count: 8, technology: "IP", plan_type: "recommended", recording_days: 7, selected_addons: [] } as any,
  products: [...mockCams, ...mockRecorders] as any,
  addons: mockHdds as any,
  settings,
});
const ip8Storage = ip8Std.items.find(i => i.product_id === "HDD-SEA-1TB");
assert((ip8Storage as any)?.approx_days === 8, `8 IP cameras on 1TB must yield 8 days (Got: ${(ip8Storage as any)?.approx_days})`);
assert((ip8Storage as any)?.approx_days < (ip4Storage as any)?.approx_days, `IP storage days must strictly scale inversely with camera count`);

// --- TEST 4: Smart Wireless Dedicated MicroSD (1 Card Per Camera) ---
console.log("\n--- 4. Smart Wireless IP Dedicated MicroSD Card Scaling ---");
for (const count of [1, 4, 8]) {
  const wifiRes = calculatePricing({
    selection: { camera_count: count, technology: "Wireless", plan_type: "recommended", recording_days: 7, selected_addons: [] } as any,
    products: [...mockCams, ...mockRecorders] as any,
    addons: mockHdds as any,
    settings,
  });
  const sdCard = wifiRes.items.find(i => i.product_id === "SD-64GB");
  assert(!!sdCard, `Wireless must select MicroSD card`);
  assert(sdCard?.qty === count, `Wireless MicroSD quantity (${sdCard?.qty}) must match camera count (${count})`);
  assert((sdCard as any)?.approx_days === 14, `64GB MicroSD in motion mode must provide 14 days per camera`);
}

console.log("\n=================================================");
console.log("🎉 ALL STORAGE PHYSICS PARITY TESTS PASSED (100%)");
console.log("=================================================");
