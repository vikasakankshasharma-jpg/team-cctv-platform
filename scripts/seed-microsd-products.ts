/**
 * @file scripts/seed-microsd-products.ts
 * @description Seeds genuine surveillance-grade MicroSD cards and popular Wi-Fi cameras
 *              into the Firestore `products` collection for the Wireless CCTV Engine.
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getDb() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    });
  }
  return {
    db: admin.firestore(),
    ts: admin.firestore.FieldValue.serverTimestamp(),
  };
}

const WIRELESS_PRODUCTS: Record<string, any> = {
  // ── High-Endurance Surveillance MicroSD Cards ─────────────────────────────
  "SD-SANDISK-32GB-HE": {
    display_name: "SanDisk High Endurance 32GB MicroSD Card",
    technical_name: "SDSQQNR-032G-GN6IA",
    brand: "SanDisk",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 32,
    capacity: "32GB",
    base_cost: 380,
    margin_percentage: 20,
    unit_price: 475,
    unit_price_budget: 450,
    unit_price_premium: 520,
    is_active: true,
    is_high_endurance: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    description: "Surveillance-grade High Endurance MicroSD card rated for continuous CCTV loop overwrite.",
  },
  "SD-SANDISK-64GB-HE": {
    display_name: "SanDisk High Endurance 64GB MicroSD Card",
    technical_name: "SDSQQNR-064G-GN6IA",
    brand: "SanDisk",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 64,
    capacity: "64GB",
    base_cost: 520,
    margin_percentage: 20,
    unit_price: 650,
    unit_price_budget: 620,
    unit_price_premium: 720,
    is_active: true,
    is_high_endurance: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    description: "Surveillance-grade High Endurance MicroSD card rated for 5,000+ hours continuous recording.",
  },
  "SD-SANDISK-128GB-HE": {
    display_name: "SanDisk High Endurance 128GB MicroSD Card",
    technical_name: "SDSQQNR-128G-GN6IA",
    brand: "SanDisk",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 128,
    capacity: "128GB",
    base_cost: 920,
    margin_percentage: 20,
    unit_price: 1150,
    unit_price_budget: 1090,
    unit_price_premium: 1250,
    is_active: true,
    is_high_endurance: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    description: "Surveillance-grade High Endurance MicroSD card rated for 10,000+ hours continuous recording.",
  },
  "SD-SANDISK-256GB-HE": {
    display_name: "SanDisk High Endurance 256GB MicroSD Card",
    technical_name: "SDSQQNR-256G-GN6IA",
    brand: "SanDisk",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 256,
    capacity: "256GB",
    base_cost: 1680,
    margin_percentage: 20,
    unit_price: 2100,
    unit_price_budget: 1990,
    unit_price_premium: 2290,
    is_active: true,
    is_high_endurance: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    description: "Surveillance-grade High Endurance MicroSD card rated for 20,000+ hours continuous recording.",
  },
  "SD-WD-PURPLE-128GB": {
    display_name: "WD Purple 128GB Surveillance MicroSD Card",
    technical_name: "WDD128G1P0A",
    brand: "WD",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 128,
    capacity: "128GB",
    base_cost: 980,
    margin_percentage: 20,
    unit_price: 1225,
    unit_price_budget: 1150,
    unit_price_premium: 1350,
    is_active: true,
    is_high_endurance: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    description: "Western Digital Purple surveillance-optimized microSD card with health status monitor.",
  },

  // ── Authentic Wi-Fi Cameras (The 6 Fast-Selling Pillars) ───────────────────
  "CAM-WIFI-TAPO-C210": {
    display_name: "TP-Link Tapo C210 3MP Indoor 360° Pan/Tilt Wi-Fi Camera",
    technical_name: "TAPO-C210",
    brand: "TP-Link",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "indoor_ptz",
    form_factor: "ptz",
    resolution_mp: 3,
    resolution_tier: "very_clear",
    night_vision_type: "ir",
    night_vision_range_m: 10,
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    is_360: true,
    is_pt: true,
    base_cost: 1750,
    margin_percentage: 20,
    unit_price: 2190,
    unit_price_budget: 2090,
    unit_price_premium: 2390,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
  "CAM-WIFI-IMOU-RANGER2": {
    display_name: "Imou Ranger 2 4MP Indoor 360° AI Human Tracking Wi-Fi Camera",
    technical_name: "IPC-A42P-D",
    brand: "Imou",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "indoor_ptz",
    form_factor: "ptz",
    resolution_mp: 4,
    resolution_tier: "very_clear",
    night_vision_type: "ir",
    night_vision_range_m: 10,
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    is_360: true,
    is_pt: true,
    base_cost: 1850,
    margin_percentage: 20,
    unit_price: 2315,
    unit_price_budget: 2190,
    unit_price_premium: 2490,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
  "CAM-WIFI-TAPO-C320WS": {
    display_name: "TP-Link Tapo C320WS 4MP Outdoor Weatherproof 2K Wi-Fi Bullet Camera",
    technical_name: "TAPO-C320WS",
    brand: "TP-Link",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "outdoor_bullet",
    form_factor: "bullet",
    ip_rating: "IP66",
    resolution_mp: 4,
    resolution_tier: "crystal_clear",
    night_vision_type: "color",
    night_vision_range_m: 30,
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    base_cost: 2600,
    margin_percentage: 20,
    unit_price: 3250,
    unit_price_budget: 3090,
    unit_price_premium: 3490,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
  "CAM-WIFI-IMOU-CRUISER2": {
    display_name: "Imou Cruiser 2 5MP Outdoor 360° Pan & Tilt Color Night Wi-Fi Camera",
    technical_name: "IPC-GS7EP-5M0WE",
    brand: "Imou",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "outdoor_ptz",
    form_factor: "ptz",
    ip_rating: "IP66",
    resolution_mp: 5,
    resolution_tier: "crystal_clear",
    night_vision_type: "color",
    night_vision_range_m: 30,
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    is_360: true,
    is_pt: true,
    base_cost: 3200,
    margin_percentage: 20,
    unit_price: 3990,
    unit_price_budget: 3790,
    unit_price_premium: 4290,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
  "CAM-WIFI-EZVIZ-CB3": {
    display_name: "Ezviz CB3 Wire-Free 1080p Battery Wi-Fi Camera (Solar Ready)",
    technical_name: "CS-CB3-R100-2B2WFL",
    brand: "Ezviz",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "wire_free_battery",
    form_factor: "bullet",
    ip_rating: "IP65",
    resolution_mp: 2,
    resolution_tier: "good",
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    is_solar: true,
    base_cost: 4400,
    margin_percentage: 20,
    unit_price: 5490,
    unit_price_budget: 5290,
    unit_price_premium: 5890,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
  "CAM-WIFI-IMOU-DUAL": {
    display_name: "Imou Cruiser Dual 6MP (3MP Fixed + 3MP PTZ) Dual-Lens Wi-Fi Camera",
    technical_name: "IPC-S7XP-6M0WED",
    brand: "Imou",
    category: "cctv_camera",
    technology: "Wireless",
    technologies: ["Wireless"],
    camera_subtype: "dual_lens",
    form_factor: "ptz",
    ip_rating: "IP66",
    resolution_mp: 6,
    resolution_tier: "crystal_clear",
    night_vision_type: "color",
    night_vision_range_m: 30,
    has_audio: true,
    has_sd_slot: true,
    has_wifi: true,
    is_360: true,
    is_pt: true,
    is_dual_lens: true,
    base_cost: 3500,
    margin_percentage: 20,
    unit_price: 4375,
    unit_price_budget: 4190,
    unit_price_premium: 4690,
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
  },
};

async function seedWirelessProducts() {
  console.log("🚀 Starting Wireless CCTV Products & MicroSD Seeding...");
  const { db, ts } = getDb();

  const batch = db.batch();
  let count = 0;

  for (const [id, productData] of Object.entries(WIRELESS_PRODUCTS)) {
    const ref = db.collection("products").doc(id);
    const isCamera = productData.category === "cctv_camera";
    const catPath = isCamera ? "cctv_camera/wifi/WiFi Camera" : "storage/microsd/MicroSD Card";
    batch.set(
      ref,
      {
        ...productData,
        id,
        sku: id,
        internal_sku: id,
        catalog_path: catPath,
        group_path: catPath,
        is_quotation_eligible: true,
        stock_status: "in_stock",
        created_at: ts,
        updated_at: ts,
      },
      { merge: true }
    );
    count++;
    console.log(`   ✓ [${id}] ${productData.display_name}`);
  }

  await batch.commit();

  console.log(`\n✅ Seeding complete! Successfully added ${count} items to Firestore products collection.`);
  process.exit(0);
}

if (require.main === module) {
  seedWirelessProducts().catch((err) => {
    console.error("❌ Wireless products seed failed:", err);
    process.exit(1);
  });
}
