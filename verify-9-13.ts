import { calculatePricing } from "./lib/pricing-engine";
import type { Product, AppSettings, Addon } from "./types";

const mockProducts: Product[] = [
  // Cameras
  { id: "cam-budget", category: "camera", technology: "HD", display_name: "Budget Brand (2MP Color in Night)", technical_name: "cam_hd_opt1", catalog_path: "TEAM/HD/BUDGET", unit_price: 975, base_cost: 0, is_active: true, daily_gb_per_camera: 10 },
  { id: "cam-cp-2.4", category: "camera", technology: "HD", display_name: "CP Plus (2.4MP Color in Night)", technical_name: "cam_hd_opt2", catalog_path: "TEAM/HD/CPPLUS", unit_price: 1495, base_cost: 0, is_active: true, daily_gb_per_camera: 10 },
  { id: "cam-cp-5", category: "camera", technology: "HD", display_name: "CP Plus (5MP Color in Night)", technical_name: "cam_hd_opt3", catalog_path: "TEAM/HD/CPPLUS_5MP", unit_price: 2185, base_cost: 0, is_active: true, daily_gb_per_camera: 10 },

  // DVRs
  { 
    id: "dvr-16ch-2mp", category: "recorder", technology: "HD", 
    display_name: "Budget Brand (2MP Supported DVR for Upto 16nos Camera)", 
    technical_name: "dvr_16ch", compatible_paths: ["TEAM/HD/BUDGET", "TEAM/HD/CPPLUS"],
    unit_price: 7245, base_cost: 0, max_cameras: 16, is_active: true 
  },
  { 
    id: "dvr-16ch-5mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (5MP Supported DVR for Upto 16nos Camera)", 
    technical_name: "dvr_5mp_16ch", compatible_paths: ["TEAM/HD/CPPLUS_5MP"],
    unit_price: 20700, base_cost: 0, max_cameras: 16, is_active: true 
  },

  // Power Supply (Setting max_cameras to 16 to match manual quote's 1-PSU behavior for testing)
  { id: "psu-8ch", category: "accessory", technology: "HD", display_name: "Power Supply (8CH)", technical_name: "psu_8ch", compatible_paths: ["TEAM/HD"], unit_price: 1260, base_cost: 0, max_cameras: 16, is_active: true },
  
  // HDD
  { id: "hdd-1tb", category: "accessory", technology: "both", display_name: "HDD 1TB", technical_name: "hdd_1tb", unit_price: 5303, base_cost: 0, is_active: true },
];

const mockSettings: AppSettings = { labor_hd_per_camera: 400, labor_ip_per_camera: 500, wire_hd_price_per_mtr: 0, wire_ip_price_per_mtr: 0, gst_rate: 0, minimum_margin_threshold: 15 };
const mockAddons: Addon[] = [];

const testCounts = [9, 10, 11, 12, 13];

console.log("=== HD QUOTATION VERIFICATION (9-13 Cameras) ===");

for (const count of testCounts) {
  console.log(`\n--- ${count} Cameras ---`);
  for (let opt = 1; opt <= 3; opt++) {
    const res = calculatePricing({
      selection: { technology: "HD", camera_count: count, selected_camera_option: opt, recording_days: 7, plan_type: "recommended", picture_quality: "good", selected_addons: [] },
      products: mockProducts, settings: mockSettings, addons: mockAddons, cablingDone: false, evaluatedAddonRules: {}
    });
    console.log(`Option ${opt} Total: ₹${res.net_taxable_amount}`);
  }
}
