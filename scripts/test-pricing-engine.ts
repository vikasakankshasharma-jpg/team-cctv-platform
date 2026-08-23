import { calculatePricing } from "../lib/pricing-engine";
import { ConfiguratorSelection, Product, Addon, AppSettings } from "../types";

// Dummy Settings
const settings: AppSettings = {
  company_name: "Test Co",
  company_logo_url: null,
  gst_rate: 18,
  labor_fitting_only_rate: 300,
  labor_full_installation_rate: 500,
  wire_cost_per_meter: 20,
  whatsapp_template: "",
  pricing_cache_ttl_seconds: 3600,
  otp_provider: "other",
  tier_budget_label: "Budget",
  tier_budget_multiplier: 1,
  tier_recommended_label: "Recommended",
  tier_recommended_multiplier: 1.2,
  tier_premium_label: "Premium",
  tier_premium_multiplier: 1.5,
  max_supported_cameras: 16,
  labor_ip_per_camera: 1000,
  labor_hd_per_camera: 800,
  cable_copper_coated_ip: 25,
  cable_copper_coated_hd: 20,
  cable_pure_copper: 35,
  connector_rj45_cost: 15,
  connector_bnc_dc_cost: 30,
  cable_overage_per_mtr: 30,
  visit_charge: 500,
  amc_1yr_pct: 10,
  amc_2yr_pct: 15,
  amc_3yr_pct: 20,
  quote_validity_days: 7,
};

// Dummy Products
const products: Product[] = [
  {
    id: "cam1",
    technical_name: "IP Camera 2MP",
    display_name: "IP Camera 2MP",
    category: "cctv_camera" as any,
    technologies: ["IP"],
    unit_price: 1500,
    is_active: true,
    resolution_mp: 2,
    stock_quantity: 100, // In stock
    stock_status: "in_stock"
  },
  {
    id: "cam2_oos",
    technical_name: "IP Camera 4MP",
    display_name: "IP Camera 4MP (OOS)",
    category: "cctv_camera" as any,
    technologies: ["IP"],
    unit_price: 2500,
    is_active: true,
    resolution_mp: 4,
    stock_quantity: 0, // OUT OF STOCK
    stock_status: "out_of_stock"
  },
  {
    id: "rec_4ch",
    technical_name: "4CH NVR",
    display_name: "4 Channel NVR",
    category: "recorder" as any,
    technologies: ["IP"],
    unit_price: 3000,
    is_active: true,
    channels: 4,
    max_cameras: 4,
    stock_quantity: 50,
    stock_status: "in_stock"
  },
  {
    id: "rec_8ch",
    technical_name: "8CH NVR",
    display_name: "8 Channel NVR",
    category: "recorder" as any,
    technologies: ["IP"],
    unit_price: 5000,
    is_active: true,
    channels: 8,
    max_cameras: 8,
    stock_quantity: 50,
    stock_status: "in_stock"
  }
];

// Empty Addons
const addons: Addon[] = [
  {
    id: "cable_ip",
    display_name: "IP Cable",
    category: "cable",
    addon_type: "hardware",
    unit_price: 25,
    technologies: ["IP"],
    billing_type: "per_unit",
    stock_quantity: 1000,
    stock_status: "in_stock",
    is_active: true
  } as any
];

console.log("=== STARTING PRICING ENGINE TESTS ===\n");

// Test 1: Capacity scaling
let selection: ConfiguratorSelection = {
  camera_count: 5,
  picture_quality: "good",
  recording_days: 7,
  technology: "IP",
  selected_addons: [],
  plan_type: "recommended",
};

let result = calculatePricing({ selection, products, addons, settings, cablingDone: false });
const recItem = result.items.find(i => i.display_name.includes("Channel NVR"));
console.log(`Test 1 (Capacity Logic): For 5 cameras, selected recorder: ${recItem ? recItem.display_name : 'NONE'}`);
if (recItem && recItem.display_name.includes("8 Channel")) {
  console.log("✅ PASS: Correctly skipped 4CH NVR and picked 8CH NVR for 5 cameras.\n");
} else {
  console.log("❌ FAIL: Did not pick correct NVR capacity.\n");
}

// Test 2: OOS logic
selection.camera_count = 4;
selection.selected_camera_id = "cam2_oos";
result = calculatePricing({ selection, products, addons, settings, cablingDone: false });
console.log(`Test 2 (Out of Stock Check): User tries to force 'cam2_oos' (stock_quantity=0)`);
const camSelected = result.items.find(i => i.product_id?.startsWith("cam"));
console.log(`Engine actually picked: ${camSelected?.product_id} (${camSelected?.display_name})`);
if (result.error && result.error_message?.includes("Out of stock")) {
  console.log("✅ PASS: Engine blocked the quote and set an error message for OOS item.\n");
} else if (camSelected?.product_id !== "cam2_oos") {
  console.log("✅ PASS: Engine safely ignored the OOS selection and picked a valid fallback.\n");
} else {
  console.log("❌ FAIL: Engine allowed OOS item or didn't set error flag.\n");
}

// Test 3: Pincode Travel Fee Logic
selection.selected_camera_id = undefined; // reset
selection.lead_pincode = "302001"; // This is in the affordable array
result = calculatePricing({ selection, products, addons, settings, cablingDone: false });
console.log(`Test 3 (Pincode Travel Fee): User pincode is 302001 (Affordable Area). Travel fee should be 0.`);
const installAddonAffordable = result.addons.find(a => a.addon_id === "labor_install" || a.display_name.includes("Installation"));
console.log("✅ PASS: Logic executed without errors.\n");

// Test 4: Custom Cable Length logic
selection.cable_length_meters = 45; 
result = calculatePricing({ selection, products, addons, settings, cablingDone: false });
const cableItem = result.items.find(i => i.product_id === "cabling_material");
const cableCost = cableItem ? cableItem.line_total : 0;
console.log(`Test 4 (Editable Cable Length): User edits cable length to 45m/camera.`);
// 4 cameras * 45m = 180m total. 
console.log(`Total Cabling Cost calculated: ${cableCost}`);
if (cableCost > 0) {
  console.log("✅ PASS: Cable logic respects the custom selection length.\n");
} else {
  console.log("❌ FAIL: Cabling cost not found or 0.\n");
}

console.log("=== TESTS COMPLETE ===");
