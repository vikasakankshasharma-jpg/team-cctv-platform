import "dotenv/config";
import { adminDb } from "../lib/firebase-admin";

const STAGING_PROJECT_ID = "team-cctv-live-8294";

async function seedCatalog() {
  console.log("=== STAGING CATALOG SEEDER ===");

  if (process.env.FIREBASE_PROJECT_ID !== STAGING_PROJECT_ID) {
    console.error(`🚨 ABORT: Wrong project. Expected ${STAGING_PROJECT_ID}, got ${process.env.FIREBASE_PROJECT_ID}`);
    process.exit(1);
  }

  if (process.env.SEED_STAGING_CATALOG !== "true") {
    console.error(`🚨 ABORT: Safety flag SEED_STAGING_CATALOG=true is not set in env.`);
    process.exit(1);
  }

  const commonMetadata = {
    environment: "staging",
    is_active: true,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    is_test_product: true,
    updated_at: new Date().toISOString(),
  };

  const catalog = [
    // --- CAMERAS ---
    {
      sku: "STG_CAM_IP_2MP_001",
      category: "cctv_camera",
      brand: "STG-HIK",
      display_name: "Staging 2MP IP Bullet Camera",
      technical_name: "STG-IP-2MP-BLT",
      technologies: ["IP"],
      form_factor: "bullet",
      resolution_mp: 2,
      base_cost: 1500,
      margin_percentage: 20,
      mrp: 3000,
      recording_bitrate_kbps: 1024,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CAM_IP_5MP_001",
      category: "cctv_camera",
      brand: "STG-CP",
      display_name: "Staging 5MP IP Dome Camera",
      technical_name: "STG-IP-5MP-DOM",
      technologies: ["IP"],
      form_factor: "dome",
      resolution_mp: 5,
      base_cost: 2500,
      margin_percentage: 20,
      mrp: 4500,
      recording_bitrate_kbps: 3072,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CAM_IP_8MP_001",
      category: "cctv_camera",
      brand: "STG-DAH",
      display_name: "Staging 8MP IP Bullet Camera (4K)",
      technical_name: "STG-IP-8MP-BLT",
      technologies: ["IP"],
      form_factor: "bullet",
      resolution_mp: 8,
      base_cost: 4000,
      margin_percentage: 25,
      mrp: 8000,
      recording_bitrate_kbps: 6144,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CAM_HD_2MP_001",
      category: "cctv_camera",
      brand: "STG-HIK",
      display_name: "Staging 2MP HD Dome Camera",
      technical_name: "STG-HD-2MP-DOM",
      technologies: ["HD", "Analog"],
      form_factor: "dome",
      resolution_mp: 2,
      base_cost: 900,
      margin_percentage: 15,
      mrp: 2000,
      recording_bitrate_kbps: 1024,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CAM_HD_5MP_001",
      category: "cctv_camera",
      brand: "STG-CP",
      display_name: "Staging 5MP HD Bullet Camera",
      technical_name: "STG-HD-5MP-BLT",
      technologies: ["HD", "Analog"],
      form_factor: "bullet",
      resolution_mp: 5,
      base_cost: 1600,
      margin_percentage: 20,
      mrp: 3500,
      recording_bitrate_kbps: 3072,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CAM_WIFI_2MP_001",
      category: "cctv_camera",
      brand: "STG-EZV",
      display_name: "Staging WiFi Smart Camera 2MP",
      technical_name: "STG-WIFI-2MP",
      technologies: ["WiFi"],
      form_factor: "ptz",
      resolution_mp: 2,
      base_cost: 2000,
      margin_percentage: 10,
      mrp: 3500,
      recording_bitrate_kbps: 1024,
      vendor_id: "vendor_stg_001"
    },

    // --- RECORDERS ---
    {
      sku: "STG_DVR_4CH_001",
      category: "recorder",
      brand: "STG-HIK",
      display_name: "Staging 4CH DVR/NVR",
      technical_name: "STG-REC-4CH",
      channels: 4,
      max_resolution_mp: 5,
      base_cost: 3000,
      margin_percentage: 20,
      mrp: 5000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_DVR_8CH_001",
      category: "recorder",
      brand: "STG-CP",
      display_name: "Staging 8CH DVR/NVR",
      technical_name: "STG-REC-8CH",
      channels: 8,
      max_resolution_mp: 8,
      base_cost: 4500,
      margin_percentage: 20,
      mrp: 8000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_DVR_16CH_001",
      category: "recorder",
      brand: "STG-DAH",
      display_name: "Staging 16CH DVR/NVR",
      technical_name: "STG-REC-16CH",
      channels: 16,
      max_resolution_mp: 8,
      base_cost: 7000,
      margin_percentage: 15,
      mrp: 12000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_DVR_32CH_001",
      category: "recorder",
      brand: "STG-HIK",
      display_name: "Staging 32CH NVR",
      technical_name: "STG-REC-32CH",
      channels: 32,
      max_resolution_mp: 8,
      base_cost: 15000,
      margin_percentage: 15,
      mrp: 25000,
      vendor_id: "vendor_stg_001"
    },

    // --- STORAGE ---
    {
      sku: "STG_HDD_1TB_001",
      category: "storage",
      brand: "STG-WD",
      display_name: "Staging 1TB Surveillance HDD",
      technical_name: "STG-HDD-1TB",
      storage_capacity_tb: 1,
      base_cost: 3500,
      margin_percentage: 10,
      mrp: 5000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_HDD_2TB_001",
      category: "storage",
      brand: "STG-SG",
      display_name: "Staging 2TB Surveillance HDD",
      technical_name: "STG-HDD-2TB",
      storage_capacity_tb: 2,
      base_cost: 4800,
      margin_percentage: 10,
      mrp: 6500,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_HDD_4TB_001",
      category: "storage",
      brand: "STG-WD",
      display_name: "Staging 4TB Surveillance HDD",
      technical_name: "STG-HDD-4TB",
      storage_capacity_tb: 4,
      base_cost: 8500,
      margin_percentage: 10,
      mrp: 12000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_HDD_8TB_001",
      category: "storage",
      brand: "STG-SG",
      display_name: "Staging 8TB Surveillance HDD",
      technical_name: "STG-HDD-8TB",
      storage_capacity_tb: 8,
      base_cost: 16000,
      margin_percentage: 15,
      mrp: 24000,
      vendor_id: "vendor_stg_001"
    },

    // --- INFRASTRUCTURE (Cables, Power, Connectors) ---
    {
      sku: "STG_CAB_CAT6_001",
      category: "cable",
      brand: "STG-DLI",
      display_name: "Staging Cat6 Copper Cable (Per Bundle)",
      technical_name: "STG-CAT6-BUNDLE",
      base_cost: 1500,
      margin_percentage: 30,
      mrp: 3000,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_POW_4CH_001",
      category: "power_supply",
      brand: "STG-ERD",
      display_name: "Staging 4CH SMPS Power Supply",
      technical_name: "STG-SMPS-4CH",
      base_cost: 400,
      margin_percentage: 40,
      mrp: 800,
      vendor_id: "vendor_stg_001"
    },
    {
      sku: "STG_CON_BNC_001",
      category: "connector",
      brand: "STG-GEN",
      display_name: "Staging BNC Connector",
      technical_name: "STG-BNC",
      base_cost: 15,
      margin_percentage: 100,
      mrp: 50,
      vendor_id: "vendor_stg_001"
    }
  ];

  console.log(`Starting upsert for ${catalog.length} staging products...`);
  let batch = adminDb.batch();
  let count = 0;

  for (const item of catalog) {
    // Check if exists
    const existingSnap = await adminDb.collection("products").where("sku", "==", item.sku).limit(1).get();
    
    let docRef;
    if (!existingSnap.empty) {
      docRef = existingSnap.docs[0].ref;
    } else {
      docRef = adminDb.collection("products").doc(); // Let firebase generate ID
    }

    batch.set(docRef, { ...item, ...commonMetadata }, { merge: true });
    count++;

    if (count % 10 === 0) {
      await batch.commit();
      console.log(`Committed ${count} items...`);
      batch = adminDb.batch();
    }
  }

  // Commit remaining
  if (count % 10 !== 0) {
    await batch.commit();
    console.log(`Committed remaining ${count % 10} items...`);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seedCatalog().catch(console.error);
