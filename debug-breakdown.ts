import { calculatePricing } from "./lib/pricing-engine";
import type { Product, AppSettings, Addon } from "./types";

const mockProducts: Product[] = [
  { id: "cam-budget", category: "camera", technology: "HD", display_name: "Budget Brand (2MP Color in Night)", technical_name: "cam_hd_opt1", catalog_path: "TEAM/HD/BUDGET", unit_price: 975, base_cost: 0, is_active: true, daily_gb_per_camera: 15 },
  { id: "dvr-4ch-2mp", category: "recorder", technology: "HD", display_name: "CP Plus (2MP Supported DVR for Upto 4nos Camera)", technical_name: "dvr_4ch", compatible_paths: ["TEAM/HD"], unit_price: 2990, base_cost: 0, max_cameras: 4, is_active: true },
  { id: "psu-8ch", category: "accessory", technology: "HD", display_name: "Power Supply (8CH)", technical_name: "psu_8ch", compatible_paths: ["TEAM/HD"], unit_price: 1260, base_cost: 0, max_cameras: 8, is_active: true },
  { id: "hdd-500", category: "accessory", technology: "both", display_name: "HDD 500GB", technical_name: "hdd_500gb", unit_price: 2153, base_cost: 0, is_active: true },
];

const mockSettings: AppSettings = { labor_hd_per_camera: 400, labor_ip_per_camera: 500, wire_hd_price_per_mtr: 0, wire_ip_price_per_mtr: 0, gst_rate: 0, minimum_margin_threshold: 15 };
const mockAddons: Addon[] = [];

const res = calculatePricing({
  selection: { technology: "HD", camera_count: 1, selected_camera_option: 1, recording_days: 4, plan_type: "recommended", picture_quality: "good", selected_addons: [] },
  products: mockProducts, settings: mockSettings, addons: mockAddons, cablingDone: false, evaluatedAddonRules: {}
});

console.log("Breakdown for 1 Camera Option 1:");
res.items.forEach(i => console.log(`  ${i.qty}x ${i.display_name} @ ₹${i.unit_price} = ₹${i.line_total}`));
console.log(`Total: ₹${res.net_taxable_amount}`);
