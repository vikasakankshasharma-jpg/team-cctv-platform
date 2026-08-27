import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

import { adminDb } from "../lib/firebase-admin";

/**
 * 1. WATERFALL MARGIN RULES
 */
const MARGIN_RULES = {
  GLOBAL_DEFAULT: 20,
  
  // By Category
  CATEGORY: {
    storage: 10,
    accessories: 30,
    cable: 25
  },
  
  // By Brand
  BRAND: {
    "Budget Brand": 40,
    "CP Plus": 20,
    "Seagate": 10,
    "D-Link": 15
  },
  
  // By Specific Item (Product ID or SKU)
  // e.g. "ITEM_CP_PLUS_8MP_DOME": 15
  ITEM: {} as Record<string, number>
};

/**
 * Helper to calculate margin based on the Waterfall Logic
 * Item -> Brand -> Category -> Global Default
 */
function calculateMargin(item: any): number {
  if (MARGIN_RULES.ITEM[item.sku]) {
    return MARGIN_RULES.ITEM[item.sku];
  }
  if (item.brand && MARGIN_RULES.BRAND[item.brand as keyof typeof MARGIN_RULES.BRAND] !== undefined) {
    return MARGIN_RULES.BRAND[item.brand as keyof typeof MARGIN_RULES.BRAND];
  }
  if (MARGIN_RULES.CATEGORY[item.category as keyof typeof MARGIN_RULES.CATEGORY] !== undefined) {
    return MARGIN_RULES.CATEGORY[item.category as keyof typeof MARGIN_RULES.CATEGORY];
  }
  return MARGIN_RULES.GLOBAL_DEFAULT;
}

/**
 * Helper to compute Selling Price
 */
function applyMargin(item: any): any {
  const marginPercent = calculateMargin(item);
  const sellingPrice = Math.round(item.base_cost * (1 + marginPercent / 100));
  return {
    ...item,
    margin_percent_applied: marginPercent,
    unit_price: sellingPrice
  };
}

/**
 * 2. RAW PRODUCTS FROM EXCEL (GST Paid Cost)
 */
