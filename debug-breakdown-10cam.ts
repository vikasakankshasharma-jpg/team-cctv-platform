import { calculatePricing } from "./lib/pricing-engine";
import type { Product, AppSettings, Addon } from "./types";

const mockProducts: Product[] = [
  { id: "cam-cp-5", category: "camera", technology: "HD", display_name: "CP Plus (5MP Color in Night)", technical_name: "cam_hd_opt3", catalog_path: "TEAM/HD/CPPLUS_5MP", unit_price: 2185, base_cost: 0, is_active: true, daily_gb_per_camera: 10 },
  { id: "dvr-16ch-5mp", category: "recorder", technology: "HD", display_name: "CP Plus (5MP Supported DVR for Upto 8nos Camera)", technical_name: "dvr_5mp_16ch", compatible_paths: ["TEAM/HD/CPPLUS_5MP"], unit_price: 5980, base_cost: 0, max_cameras: 16, is_active: true },
  { id: "psu-8ch", category: "accessory", technology: "HD", display_name: "Power Supply (8CH)", technical_name: "psu_8ch", compatible_paths: ["TEAM/HD"], unit_price: 1260, base_cost: 0, max_cameras: 8, is_active: true },
  { id: "hdd-1tb", category: "accessory", technology: "both", display_name: "HDD 1TB", technical_name: "hdd_1tb", unit_price: 5303, base_cost: 0, is_active: true },
];

const mockSettings: AppSettings = { labor_hd_per_camera: 400, labor_ip_per_camera: 500, wire_hd_price_per_mtr: 0, wire_ip_price_per_mtr: 0, gst_rate: 0, minimum_margin_threshold: 15 };
const mockAddons: Addon[] = [];

const res = calculatePricing({
  selection: { technology: "HD", camera_count: 10, selected_camera_option: 3, recording_days: 7, plan_type: "recommended", picture_quality: "good", selected_addons: [] },
  products: mockProducts, settings: mockSettings, addons: mockAddons, cablingDone: false, evaluatedAddonRules: {}
});

console.log("Breakdown for 10 Cameras Option 3:");
res.items.forEach(i => console.log(`  ${i.qty}x ${i.display_name} @ ₹${i.unit_price} = ₹${i.line_total}`));
console.log(`Total: ₹${res.net_taxable_amount}`);
