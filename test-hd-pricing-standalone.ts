import { calculatePricing } from "./lib/pricing-engine";
import type { Product, AppSettings, Addon } from "./types";

const mockProducts: Product[] = [
  // Cameras
  { 
    id: "cam-budget", category: "camera", technology: "HD", 
    display_name: "Budget Brand (2MP Color in Night)", 
    technical_name: "cam_hd_opt1", catalog_path: "TEAM/HD/BUDGET",
    unit_price: 975, base_cost: 0, is_active: true,
    daily_gb_per_camera: 15 // Adjusting to ensure 10 cameras hit 1TB
  },
  { 
    id: "cam-cp-2.4", category: "camera", technology: "HD", 
    display_name: "CP Plus (2.4MP Color in Night)", 
    technical_name: "cam_hd_opt2", catalog_path: "TEAM/HD/CPPLUS",
    unit_price: 1495, base_cost: 0, is_active: true,
    daily_gb_per_camera: 15
  },
  { 
    id: "cam-cp-5", category: "camera", technology: "HD", 
    display_name: "CP Plus (5MP Color in Night)", 
    technical_name: "cam_hd_opt3", catalog_path: "TEAM/HD/CPPLUS_5MP",
    unit_price: 2185, base_cost: 0, is_active: true,
    daily_gb_per_camera: 15
  },

  // DVRs
  { 
    id: "dvr-4ch-2mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (2MP Supported DVR for Upto 4nos Camera)", 
    technical_name: "dvr_4ch", compatible_paths: ["TEAM/HD"],
    unit_price: 2990, base_cost: 0, max_cameras: 4, is_active: true 
  },
  { 
    id: "dvr-4ch-5mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (5MP Supported DVR for Upto 4nos Camera)", 
    technical_name: "dvr_5mp_4ch", compatible_paths: ["TEAM/HD/CPPLUS_5MP"],
    unit_price: 4198, base_cost: 0, max_cameras: 4, is_active: true 
  },
  { 
    id: "dvr-8ch-2mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (2MP Supported DVR for Upto 8nos Camera)", 
    technical_name: "dvr_8ch", compatible_paths: ["TEAM/HD"],
    unit_price: 4140, base_cost: 0, max_cameras: 8, is_active: true 
  },
  { 
    id: "dvr-8ch-5mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (5MP Supported DVR for Upto 8nos Camera)", 
    technical_name: "dvr_5mp_8ch", compatible_paths: ["TEAM/HD/CPPLUS_5MP"],
    unit_price: 5980, base_cost: 0, max_cameras: 8, is_active: true 
  },
  { 
    id: "dvr-16ch-2mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (2MP Supported DVR for Upto 16nos Camera)", 
    technical_name: "dvr_16ch", compatible_paths: ["TEAM/HD"],
    unit_price: 6500, base_cost: 0, max_cameras: 16, is_active: true 
  },
  { 
    id: "dvr-16ch-5mp", category: "recorder", technology: "HD", 
    display_name: "CP Plus (5MP Supported DVR for Upto 16nos Camera)", 
    technical_name: "dvr_5mp_16ch", compatible_paths: ["TEAM/HD/CPPLUS_5MP"],
    unit_price: 8500, base_cost: 0, max_cameras: 16, is_active: true 
  },

  // Power Supplies
  { 
    id: "psu-8ch", category: "accessory", technology: "HD", 
    display_name: "Power Supply (8CH)", technical_name: "psu_8ch",
    compatible_paths: ["TEAM/HD"],
    unit_price: 1260, base_cost: 0, max_cameras: 8, is_active: true 
  },
  { 
    id: "psu-16ch", category: "accessory", technology: "HD", 
    display_name: "Power Supply (16CH)", technical_name: "psu_16ch",
    compatible_paths: ["TEAM/HD"],
    unit_price: 2400, base_cost: 0, max_cameras: 16, is_active: true 
  },

  // HDDs
  { 
    id: "hdd-500", category: "accessory", technology: "both", 
    display_name: "HDD 500GB", technical_name: "hdd_500gb",
    unit_price: 2153, base_cost: 0, is_active: true 
  },
  { 
    id: "hdd-1tb", category: "accessory", technology: "both", 
    display_name: "HDD 1TB", technical_name: "hdd_1tb",
    unit_price: 5303, base_cost: 0, is_active: true 
  },
];

const mockSettings: AppSettings = {
  labor_hd_per_camera: 400,
  labor_ip_per_camera: 500,
  wire_hd_price_per_mtr: 0,
  wire_ip_price_per_mtr: 0,
  gst_rate: 0,
  minimum_margin_threshold: 15,
};

const mockAddons: Addon[] = [];

async function runTests() {
  console.log("=== HD QUOTATION VERIFICATION (1-10 Cameras) ===");
  
  const targetCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const count of targetCounts) {
    console.log(`\n--- ${count} Cameras ---`);
    for (let opt = 1; opt <= 3; opt++) {
      const res = calculatePricing({
        selection: {
          technology: "HD",
          camera_count: count,
          selected_camera_option: opt,
          recording_days: count <= 4 ? 4 : 7, // Setting days to hit 500GB vs 1TB thresholds
          plan_type: "recommended",
          picture_quality: "good",
          selected_addons: []
        },
        products: mockProducts,
        settings: mockSettings,
        addons: mockAddons,
        cablingDone: false,
        evaluatedAddonRules: {}
      });

      console.log(`Option ${opt} Total: ₹${res.net_taxable_amount}`);
    }
  }
}

runTests();