const RAW_PRODUCTS = [
  // --- HD Analog Cameras ---
  { sku: "HDA-CPP-2MP-BW-DOME", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Dome", feature: "B&W Night Vision, Audio IN", base_cost: 1000 },
  { sku: "HDA-CPP-2MP-BW-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Bullet", feature: "B&W Night Vision, Audio IN", base_cost: 1050 },
  { sku: "HDA-CPP-2MP-COL-DOME", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Dome", feature: "Color Night Vision, Audio IN", base_cost: 1250 },
  { sku: "HDA-CPP-2MP-COL-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Bullet", feature: "Color Night Vision, Audio IN", base_cost: 1300 },
  { sku: "HDA-CPP-5MP-COL-DOME", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "5MP", type: "Dome", feature: "Color Night Vision, Audio IN", base_cost: 1600 },
  { sku: "HDA-CPP-5MP-COL-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "HD", resolution: "5MP", type: "Bullet", feature: "Color Night Vision, Audio IN", base_cost: 1650 },
  { sku: "HDA-BUD-2MP-COL-DOME", brand: "Budget Brand", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Dome", feature: "Color Night Vision, Audio IN", base_cost: 700 },
  { sku: "HDA-BUD-2MP-COL-BULLET", brand: "Budget Brand", category: "cctv_camera", technology: "HD", resolution: "2MP", type: "Bullet", feature: "Color Night Vision, Audio IN", base_cost: 750 },

  // --- IP Network Cameras ---
  { sku: "IP-CPP-2MP-ECO-DOME", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "2MP", type: "Dome", feature: "Color Night Vision, Audio IN, ECO", base_cost: 3200 },
  { sku: "IP-CPP-2MP-ECO-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "2MP", type: "Bullet", feature: "Color Night Vision, Audio IN, ECO", base_cost: 3250 },
  { sku: "IP-CPP-4MP-NORM-DOME", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "4MP", type: "Dome", feature: "Color Night Vision, Audio IN", base_cost: 4000 },
  { sku: "IP-CPP-4MP-NORM-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "4MP", type: "Bullet", feature: "Color Night Vision, Audio IN", base_cost: 4050 },
  { sku: "IP-CPP-6MP-NORM-DOME", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "6MP", type: "Dome", feature: "Color Night Vision, Audio IN", base_cost: 5200 },
  { sku: "IP-CPP-6MP-NORM-BULLET", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "6MP", type: "Bullet", feature: "Color Night Vision, Audio IN", base_cost: 5250 },
  { sku: "IP-CPP-8MP-PREM-DOME", brand: "CP Plus", category: "cctv_camera", technology: "IP", resolution: "8MP", type: "Dome", feature: "Color Night Vision, Audio IN, Premium", base_cost: 7500 },
  { sku: "IP-BUD-5MP-ECO-DOME", brand: "Budget Brand", category: "cctv_camera", technology: "IP", resolution: "5MP", type: "Dome", feature: "Color Night Vision, Audio IN, ECO", base_cost: 1400 },
  { sku: "IP-BUD-5MP-ECO-BULLET", brand: "Budget Brand", category: "cctv_camera", technology: "IP", resolution: "5MP", type: "Bullet", feature: "Color Night Vision, Audio IN, ECO", base_cost: 1450 },
  { sku: "IP-BUD-5MP-PREM-DOME", brand: "Budget Brand", category: "cctv_camera", technology: "IP", resolution: "5MP", type: "Dome", feature: "Color Night Vision, Audio IN, Premium", base_cost: 2000 },
  { sku: "IP-BUD-5MP-PREM-BULLET", brand: "Budget Brand", category: "cctv_camera", technology: "IP", resolution: "5MP", type: "Bullet", feature: "Color Night Vision, Audio IN, Premium", base_cost: 2050 },

  // --- HD DVRs ---
  { sku: "DVR-CPP-4CH-2MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 4, resolution: "2MP Supported", sata: "1SATA", base_cost: 3700 },
  { sku: "DVR-CPP-8CH-2MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 8, resolution: "2MP Supported", sata: "1SATA", base_cost: 4800 },
  { sku: "DVR-CPP-16CH-2MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 16, resolution: "2MP Supported", sata: "1SATA", base_cost: 8100 },
  { sku: "DVR-CPP-4CH-5MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 4, resolution: "5MP Supported", sata: "1SATA", base_cost: 5750 },
  { sku: "DVR-CPP-8CH-5MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 8, resolution: "5MP Supported", sata: "1SATA", base_cost: 8100 },
  { sku: "DVR-CPP-16CH-5MP", brand: "CP Plus", category: "recorder", technology: "HD", channels: 16, resolution: "5MP Supported", sata: "1SATA", base_cost: 13300 },

  // --- IP NVRs ---
  { sku: "NVR-CPP-4CH", brand: "CP Plus", category: "recorder", technology: "IP", channels: 4, sata: "1SATA", base_cost: 4900 },
  { sku: "NVR-CPP-8CH", brand: "CP Plus", category: "recorder", technology: "IP", channels: 8, sata: "1SATA", base_cost: 5500 },
  { sku: "NVR-CPP-16CH", brand: "CP Plus", category: "recorder", technology: "IP", channels: 16, sata: "1SATA", base_cost: 8300 },
  { sku: "NVR-CPP-32CH", brand: "CP Plus", category: "recorder", technology: "IP", channels: 32, sata: "2SATA", base_cost: 15000 },

  // --- Storage ---
  { sku: "HDD-BUD-500GB", brand: "Budget Brand", category: "storage", capacity: "500GB", base_cost: 1800 },
  { sku: "HDD-BUD-1TB", brand: "Budget Brand", category: "storage", capacity: "1TB", base_cost: 4700 },
  { sku: "HDD-BUD-2TB", brand: "Budget Brand", category: "storage", capacity: "2TB", base_cost: 7800 },
  { sku: "HDD-BUD-4TB", brand: "Budget Brand", category: "storage", capacity: "4TB", base_cost: 14500 },
  { sku: "HDD-SEA-1TB", brand: "Seagate", category: "storage", capacity: "1TB", base_cost: 9500 },
  { sku: "HDD-SEA-2TB", brand: "Seagate", category: "storage", capacity: "2TB", base_cost: 10900 },
  { sku: "HDD-SEA-4TB", brand: "Seagate", category: "storage", capacity: "4TB", base_cost: 18500 },

  // --- Cables (HD) ---
  { sku: "CAB-HD-CPP-90", brand: "CP Plus", category: "cable", description: "3+1 Cable HD - 90 MTR Copper", base_cost: 1350 },
  { sku: "CAB-HD-BUD-70", brand: "Budget Brand", category: "cable", description: "3+1 Cable HD - 70 MTR Copper Coated", base_cost: 600 },

  // --- Cables (IP / Network) ---
  { sku: "CAB-IP-CPP-305-CU", brand: "CP Plus", category: "network", description: "CAT6 - 305 MTR Copper", base_cost: 9500 },
  { sku: "CAB-IP-CPP-305-CCA", brand: "CP Plus", category: "network", description: "CAT6 - 305 MTR Copper Coated", base_cost: 3700 },
  { sku: "CAB-IP-BUD-100-CU", brand: "Budget Brand", category: "network", description: "CAT6 - 100 MTR Copper", base_cost: 1200 },
  { sku: "CAB-IP-BUD-305-CCA", brand: "Budget Brand", category: "network", description: "CAT6 - 305 MTR Copper Coated", base_cost: 3200 },

  // --- PoE Switches ---
  { sku: "POE-BUD-4CH", brand: "Budget Brand", category: "network", description: "PoE Switch 4Ch", base_cost: 900 },
  { sku: "POE-BUD-8CH", brand: "Budget Brand", category: "network", description: "PoE Switch 8Ch", base_cost: 1200 },
  { sku: "POE-DLINK-16CH", brand: "D-Link", category: "network", description: "PoE Switch 16Ch", base_cost: 9500 },

  // --- Power Supply (SMPS) ---
  { sku: "SMPS-CPP-8CH", brand: "CP Plus", category: "power_device", description: "Power Supply SMPS 8Ch", base_cost: 600 },
  { sku: "SMPS-BUD-8CH", brand: "Budget Brand", category: "power_device", description: "Power Supply SMPS 8Ch", base_cost: 350 },

  // --- Connectors ---
  { sku: "CONN-BNC", brand: "Budget Brand", category: "connector", description: "BNC Connector", base_cost: 15 },
  { sku: "CONN-DC", brand: "Budget Brand", category: "connector", description: "DC Connector", base_cost: 5 },
  { sku: "CONN-RJ45", brand: "Budget Brand", category: "connector", description: "RJ45 Connector", base_cost: 5 },

  // --- HDMI Cables ---
  { sku: "HDMI-1.5M", brand: "Budget Brand", category: "hdmi_cable", description: "HDMI Cable 1.5 MTR", base_cost: 60 },
  { sku: "HDMI-3M", brand: "Budget Brand", category: "hdmi_cable", description: "HDMI Cable 3 MTR", base_cost: 120 },
  { sku: "HDMI-5M", brand: "Budget Brand", category: "hdmi_cable", description: "HDMI Cable 5 MTR", base_cost: 180 },
  { sku: "HDMI-10M", brand: "Budget Brand", category: "hdmi_cable", description: "HDMI Cable 10 MTR", base_cost: 300 },

  // --- Accessories & Displays ---
  { sku: "ACC-JUNCTION-BOX", brand: "Budget Brand", category: "accessories", description: "Junction Box for Camera", base_cost: 20 },
  { sku: "ACC-2U-RACK-RECORDER", brand: "Budget Brand", category: "rack", description: "2U Rack for Recorder", base_cost: 350 },
  { sku: "ACC-2U-RACK-POE", brand: "Budget Brand", category: "rack", description: "2U Rack for PoE Switch", base_cost: 450 },
  { sku: "ACC-4G-ROUTER", brand: "Budget Brand", category: "network", description: "4G Router", base_cost: 1450 },
  { sku: "DISP-19-INCH", brand: "Budget Brand", category: "display", description: "Display 19 inch", base_cost: 2100 },
];

async function seedDatabase() {
  console.log("🔥 Starting Live Catalog Seed Process...");
  
  // 1. Save Margin Rules to Firestore
  console.log("1️⃣ Saving Waterfall Margin Rules to Settings...");
  await adminDb.collection("settings").doc("margins").set(MARGIN_RULES);
  
  // 2. Wipe existing products
  console.log("2️⃣ Wiping old dummy products...");
  const oldProducts = await adminDb.collection("products").get();
  const batch1 = adminDb.batch();
  oldProducts.docs.forEach(doc => {
    batch1.delete(doc.ref);
  });
  await batch1.commit();
  console.log(`✅ Deleted ${oldProducts.size} old products.`);

  // 3. Process & Insert new products
  console.log("3️⃣ Calculating selling prices and inserting live products...");
  const batch2 = adminDb.batch();
  let count = 0;
  
  for (const raw of RAW_PRODUCTS) {
    const finalProduct = applyMargin(raw);
    
    // Create a display name for the UI
    let displayName = `${finalProduct.brand} `;
    if (finalProduct.category === "cctv_camera") {
        displayName += `${finalProduct.resolution} ${finalProduct.technology} ${finalProduct.type} (${finalProduct.feature})`;
    } else if (finalProduct.category === "recorder") {
        displayName += `${finalProduct.channels}Ch ${finalProduct.technology} DVR/NVR ${finalProduct.sata} ${finalProduct.resolution || ''}`;
    } else if (finalProduct.category === "storage") {
        displayName += `${finalProduct.capacity} Surveillance Hard Disk`;
    } else {
        displayName += finalProduct.description;
    }

    const docRef = adminDb.collection("products").doc(finalProduct.sku);
    batch2.set(docRef, {
      ...finalProduct,
      display_name: displayName.trim(),
      created_at: new Date().toISOString(),
      is_active: true,
      in_stock: true
    });
    count++;
  }
  
  await batch2.commit();
  console.log(`✅ Inserted ${count} verified live products with calculated margins.`);
  console.log("🎉 Seed complete!");
}

seedDatabase().catch(console.error);
