/**
 * @file scripts/enrich-pricing-master.ts
 * @description Enriches `pricing-master-seed.json` with all canonical tags,
 * top-level fields, hardware specs, and normalized IDs as mandated by
 * types/index.ts, pricing-engine, catalog-capacity, and product-resolver.
 */

import * as fs from "fs";
import * as path from "path";

const seedPath = path.resolve(__dirname, "pricing-master-seed.json");
const seedProducts: any[] = JSON.parse(fs.readFileSync(seedPath, "utf8"));

console.log(`Starting schema enrichment for ${seedProducts.length} products...`);

const enriched = seedProducts.map(p => {
  const specs = p.specifications || {};
  const rawCat = p.category || "";
  const brand = p.brand || "Budget Brand";
  const name = p.display_name || "";
  const sku = p.skuId || p.id;

  // 1. Determine Normalized Category
  let category = "accessories";
  if (rawCat === "CAMERA_HD" || rawCat === "CAMERA_IP" || rawCat === "cctv_camera") {
    category = "cctv_camera";
  } else if (rawCat === "DVR" || rawCat === "NVR" || rawCat === "recorder") {
    category = "recorder";
  } else if (rawCat === "HDD" || rawCat === "storage") {
    category = "storage";
  } else if (rawCat === "POWER_SUPPLY" || rawCat === "POE_SWITCH" || rawCat === "power_device") {
    category = "power_device";
  } else if (rawCat === "CABLE" || rawCat === "cable") {
    category = "cable";
  } else if (rawCat === "CONNECTOR" || rawCat === "connector") {
    category = "connector";
  } else if (name.toLowerCase().includes("display")) {
    category = "display";
  } else if (name.toLowerCase().includes("rack")) {
    category = "rack";
  } else if (name.toLowerCase().includes("router")) {
    category = "network";
  } else if (name.toLowerCase().includes("junction box")) {
    category = "camera_mount";
  }

  // 2. Determine Technology Array
  let technologies: string[] = ["Common"];
  let technology = "Common";
  if (rawCat === "CAMERA_HD" || rawCat === "DVR" || rawCat === "POWER_SUPPLY" || specs.type === "3+1" || specs.type === "BNC" || specs.type === "DC") {
    technologies = ["HD"];
    technology = "HD";
  } else if (rawCat === "CAMERA_IP" || rawCat === "NVR" || rawCat === "POE_SWITCH" || specs.type === "CAT6" || specs.type === "RJ45") {
    technologies = ["IP"];
    technology = "IP";
  } else if (name.toLowerCase().includes("wifi") || name.toLowerCase().includes("wireless")) {
    technologies = ["Wireless"];
    technology = "Wireless";
  }

  // 3. Extract Tags and Features
  const features: string[] = [];
  const tags: string[] = [brand.toLowerCase().replace(/\s+/g, "_")];

  const nameLower = name.toLowerCase();
  const featStr = (specs.features || "").toLowerCase();

  if (featStr.includes("color") || nameLower.includes("color")) features.push("color_night");
  if (featStr.includes("night") || nameLower.includes("night")) features.push("night_vision");
  if (featStr.includes("audio") || nameLower.includes("audio")) features.push("audio");
  if (specs.tier === "ECO" || nameLower.includes("eco")) features.push("eco");
  if (specs.tier === "PREMIUM" || nameLower.includes("premium")) features.push("premium");
  if (nameLower.includes("ptz")) features.push("ptz");

  // 4. Specs Extraction
  let resolution_mp: number | undefined = undefined;
  if (specs.mp) {
    resolution_mp = parseInt(specs.mp.replace(/\D/g, ""), 10);
  }

  let form_factor: string | undefined = undefined;
  if (specs.formFactor) {
    form_factor = specs.formFactor.toLowerCase();
  }

  let channels: number | undefined = undefined;
  let max_cameras: number | undefined = undefined;
  if (specs.channels) {
    channels = Number(specs.channels);
    max_cameras = Number(specs.channels);
  }

  let storage_capacity_tb: number | undefined = undefined;
  let storage_type: string | undefined = undefined;
  if (specs.storage) {
    storage_type = "Hard Disk";
    if (specs.storage.includes("500GB")) storage_capacity_tb = 0.5;
    else if (specs.storage.includes("1TB")) storage_capacity_tb = 1.0;
    else if (specs.storage.includes("2TB")) storage_capacity_tb = 2.0;
    else if (specs.storage.includes("4TB")) storage_capacity_tb = 4.0;
  }

  let cable_length_m: number | undefined = undefined;
  let cable_type: string | undefined = undefined;
  if (specs.lengthMeters) {
    cable_length_m = Number(specs.lengthMeters);
    cable_type = specs.type || (specs.lengthMeters === 90 || specs.lengthMeters === 70 ? "3+1 CCTV" : "Cat6");
  }

  // Construct tags array
  if (technology !== "Common") tags.push(technology.toLowerCase());
  if (resolution_mp) tags.push(`${resolution_mp}mp`);
  if (form_factor) tags.push(form_factor);
  if (channels) tags.push(`${channels}ch`);
  if (storage_capacity_tb) tags.push(`${storage_capacity_tb}tb`);
  tags.push(...features);

  return {
    ...p,
    id: sku,
    sku,
    category,
    legacy_category: rawCat,
    technologies,
    technology,
    ...(resolution_mp !== undefined ? { resolution_mp } : {}),
    ...(form_factor !== undefined ? { form_factor } : {}),
    ...(channels !== undefined ? { channels, max_cameras } : {}),
    ...(specs.sata ? { hdd_slots: Number(specs.sata) } : {}),
    ...(storage_capacity_tb !== undefined ? { storage_capacity_tb, storage_type } : {}),
    ...(cable_length_m !== undefined ? { cable_length_m, cable_type } : {}),
    features: Array.from(new Set(features)),
    tags: Array.from(new Set(tags)),
    unit_price: p.baseCost || 0, // Base default, MarginEngine applies selling price
    is_active: p.is_active ?? true,
    is_quotation_eligible: p.is_quotation_eligible ?? true,
    stock_status: p.stock_status || "in_stock"
  };
});

fs.writeFileSync(seedPath, JSON.stringify(enriched, null, 2), "utf8");
console.log(`Successfully enriched ${enriched.length} products in pricing-master-seed.json!\n`);
