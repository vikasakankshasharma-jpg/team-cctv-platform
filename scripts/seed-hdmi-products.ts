import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function seedHdmi() {
  const { adminDb } = await import("../lib/firebase-admin");
  console.log("Seeding HDMI cable catalog in Firestore...");

  const HDMI_PRODUCTS = [
    {
      sku: "HDMI-1.5M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 1.5 MTR",
      display_name: "High-Speed HDMI Cable (1.5 MTR)",
      technical_name: "BB-HDMI1.5",
      base_cost: 60,
      unit_price: 84,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
    {
      sku: "HDMI-3M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 3 MTR",
      display_name: "High-Speed HDMI Cable (3 MTR)",
      technical_name: "BB-HDMI3",
      base_cost: 120,
      unit_price: 168,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
    {
      sku: "HDMI-5M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 5 MTR",
      display_name: "High-Speed HDMI Cable (5 MTR)",
      technical_name: "BB-HDMI5",
      base_cost: 180,
      unit_price: 252,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
    {
      sku: "HDMI-10M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 10 MTR",
      display_name: "High-Speed HDMI Cable (10 MTR)",
      technical_name: "BB-HDMI10",
      base_cost: 300,
      unit_price: 420,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
    {
      sku: "HDMI-15M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 15 MTR",
      display_name: "High-Speed HDMI Cable (15 MTR)",
      technical_name: "BB-HDMI15",
      base_cost: 450,
      unit_price: 630,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
    {
      sku: "HDMI-20M",
      brand: "Budget Brand",
      category: "hdmi_cable",
      description: "HDMI Cable 20 MTR",
      display_name: "High-Speed HDMI Cable (20 MTR)",
      technical_name: "BB-HDMI20",
      base_cost: 650,
      unit_price: 910,
      technology: "Common",
      technologies: ["Common", "both", "HD", "IP", "Wireless"],
      group_path: "hdmi_cable/General",
      catalog_path: "hdmi_cable/General",
      is_active: true,
      in_stock: true,
      is_deleted: false,
      margin_percentage: 40,
    },
  ];

  const batch = adminDb.batch();
  for (const item of HDMI_PRODUCTS) {
    const docRef = adminDb.collection("products").doc(item.sku);
    batch.set(
      docRef,
      {
        ...item,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  console.log(`✅ Successfully synced all ${HDMI_PRODUCTS.length} HDMI cables in Firestore!`);
}

seedHdmi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
