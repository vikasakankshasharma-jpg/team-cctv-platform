/**
 * @file scripts/add-megacompu-sd-cards.ts
 * @description Adds genuine surveillance MicroSD cards from Mega Compu World
 *              (CP-Plus 128GB, CP-Plus 64GB, EVM 256GB, EVM 128GB, EVM 64GB)
 *              into the Firestore `products` collection.
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

export const NEW_MEGA_SD_CARDS: Record<string, any> = {
  "SD-CPP-128GB": {
    display_name: "CP Plus 128GB Surveillance MicroSD Card (CP-NM128)",
    technical_name: "CP-NM128",
    internal_sku: "CP-NM128",
    vendor_pid: "A3695",
    vendor_item_code: "116GC8W",
    brand: "CP PLUS",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 128,
    capacity: "128GB",
    catalog_path: "storage/microsd/MicroSD Card",
    is_high_endurance: true,
    base_cost: 1871,
    margin_percentage: 15,
    unit_price: 2152,
    unit_price_budget: 2050,
    unit_price_premium: 2290,
    warranty_years: 5,
    is_active: true,
    is_deleted: false,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    stock_quantity: 25,
    source_vendor: "Mega Compu World",
    source_url: "https://megajaipur.com/data-storage/sd--micro-sd-cards?brand=84&f=227",
    description: "CP Plus 128GB Surveillance Application MicroSDXC UHS-I memory card with SD adapter. Built specifically for CCTV continuous loop overwrite.",
  },
  "SD-CPP-64GB": {
    display_name: "CP Plus 64GB Surveillance MicroSD Card (CP-NM64)",
    technical_name: "CP-NM64",
    internal_sku: "CP-NM64",
    vendor_pid: "A3701",
    vendor_item_code: "1I99H4W",
    brand: "CP PLUS",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 64,
    capacity: "64GB",
    catalog_path: "storage/microsd/MicroSD Card",
    is_high_endurance: true,
    base_cost: 1031,
    margin_percentage: 15,
    unit_price: 1186,
    unit_price_budget: 1140,
    unit_price_premium: 1250,
    warranty_years: 5,
    is_active: true,
    is_deleted: false,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    stock_quantity: 20,
    source_vendor: "Mega Compu World",
    source_url: "https://megajaipur.com/data-storage/sd--micro-sd-cards?brand=84",
    description: "CP Plus 64GB Surveillance Application MicroSDXC UHS-I memory card. Built specifically for CCTV continuous loop overwrite.",
  },
  "SD-EVM-256GB": {
    display_name: "EVM 256GB Elite MicroSD Card For CCTV Camera (EVMSD/256GB)",
    technical_name: "EVMSD/256GB",
    internal_sku: "EVMSD/256GB",
    vendor_pid: "A1565",
    vendor_item_code: "18RXH4W",
    brand: "EVM",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 256,
    capacity: "256GB",
    catalog_path: "storage/microsd/MicroSD Card",
    is_high_endurance: true,
    base_cost: 3584,
    margin_percentage: 15,
    unit_price: 4122,
    unit_price_budget: 3990,
    unit_price_premium: 4290,
    warranty_years: 10,
    is_active: true,
    is_deleted: false,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    stock_quantity: 15,
    source_vendor: "Mega Compu World",
    source_url: "https://megajaipur.com/data-storage/sd--micro-sd-cards?brand=85&f=227%2C233",
    description: "EVM Elite 256GB Micro SDXC Class 10 U3 V30 A1 high speed memory card for CCTV cameras and 4K surveillance recording.",
  },
  "SD-EVM-128GB": {
    display_name: "EVM 128GB Elite MicroSD Card For CCTV Camera (EVMSD/128GB)",
    technical_name: "EVMSD/128GB",
    internal_sku: "EVMSD/128GB",
    vendor_pid: "A1566",
    vendor_item_code: "18S33EO",
    brand: "EVM",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 128,
    capacity: "128GB",
    catalog_path: "storage/microsd/MicroSD Card",
    is_high_endurance: true,
    base_cost: 1848,
    margin_percentage: 15,
    unit_price: 2125,
    unit_price_budget: 2050,
    unit_price_premium: 2250,
    warranty_years: 10,
    is_active: true,
    is_deleted: false,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    stock_quantity: 20,
    source_vendor: "Mega Compu World",
    source_url: "https://megajaipur.com/data-storage/sd--micro-sd-cards?brand=85&f=227%2C232",
    description: "EVM Elite 128GB Micro SDXC Class 10 U3 V30 A1 high speed memory card for CCTV cameras and smartphones.",
  },
  "SD-EVM-64GB": {
    display_name: "EVM 64GB Elite MicroSD Card For CCTV Camera (EVMSD/64GB)",
    technical_name: "EVMSD/64GB",
    internal_sku: "EVMSD/64GB",
    vendor_pid: "A1567",
    vendor_item_code: "18S8POG",
    brand: "EVM",
    category: "storage",
    technology: "Common",
    technologies: ["Wireless", "Common"],
    storage_type: "Micro SD",
    storage_capacity_gb: 64,
    capacity: "64GB",
    catalog_path: "storage/microsd/MicroSD Card",
    is_high_endurance: true,
    base_cost: 904,
    margin_percentage: 15,
    unit_price: 1040,
    unit_price_budget: 990,
    unit_price_premium: 1090,
    warranty_years: 10,
    is_active: true,
    is_deleted: false,
    is_quotation_eligible: true,
    is_configurator_visible: true,
    stock_status: "in_stock",
    stock_quantity: 25,
    source_vendor: "Mega Compu World",
    source_url: "https://megajaipur.com/data-storage/sd--micro-sd-cards?brand=85&f=227%2C231",
    description: "EVM Elite 64GB Micro SDXC Class 10 U3 V30 A1 high speed memory card for CCTV cameras and smart devices.",
  },
};

async function seedSdCards() {
  const { db, ts } = getDb();
  console.log("Adding Mega Compu World MicroSD Cards to Firestore `products` collection...");

  let added = 0;
  for (const [id, prodData] of Object.entries(NEW_MEGA_SD_CARDS)) {
    const docRef = db.collection("products").doc(id);
    const existing = await docRef.get();

    await docRef.set(
      {
        ...prodData,
        created_at: existing.exists ? existing.data()?.created_at || ts : ts,
        updated_at: ts,
      },
      { merge: true }
    );

    console.log(
      ` ✅ Added: [${id}] ${prodData.display_name} -> Base: ₹${prodData.base_cost} | Selling: ₹${prodData.unit_price} | Capacity: ${prodData.capacity}`
    );
    added++;
  }

  console.log(`\n🎉 Successfully added all ${added} MicroSD cards to the product list!`);
}

seedSdCards().catch((err) => {
  console.error("❌ Error adding MicroSD cards:", err);
  process.exit(1);
});
