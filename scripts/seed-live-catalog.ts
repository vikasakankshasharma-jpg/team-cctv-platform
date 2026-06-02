/**
 * @file scripts/seed-live-catalog.ts
 * @description Seeds Firestore with REAL product catalog from TEAM quotation sheets.
 *              Covers HD (3 options) and IP (5 options) for 4/8/16 camera setups.
 *
 * RUN: npx ts-node -r tsconfig-paths/register --project tsconfig.json scripts/seed-live-catalog.ts
 *
 * IMPORTANT: This script CLEARS existing products, addons, settings, addon_rules,
 *            recommendation_rules, leads collections before seeding.
 */

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as path from "path";
import * as fs from "fs";

// ─── Firebase Init ────────────────────────────────────────────────────────────
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found at:", envPath);
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, "utf8");
const env: Record<string, string> = {};
envFile.split("\n").forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.replace(/\\n/g, "\n");
  }
});

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: env["FIREBASE_PROJECT_ID"],
      clientEmail: env["FIREBASE_CLIENT_EMAIL"],
      privateKey: env["FIREBASE_PRIVATE_KEY"],
    })
  });
}
const db = getFirestore();

// ─── Helper ───────────────────────────────────────────────────────────────────
async function clearCollection(colName: string) {
  const snap = await db.collection(colName).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  🗑️  Cleared ${snap.size} docs from [${colName}]`);
}

async function seedCollection(colName: string, docs: Record<string, any>[]) {
  const batch = db.batch();
  docs.forEach((doc) => {
    const { id, ...data } = doc;
    const ref = id ? db.collection(colName).doc(id) : db.collection(colName).doc();
    batch.set(ref, { ...data, created_at: new Date() });
  });
  await batch.commit();
  console.log(`  ✅  Seeded ${docs.length} docs into [${colName}]`);
}

// ─── REAL PRODUCT CATALOG ─────────────────────────────────────────────────────
// NOTE: gst_rate = 0 because quoted prices are FINAL (GST-inclusive)
// daily_gb_per_camera = 17 so HDD auto-select matches quotation defaults:
//   4 cams × 17 GB × 7 days = 476 GB → picks 500GB ✓
//   8 cams × 17 GB × 7 days = 952 GB → picks 1TB  ✓
//  16 cams × 17 GB × 7 days = 1904 GB → picks 3TB  ✓ (no 2TB in stock)

const DAILY_GB = 17;

const products = [

  // ══════════════════════════════════════════════════════════════
  // HD CAMERAS  (catalog_path drives DVR compatibility)
  // ══════════════════════════════════════════════════════════════

  // Option-1: Budget Brand 2MP (IR Night)
  {
    id: "cam_hd_opt1",
    technical_name: "cam_hd_opt1",
    display_name: "Budget Brand 2MP (IR Night)",
    category: "camera",
    technology: "HD",
    unit_price: 975,
    resolution_tier: "good",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/HD/2MP",
    brand: "Budget",
    is_active: true,
    is_deleted: false,
  },

  // Option-2: CP Plus 2.4MP Color in Night
  {
    id: "cam_hd_opt2",
    technical_name: "cam_hd_opt2_color",
    display_name: "CP Plus 2.4MP Color in Night",
    category: "camera",
    technology: "HD",
    unit_price: 1495,
    resolution_tier: "very_clear",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/HD/2MP",
    brand: "CP Plus",
    is_active: true,
    is_deleted: false,
  },

  // Option-3: CP Plus 5MP Color in Night
  {
    id: "cam_hd_opt3",
    technical_name: "cam_hd_opt3_5mp_color",
    display_name: "CP Plus 5MP Color in Night",
    category: "camera",
    technology: "HD",
    unit_price: 2185,
    resolution_tier: "crystal_clear",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/HD/5MP",
    brand: "CP Plus",
    is_active: true,
    is_deleted: false,
  },

  // ── HD DVRs (2MP-compatible: opts 1 & 2) ──────────────────────
  {
    id: "dvr_hd_4ch_2mp",
    technical_name: "dvr_hd_4ch_2mp",
    display_name: "CP Plus DVR 4CH (2MP)",
    category: "recorder",
    technology: "HD",
    unit_price: 2990,
    channels: 4,
    max_cameras: 4,
    catalog_path: "CCTV/Recorders/DVR/2MP",
    compatible_paths: ["CCTV/Cameras/HD/2MP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "dvr_hd_8ch_2mp",
    technical_name: "dvr_hd_8ch_2mp",
    display_name: "CP Plus DVR 8CH (2MP)",
    category: "recorder",
    technology: "HD",
    unit_price: 4140,
    channels: 8,
    max_cameras: 8,
    catalog_path: "CCTV/Recorders/DVR/2MP",
    compatible_paths: ["CCTV/Cameras/HD/2MP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "dvr_hd_16ch_2mp",
    technical_name: "dvr_hd_16ch_2mp",
    display_name: "CP Plus DVR 16CH (2MP)",
    category: "recorder",
    technology: "HD",
    unit_price: 7245,
    channels: 16,
    max_cameras: 16,
    catalog_path: "CCTV/Recorders/DVR/2MP",
    compatible_paths: ["CCTV/Cameras/HD/2MP"],
    is_active: true,
    is_deleted: false,
  },

  // ── HD DVRs (5MP-compatible: opt 3) ────────────────────────────
  {
    id: "dvr_hd_4ch_5mp",
    technical_name: "dvr_hd_4ch_5mp",
    display_name: "CP Plus DVR 4CH (5MP)",
    category: "recorder",
    unit_price: 4197,
    channels: 4,
    max_cameras: 4,
    catalog_path: "CCTV/Recorders/DVR/5MP",
    compatible_paths: ["CCTV/Cameras/HD/5MP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "dvr_hd_8ch_5mp",
    technical_name: "dvr_hd_8ch_5mp",
    display_name: "CP Plus DVR 8CH (5MP)",
    category: "recorder",
    technology: "HD",
    unit_price: 5980,
    channels: 8,
    max_cameras: 8,
    catalog_path: "CCTV/Recorders/DVR/5MP",
    compatible_paths: ["CCTV/Cameras/HD/5MP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "dvr_hd_16ch_5mp",
    technical_name: "dvr_hd_16ch_5mp",
    display_name: "CP Plus DVR 16CH (5MP)",
    category: "recorder",
    technology: "HD",
    unit_price: 20700,
    channels: 16,
    max_cameras: 16,
    catalog_path: "CCTV/Recorders/DVR/5MP",
    compatible_paths: ["CCTV/Cameras/HD/5MP"],
    is_active: true,
    is_deleted: false,
  },

  // ── HD Power Supply 8CH (stacks for 9–16 cameras) ─────────────
  {
    id: "psu_hd_8ch",
    technical_name: "psu_hd_8ch",
    display_name: "Power Supply (8CH)",
    category: "power_device",
    technology: "HD",
    unit_price: 1260,
    max_cameras: 8,
    catalog_path: "CCTV/Accessories/PSU/HD",
    compatible_paths: ["CCTV/Cameras/HD"],
    is_active: true,
    is_deleted: false,
  },

  // ── HD HDDs ────────────────────────────────────────────────────
  {
    id: "hdd_500gb_hd",
    technical_name: "hdd_500gb",
    display_name: "HDD 500GB (approx 4-7 days recording)",
    category: "storage",
    unit_price: 2153,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_1tb_hd",
    technical_name: "hdd_1tb",
    display_name: "HDD 1TB",
    category: "storage",
    technology: "HD",
    unit_price: 5555,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_3tb_hd",
    technical_name: "hdd_3tb",
    display_name: "HDD 3TB",
    category: "storage",
    technology: "HD",
    unit_price: 8580,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_4tb_hd",
    technical_name: "hdd_4tb",
    display_name: "HDD 4TB",
    category: "storage",
    technology: "HD",
    unit_price: 11550,
    is_active: true,
    is_deleted: false,
  },

  // ══════════════════════════════════════════════════════════════
  // IP CAMERAS  (5 options, NVR + PoE switch)
  // ══════════════════════════════════════════════════════════════

  // Option-1: Budget Brand 2MP (Color Night & Mic)
  {
    id: "cam_ip_opt1",
    technical_name: "cam_ip_opt1_color",
    display_name: "Budget Brand 2MP (Color Night & Mic)",
    category: "camera",
    technology: "IP",
    unit_price: 1300,
    resolution_tier: "good",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/IP/2MP",
    brand: "Budget",
    is_active: true,
    is_deleted: false,
  },

  // Option-2: Budget Brand 4MP (Color Night & Mic)
  {
    id: "cam_ip_opt2",
    technical_name: "cam_ip_opt2_4mp_color",
    display_name: "Budget Brand 4MP (Color Night & Mic)",
    category: "camera",
    technology: "IP",
    unit_price: 2275,
    resolution_tier: "very_clear",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/IP/4MP",
    brand: "Budget",
    is_active: true,
    is_deleted: false,
  },

  // Option-3: CP Plus 2MP Black & White in Night
  {
    id: "cam_ip_opt3",
    technical_name: "cam_ip_opt3_2mp",
    display_name: "CP Plus 2MP Black & White in Night",
    category: "camera",
    technology: "IP",
    unit_price: 2695,
    bulk_discount_threshold: 16,
    bulk_unit_price: 2585,
    resolution_tier: "good",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/IP/2MP",
    brand: "CP Plus",
    is_active: true,
    is_deleted: false,
  },

  // Option-4: CP Plus 2MP Color in Night
  {
    id: "cam_ip_opt4",
    technical_name: "cam_ip_opt4_2mp_color",
    display_name: "CP Plus 2MP Color in Night",
    category: "camera",
    technology: "IP",
    unit_price: 3025,
    bulk_discount_threshold: 16,
    bulk_unit_price: 2915,
    resolution_tier: "very_clear",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/IP/2MP",
    brand: "CP Plus",
    is_active: true,
    is_deleted: false,
  },

  // Option-5: CP Plus 4MP Color in Night
  {
    id: "cam_ip_opt5",
    technical_name: "cam_ip_opt5_4mp_color",
    display_name: "CP Plus 4MP Color in Night",
    category: "camera",
    technology: "IP",
    unit_price: 4015,
    bulk_discount_threshold: 16,
    bulk_unit_price: 3905,
    resolution_tier: "crystal_clear",
    daily_gb_per_camera: DAILY_GB,
    catalog_path: "CCTV/Cameras/IP/4MP",
    brand: "CP Plus",
    is_active: true,
    is_deleted: false,
  },

  // ── IP NVRs (CP Plus) ──────────────────────────────────────────
  {
    id: "nvr_ip_4ch",
    technical_name: "nvr_ip_4ch",
    display_name: "NVR CP Plus (4 Camera)",
    category: "recorder",
    technology: "IP",
    unit_price: 4140,
    channels: 4,
    max_cameras: 4,
    catalog_path: "CCTV/Recorders/NVR",
    compatible_paths: ["CCTV/Cameras/IP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "nvr_ip_8ch",
    technical_name: "nvr_ip_8ch",
    display_name: "NVR CP Plus (8 Camera)",
    category: "recorder",
    technology: "IP",
    unit_price: 4860,
    channels: 8,
    max_cameras: 8,
    catalog_path: "CCTV/Recorders/NVR",
    compatible_paths: ["CCTV/Cameras/IP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "nvr_ip_16ch",
    technical_name: "nvr_ip_16ch",
    display_name: "NVR CP Plus (16 Camera)",
    category: "recorder",
    technology: "IP",
    unit_price: 8160,
    channels: 16,
    max_cameras: 16,
    catalog_path: "CCTV/Recorders/NVR",
    compatible_paths: ["CCTV/Cameras/IP"],
    is_active: true,
    is_deleted: false,
  },

  // ── IP PoE Switches ────────────────────────────────────────────
  // 16-cam uses 2× 8CH switch (pricing engine stacks qty automatically)
  {
    id: "poe_ip_4ch",
    technical_name: "poe_ip_4ch",
    display_name: "PoE Switch (4CH)",
    category: "power_device",
    technology: "IP",
    unit_price: 1207,
    max_cameras: 4,
    catalog_path: "CCTV/Accessories/PoE",
    compatible_paths: ["CCTV/Cameras/IP"],
    is_active: true,
    is_deleted: false,
  },
  {
    id: "poe_ip_8ch",
    technical_name: "poe_ip_8ch",
    display_name: "PoE Switch (8CH)",
    category: "power_device",
    technology: "IP",
    unit_price: 1552,
    max_cameras: 8,
    catalog_path: "CCTV/Accessories/PoE",
    compatible_paths: ["CCTV/Cameras/IP"],
    is_active: true,
    is_deleted: false,
  },

  // ── IP HDDs ────────────────────────────────────────────────────
  {
    id: "hdd_500gb_ip",
    technical_name: "hdd_500gb",
    display_name: "HDD 500GB (approx 7-10 days recording)",
    category: "storage",
    technology: "IP",
    unit_price: 2153,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_1tb_ip",
    technical_name: "hdd_1tb",
    display_name: "HDD 1TB",
    category: "storage",
    technology: "IP",
    unit_price: 5303,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_3tb_ip",
    technical_name: "hdd_3tb",
    display_name: "HDD 3TB",
    category: "storage",
    technology: "IP",
    unit_price: 8190,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_4tb_ip",
    technical_name: "hdd_4tb",
    display_name: "HDD 4TB",
    category: "storage",
    technology: "IP",
    unit_price: 11025,
    is_active: true,
    is_deleted: false,
  },
  {
    id: "hdd_6tb_ip",
    technical_name: "hdd_6tb",
    display_name: "HDD 6TB",
    category: "storage",
    technology: "IP",
    unit_price: 15540,
    is_active: true,
    is_deleted: false,
  },
];

// ─── ADDONS ──────────────────────────────────────────────────────────────────
// Optional items shown at the bottom of quotation sheets
const addons = [
  // HD optional add-ons
  {
    id: "addon_cable_cc_hd",
    display_name: "Cable per Mtr (Copper Coated) – HD",
    price: 12,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_cable_pc_hd",
    display_name: "Cable per Mtr (Pure Copper) – HD",
    price: 35,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  // IP optional add-ons
  {
    id: "addon_cable_cc_ip",
    display_name: "Cable per Mtr (Copper Coated) – IP",
    price: 40,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_cable_pc_ip",
    display_name: "Cable per Mtr (Pure Copper) – IP",
    price: 38,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  // Common
  {
    id: "addon_rack_2u",
    display_name: "Rack (2U)",
    price: 500,  // HD price; IP is 480 – use avg
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_pvc_box",
    display_name: "PVC Box 5x5 (per unit)",
    price: 42,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_poe_cover",
    display_name: "PoE Switch PVC Box Cover",
    price: 480,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_monitor",
    display_name: "32-inch LED Monitor",
    price: 12500,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_ups",
    display_name: "Power Backup (UPS for DVR/Router)",
    price: 2500,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
  {
    id: "addon_4g",
    display_name: "4G Cellular Router (SIM slot)",
    price: 3200,
    unit_multiplier: "none",
    is_active: true,
    is_deleted: false,
  },
];

// ─── APP SETTINGS ─────────────────────────────────────────────────────────────
// GST rate = 0: quoted prices are FINAL (all-inclusive)
// labor_hd_per_camera = 400 (BNC/DC/Clip installation per camera)
// labor_ip_per_camera = 500 (RJ45/Clip installation per camera)
const settings = {
  company_name: "TEAM CCTV",
  company_logo_url: null,
  gst_rate: 0,

  labor_hd_per_camera: 400,
  labor_ip_per_camera: 500,

  cable_copper_coated_hd: 12,
  cable_pure_copper_hd: 35,
  cable_copper_coated_ip: 40,
  cable_pure_copper_ip: 38,
  cable_overage_per_mtr: 12,

  visit_charge: 300,
  amc_1yr_pct: 5,
  amc_2yr_pct: 8,
  amc_3yr_pct: 10,
  quote_validity_days: 7,
  max_supported_cameras: 16,

  // Legacy fields (kept for compatibility)
  labor_fitting_only_rate: 400,
  labor_full_installation_rate: 500,
  wire_cost_per_meter: 12,
  cable_copper_coated: 12,
  cable_pure_copper: 35,

  tier_budget_label: "Essential",
  tier_budget_multiplier: 1.0,
  tier_recommended_label: "Professional",
  tier_recommended_multiplier: 1.0,
  tier_premium_label: "Premium",
  tier_premium_multiplier: 1.0,

  pricing_cache_ttl_seconds: 300,
  otp_provider: "firebase_phone",
  whatsapp_template:
    "Hi {{customer_name}}, your TEAM CCTV quotation is ready. Starting from ₹{{total_amount}}. Reply to know more.",

  admin_notification_phone: "+919772699395",
};

// ─── RECOMMENDATION RULES ─────────────────────────────────────────────────────
// HD: recommend opt2 (CP Plus 2.4MP Color) for small setups
// IP: recommend opt4 (CP Plus 2MP Color) as best value
const recommendationRules = [
  {
    id: "rec_hd_default",
    priority: 10,
    is_active: true,
    conditions: { technology: "HD" },
    recommendation: {
      camera_option: 2,
      label: "Best Value",
      reason: "CP Plus 2.4MP Color Night gives colour footage at a great price",
      is_featured: true,
    },
  },
  {
    id: "rec_ip_default",
    priority: 10,
    is_active: true,
    conditions: { technology: "IP" },
    recommendation: {
      camera_option: 4,
      label: "Best Value",
      reason: "CP Plus 2MP Color in Night — smart IP with colour footage",
      is_featured: true,
    },
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🚀 TEAM CCTV — Live Catalog Seed\n");

  console.log("Step 1: Clearing old collections...");
  await clearCollection("products");
  await clearCollection("addons");
  await clearCollection("addon_rules");
  await clearCollection("recommendation_rules");
  await clearCollection("leads");

  console.log("\nStep 2: Seeding real catalog...");
  await seedCollection("products", products);
  await seedCollection("addons", addons);
  await seedCollection("recommendation_rules", recommendationRules);

  console.log("\nStep 3: Writing AppSettings...");
  await db.collection("settings").doc("app_config").set({
    ...settings,
    updated_at: new Date(),
  });
  console.log("  ✅  Settings written");

  console.log("\n✅ Seed complete!");
  console.log(`   HD cameras: 3 options (Budget 2MP, CP Plus 2.4MP Color, CP Plus 5MP Color)`);
  console.log(`   IP cameras: 5 options (Budget 2MP, Budget 4MP, CP Plus 2MP B&W, CP Plus 2MP Color, CP Plus 4MP Color)`);
  console.log(`   All prices are FINAL (GST inclusive), gst_rate = 0`);
  console.log(`\n   Verify at: http://localhost:3000/quote/mock-lead\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

