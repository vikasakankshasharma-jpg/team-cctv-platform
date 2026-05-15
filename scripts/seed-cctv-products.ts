/**
 * @file scripts/seed-cctv-products.ts
 * @description Seeds the Firestore `products` collection with CP Plus & Prama CCTV
 *              cameras, recorders (DVR/NVR), HDDs, PoE switches, and PSU adapters.
 *
 * Usage:
 *   npm run seed:products
 *
 * Safe to re-run — uses merge so existing docs are updated, not duplicated.
 * Prices are in INR (MRP). base_cost = approximate dealer cost.
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp();

// ─────────────────────────────────────────────
// Product Catalog
// ─────────────────────────────────────────────

type Category = "camera" | "recorder" | "accessory";
type Technology = "HD" | "IP" | "BOTH";

interface Product {
  display_name: string;
  technical_name: string;
  brand: string;
  category: Category;
  technology: Technology;
  unit_price: number;
  base_cost: number;
  is_active: boolean;
  resolution_mp?: number;
  channels?: number;
  max_cameras?: number;
  features?: string[];
  tags?: string[];
  description?: string;
  bulk_discount_threshold?: number;
  bulk_unit_price?: number;
}

const PRODUCTS: Record<string, Product> = {

  // ══════════════════════════════════════════════════════════════
  //  IP CAMERAS — CP Plus
  // ══════════════════════════════════════════════════════════════

  "cpip_2mp_bullet_basic": {
    display_name: "CP Plus 2MP IP Bullet Camera",
    technical_name: "CP-UNC-T21L3-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 2,
    unit_price: 1850,
    base_cost: 1400,
    is_active: true,
    features: ["night_vision"],
    tags: ["ip", "2mp", "bullet", "outdoor"],
    description: "Entry-level 2MP IP bullet camera with 30m IR night vision. Ideal for standard residential coverage.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 1750,
  },

  "cpip_2mp_dome_basic": {
    display_name: "CP Plus 2MP IP Dome Camera",
    technical_name: "CP-UNC-V21L3-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 2,
    unit_price: 1950,
    base_cost: 1480,
    is_active: true,
    features: ["night_vision"],
    tags: ["ip", "2mp", "dome", "indoor", "ceiling"],
    description: "2MP IP dome camera for indoor ceiling mounting.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 1850,
  },

  "cpip_4mp_colorvu_bullet": {
    display_name: "CP Plus 4MP ColorVu Bullet Camera",
    technical_name: "CP-UNC-T41L3C-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 4,
    unit_price: 3200,
    base_cost: 2450,
    is_active: true,
    features: ["color_night", "night_vision"],
    tags: ["ip", "4mp", "bullet", "outdoor", "color-night"],
    description: "4MP IP bullet with 24/7 full-color night vision using ColorVu technology. No IR — always in color.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 3050,
  },

  "cpip_5mp_colorvu_dome": {
    display_name: "CP Plus 5MP ColorVu Dome Camera",
    technical_name: "CP-UNC-V51L3C-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 5,
    unit_price: 3800,
    base_cost: 2900,
    is_active: true,
    features: ["color_night", "night_vision", "mic"],
    tags: ["ip", "5mp", "dome", "color-night", "audio"],
    description: "5MP ColorVu dome camera with built-in microphone. Best seller for offices and shops.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 3600,
  },

  "cpip_5mp_dual_light_bullet": {
    display_name: "CP Plus 5MP Dual Light Bullet (Smart Color)",
    technical_name: "CP-UNC-T51L3S-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 5,
    unit_price: 4100,
    base_cost: 3100,
    is_active: true,
    features: ["feat_dual_light", "color_night", "night_vision", "mic"],
    tags: ["ip", "5mp", "bullet", "dual-light", "smart"],
    description: "5MP smart dual-light camera: color on motion detection, IR otherwise. Most advanced CP Plus bullet.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 3900,
  },

  "cpip_8mp_4k_bullet": {
    display_name: "CP Plus 8MP 4K UHD IP Bullet Camera",
    technical_name: "CP-UNC-T81L3-MD",
    brand: "cpplus",
    category: "camera",
    technology: "IP",
    resolution_mp: 8,
    unit_price: 6500,
    base_cost: 5000,
    is_active: true,
    features: ["night_vision", "4k"],
    tags: ["ip", "8mp", "4k", "bullet", "outdoor", "enterprise"],
    description: "8MP 4K UHD IP bullet camera. Premium enterprise-grade for banks, factories, and large premises.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 6200,
  },

  // ══════════════════════════════════════════════════════════════
  //  IP CAMERAS — Prama (Hikvision Technology)
  // ══════════════════════════════════════════════════════════════

  "pramaip_2mp_dome": {
    display_name: "Prama 2MP IP Fixed Dome Camera",
    technical_name: "PRAMA-IPC-D120H-D",
    brand: "prama",
    category: "camera",
    technology: "IP",
    resolution_mp: 2,
    unit_price: 1900,
    base_cost: 1450,
    is_active: true,
    features: ["night_vision"],
    tags: ["ip", "2mp", "dome", "prama", "hikvision-tech"],
    description: "Prama 2MP IP dome camera powered by Hikvision technology. Good choice for budget IP installs.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 1800,
  },

  "pramaip_4mp_acupix_bullet": {
    display_name: "Prama 4MP AcuPix IP Bullet Camera",
    technical_name: "PRAMA-IPC-B140H-D",
    brand: "prama",
    category: "camera",
    technology: "IP",
    resolution_mp: 4,
    unit_price: 3100,
    base_cost: 2380,
    is_active: true,
    features: ["color_night", "night_vision"],
    tags: ["ip", "4mp", "bullet", "prama", "acupix"],
    description: "Prama 4MP AcuPix bullet camera with advanced image processing. Popular for commercial use.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 2950,
  },

  // ══════════════════════════════════════════════════════════════
  //  HD (ANALOG) CAMERAS — CP Plus
  // ══════════════════════════════════════════════════════════════

  "cphd_2mp_dome": {
    display_name: "CP Plus 2MP HD Dome Camera",
    technical_name: "CP-VAC-D21L2-V3",
    brand: "cpplus",
    category: "camera",
    technology: "HD",
    resolution_mp: 2,
    unit_price: 950,
    base_cost: 720,
    is_active: true,
    features: ["night_vision"],
    tags: ["hd", "analog", "2mp", "dome", "budget"],
    description: "CP Plus 2MP analog HD dome camera. Most affordable option for budget residential installs.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 900,
  },

  "cphd_2mp_bullet": {
    display_name: "CP Plus 2MP HD Bullet Camera (Outdoor)",
    technical_name: "CP-VAC-T21L2-V3",
    brand: "cpplus",
    category: "camera",
    technology: "HD",
    resolution_mp: 2,
    unit_price: 1050,
    base_cost: 800,
    is_active: true,
    features: ["night_vision"],
    tags: ["hd", "analog", "2mp", "bullet", "outdoor"],
    description: "CP Plus 2MP HD bullet camera with 40m IR. Outdoor-rated for boundary walls and parking.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 990,
  },

  "cphd_5mp_colorvu_bullet": {
    display_name: "CP Plus 5MP HD ColorVu Bullet Camera",
    technical_name: "CP-VAC-T51ML3S",
    brand: "cpplus",
    category: "camera",
    technology: "HD",
    resolution_mp: 5,
    unit_price: 2200,
    base_cost: 1680,
    is_active: true,
    features: ["color_night", "night_vision"],
    tags: ["hd", "analog", "5mp", "colorvu", "outdoor"],
    description: "CP Plus 5MP HD ColorVu bullet — 24/7 full color on analog DVR. Upgrade from standard black & white night vision.",
    bulk_discount_threshold: 4,
    bulk_unit_price: 2100,
  },

  // ══════════════════════════════════════════════════════════════
  //  NVR (IP Recorders) — CP Plus
  // ══════════════════════════════════════════════════════════════

  "cp_nvr_4ch": {
    display_name: "CP Plus 4-Channel NVR",
    technical_name: "CP-UNR-104X2-1P",
    brand: "cpplus",
    category: "recorder",
    technology: "IP",
    channels: 4,
    max_cameras: 4,
    unit_price: 3500,
    base_cost: 2700,
    is_active: true,
    tags: ["nvr", "ip", "4ch", "cp-plus"],
    description: "CP Plus 4-channel NVR with PoE. Supports up to 4 IP cameras with H.265+ compression.",
  },

  "cp_nvr_8ch": {
    display_name: "CP Plus 8-Channel NVR",
    technical_name: "CP-UNR-108X2-2P",
    brand: "cpplus",
    category: "recorder",
    technology: "IP",
    channels: 8,
    max_cameras: 8,
    unit_price: 5500,
    base_cost: 4200,
    is_active: true,
    tags: ["nvr", "ip", "8ch", "cp-plus"],
    description: "CP Plus 8-channel NVR. For 5-8 IP cameras.",
  },

  "cp_nvr_16ch": {
    display_name: "CP Plus 16-Channel NVR",
    technical_name: "CP-UNR-116X2-4P",
    brand: "cpplus",
    category: "recorder",
    technology: "IP",
    channels: 16,
    max_cameras: 16,
    unit_price: 9800,
    base_cost: 7500,
    is_active: true,
    tags: ["nvr", "ip", "16ch", "cp-plus"],
    description: "CP Plus 16-channel NVR. For 9-16 IP cameras. Enterprise grade.",
  },

  // ══════════════════════════════════════════════════════════════
  //  DVR (HD Recorders) — CP Plus
  // ══════════════════════════════════════════════════════════════

  "cp_dvr_4ch": {
    display_name: "CP Plus 4-Channel DVR (HD/Analog)",
    technical_name: "CP-UVR-0401H1-HC",
    brand: "cpplus",
    category: "recorder",
    technology: "HD",
    channels: 4,
    max_cameras: 4,
    unit_price: 2800,
    base_cost: 2100,
    is_active: true,
    tags: ["dvr", "hd", "4ch", "analog", "cp-plus"],
    description: "CP Plus 4-channel HD DVR. Compatible with all HD CCTV cameras.",
  },

  "cp_dvr_8ch": {
    display_name: "CP Plus 8-Channel DVR (HD/Analog)",
    technical_name: "CP-UVR-0801H1-HC",
    brand: "cpplus",
    category: "recorder",
    technology: "HD",
    channels: 8,
    max_cameras: 8,
    unit_price: 4200,
    base_cost: 3200,
    is_active: true,
    tags: ["dvr", "hd", "8ch", "analog", "cp-plus"],
    description: "CP Plus 8-channel HD DVR. For 5-8 analog cameras.",
  },

  "cp_dvr_16ch": {
    display_name: "CP Plus 16-Channel DVR (HD/Analog)",
    technical_name: "CP-UVR-1601H1-HC",
    brand: "cpplus",
    category: "recorder",
    technology: "HD",
    channels: 16,
    max_cameras: 16,
    unit_price: 7200,
    base_cost: 5500,
    is_active: true,
    tags: ["dvr", "hd", "16ch", "analog", "cp-plus"],
    description: "CP Plus 16-channel DVR. Enterprise analog setup.",
  },

  // ══════════════════════════════════════════════════════════════
  //  HARD DISKS (Surveillance Grade)
  // ══════════════════════════════════════════════════════════════

  "hdd_1tb_wd_purple": {
    display_name: "WD Purple 1TB Surveillance HDD",
    technical_name: "WD10PURZ-1TB",
    brand: "wd",
    category: "accessory",
    technology: "BOTH",
    unit_price: 3800,
    base_cost: 3200,
    is_active: true,
    tags: ["hdd", "1tb", "storage", "wd-purple"],
    description: "WD Purple 1TB HDD designed for 24/7 surveillance recording. Supports AllFrame technology.",
  },

  "hdd_2tb_wd_purple": {
    display_name: "WD Purple 2TB Surveillance HDD",
    technical_name: "WD20PURZ-2TB",
    brand: "wd",
    category: "accessory",
    technology: "BOTH",
    unit_price: 5500,
    base_cost: 4600,
    is_active: true,
    tags: ["hdd", "2tb", "storage", "wd-purple"],
    description: "WD Purple 2TB surveillance HDD. Handles continuous writes from 4-8 cameras.",
  },

  "hdd_4tb_seagate_skyhawk": {
    display_name: "Seagate SkyHawk 4TB Surveillance HDD",
    technical_name: "ST4000VX013-4TB",
    brand: "seagate",
    category: "accessory",
    technology: "BOTH",
    unit_price: 8800,
    base_cost: 7400,
    is_active: true,
    tags: ["hdd", "4tb", "storage", "seagate-skyhawk"],
    description: "Seagate SkyHawk 4TB. Heavy duty — handles up to 16 cameras simultaneously.",
  },

  "hdd_6tb_seagate_skyhawk": {
    display_name: "Seagate SkyHawk 6TB Surveillance HDD",
    technical_name: "ST6000VX001-6TB",
    brand: "seagate",
    category: "accessory",
    technology: "BOTH",
    unit_price: 13500,
    base_cost: 11200,
    is_active: true,
    tags: ["hdd", "6tb", "storage", "seagate-skyhawk"],
    description: "Seagate SkyHawk 6TB for enterprise 30-90 day retention with multiple cameras.",
  },

  // ══════════════════════════════════════════════════════════════
  //  PoE SWITCHES (for IP cameras) — max_cameras used for transmission calc
  // ══════════════════════════════════════════════════════════════

  "poe_4port_cpplus": {
    display_name: "CP Plus 4-Port PoE Switch (60W)",
    technical_name: "CP-ANW-HP4F-U60",
    brand: "cpplus",
    category: "accessory",
    technology: "IP",
    max_cameras: 4,
    unit_price: 1800,
    base_cost: 1400,
    is_active: true,
    tags: ["poe", "switch", "4port", "ip-power"],
    description: "CP Plus 4-port PoE switch — powers up to 4 IP cameras via network cable. No separate adapters needed.",
  },

  "poe_8port_cpplus": {
    display_name: "CP Plus 8-Port PoE Switch (120W)",
    technical_name: "CP-ANW-HP8F-U120",
    brand: "cpplus",
    category: "accessory",
    technology: "IP",
    max_cameras: 8,
    unit_price: 3200,
    base_cost: 2500,
    is_active: true,
    tags: ["poe", "switch", "8port", "ip-power"],
    description: "CP Plus 8-port PoE switch — powers up to 8 IP cameras simultaneously.",
  },

  "poe_16port_cpplus": {
    display_name: "CP Plus 16-Port PoE Switch (250W)",
    technical_name: "CP-ANW-HP16F-U250",
    brand: "cpplus",
    category: "accessory",
    technology: "IP",
    max_cameras: 16,
    unit_price: 6500,
    base_cost: 5000,
    is_active: true,
    tags: ["poe", "switch", "16port", "ip-power"],
    description: "CP Plus 16-port PoE switch for enterprise IP installations.",
  },

  // ══════════════════════════════════════════════════════════════
  //  PSU / POWER ADAPTERS (for HD/analog cameras)
  // ══════════════════════════════════════════════════════════════

  "psu_4ch_smps": {
    display_name: "4-Camera SMPS Power Supply (12V 5A)",
    technical_name: "SMPS-12V5A-4CH",
    brand: "cpplus",
    category: "accessory",
    technology: "HD",
    max_cameras: 4,
    unit_price: 650,
    base_cost: 480,
    is_active: true,
    tags: ["psu", "smps", "4ch", "hd-power"],
    description: "SMPS 12V 5A power supply for up to 4 analog HD cameras.",
  },

  "psu_8ch_smps": {
    display_name: "8-Camera SMPS Power Supply (12V 10A)",
    technical_name: "SMPS-12V10A-8CH",
    brand: "cpplus",
    category: "accessory",
    technology: "HD",
    max_cameras: 8,
    unit_price: 1100,
    base_cost: 820,
    is_active: true,
    tags: ["psu", "smps", "8ch", "hd-power"],
    description: "SMPS 12V 10A power supply for 5-8 analog HD cameras.",
  },

  "psu_16ch_smps": {
    display_name: "16-Camera SMPS Power Supply (12V 20A)",
    technical_name: "SMPS-12V20A-16CH",
    brand: "cpplus",
    category: "accessory",
    technology: "HD",
    max_cameras: 16,
    unit_price: 1900,
    base_cost: 1450,
    is_active: true,
    tags: ["psu", "smps", "16ch", "hd-power"],
    description: "SMPS 12V 20A power supply for large 9-16 camera analog installations.",
  },
};

// ─────────────────────────────────────────────
// Seed Function
// ─────────────────────────────────────────────

async function seedProducts() {
  console.log("🚀 Starting products seed...");
  console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   Products to seed: ${Object.keys(PRODUCTS).length}`);

  const batch = db.batch();
  let count = 0;

  for (const [productId, productData] of Object.entries(PRODUCTS)) {
    const ref = db.collection("products").doc(productId);
    batch.set(ref, { ...productData, created_at: ts, updated_at: ts }, { merge: true });
    count++;
    process.stdout.write(`   ✓ ${productData.display_name}\n`);
  }

  await batch.commit();

  const cameras = Object.values(PRODUCTS).filter(p => p.category === "camera");
  const recorders = Object.values(PRODUCTS).filter(p => p.category === "recorder");
  const accessories = Object.values(PRODUCTS).filter(p => p.category === "accessory");

  console.log(`\n✅ Done! Seeded ${count} products:`);
  console.log(`   📷 Cameras:     ${cameras.length} (${cameras.filter(c => c.technology === "IP").length} IP, ${cameras.filter(c => c.technology === "HD").length} HD)`);
  console.log(`   📼 Recorders:   ${recorders.length} (${recorders.filter(r => r.technology === "IP").length} NVR, ${recorders.filter(r => r.technology === "HD").length} DVR)`);
  console.log(`   🔧 Accessories: ${accessories.length} (${accessories.filter(a => a.tags?.includes("hdd")).length} HDD, PoE/PSU included)`);
  console.log(`\n   Brands: CP Plus, Prama, WD, Seagate`);

  process.exit(0);
}

seedProducts().catch((err) => {
  console.error("❌ Products seed failed:", err);
  process.exit(1);
});
