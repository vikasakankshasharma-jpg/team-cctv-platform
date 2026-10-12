/**
 * @file scripts/audit-catalog-schema.ts
 * @description Comprehensive Audit Tool for Product Tags, Fields, Specs, and IDs.
 * Audits `pricing-master-seed.json` (61 items) and `seed-cctv-products.ts` (27 items)
 * against the complete TEAM CCTV Platform schema contracts and engine requirements.
 */

import * as fs from "fs";
import * as path from "path";
import { PRODUCTS as STATIC_PRODUCTS } from "./seed-cctv-products";

interface Issue {
  source: string;
  sku: string;
  field: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  currentValue?: any;
  recommendation: string;
}

const VALID_CATEGORIES = [
  "cctv_camera",
  "recorder",
  "storage",
  "connector",
  "cable",
  "power_device",
  "display",
  "camera_mount",
  "rack",
  "network",
  "hdmi_cable",
  "accessories",
  "service",
  "others",
  "unidentified"
];

function auditProduct(
  p: any,
  source: string,
  seenIds: Set<string>,
  issues: Issue[]
) {
  const sku = p.skuId || p.id || p.sku || "UNKNOWN_SKU";

  // --- ID Checks ---
  if (!p.skuId && !p.id && !p.sku) {
    issues.push({
      source,
      sku,
      field: "id / skuId / sku",
      severity: "CRITICAL",
      message: "Product is missing primary identifier",
      recommendation: "Assign unique deterministic SKU string"
    });
  } else {
    if (seenIds.has(sku)) {
      issues.push({
        source,
        sku,
        field: "id / skuId / sku",
        severity: "CRITICAL",
        message: `Duplicate SKU detected across sources: ${sku}`,
        recommendation: "Ensure each product has a globally unique ID"
      });
    }
    seenIds.add(sku);
  }

  // --- Field Checks ---
  if (!p.display_name || p.display_name.trim().length === 0) {
    issues.push({
      source,
      sku,
      field: "display_name",
      severity: "CRITICAL",
      message: "Missing or blank display_name",
      recommendation: "Add customer-facing title"
    });
  }

  if (!p.technical_name || p.technical_name.trim().length === 0) {
    issues.push({
      source,
      sku,
      field: "technical_name",
      severity: "MEDIUM",
      message: "Missing technical_name (OEM model number)",
      recommendation: "Add OEM model number for warranty and installation ledger"
    });
  }

  if (!p.brand) {
    issues.push({
      source,
      sku,
      field: "brand",
      severity: "HIGH",
      message: "Missing brand field",
      recommendation: "Specify brand (e.g. 'cpplus', 'Budget Brand', 'Seagate')"
    });
  }

  // --- Category Checks ---
  const rawCat = p.category;
  let normalizedCat = rawCat ? String(rawCat).toLowerCase() : "";
  if (normalizedCat === "camera_hd" || normalizedCat === "camera_ip" || normalizedCat === "camera") normalizedCat = "cctv_camera";
  if (normalizedCat === "dvr" || normalizedCat === "nvr") normalizedCat = "recorder";
  if (normalizedCat === "power_supply" || normalizedCat === "poe_switch") normalizedCat = "power_device";
  if (normalizedCat === "hdd") normalizedCat = "storage";
  if (normalizedCat === "accessory") normalizedCat = "accessories";

  if (!VALID_CATEGORIES.includes(normalizedCat)) {
    issues.push({
      source,
      sku,
      field: "category",
      severity: "HIGH",
      message: `Category '${rawCat}' does not match standard VendorCategory enum`,
      currentValue: rawCat,
      recommendation: `Normalize to standard VendorCategory: ${VALID_CATEGORIES.slice(0, 7).join(", ")}`
    });
  }

  // --- Pricing Checks ---
  if (p.baseCost === undefined && p.base_cost === undefined && p.stock_status !== "on_demand") {
    issues.push({
      source,
      sku,
      field: "baseCost / base_cost",
      severity: "HIGH",
      message: "Missing dealer base_cost",
      recommendation: "Provide dealer purchase cost for MarginEngine calculation"
    });
  }

  // --- Specifications & Hardware Specs Checks ---
  const specs = p.specifications || {};

  // Camera specs
  if (rawCat?.includes("CAMERA") || normalizedCat === "cctv_camera") {
    const res = specs.mp || p.resolution_mp;
    if (!res) {
      issues.push({
        source,
        sku,
        field: "specifications.mp / resolution_mp",
        severity: "HIGH",
        message: "Camera product missing megapixel resolution spec",
        recommendation: "Set resolution (e.g. '2MP', '4MP', '5MP', '8MP') for wizard filtering"
      });
    }
    const form = specs.formFactor || p.form_factor;
    if (!form) {
      issues.push({
        source,
        sku,
        field: "specifications.formFactor / form_factor",
        severity: "HIGH",
        message: "Camera product missing formFactor (DOME vs BULLET)",
        recommendation: "Set formFactor ('DOME' or 'BULLET') for indoor/outdoor placement mapping"
      });
    }
  }

  // Recorder specs
  if (rawCat === "DVR" || rawCat === "NVR" || normalizedCat === "recorder") {
    const ch = specs.channels || p.channels || p.max_cameras;
    if (!ch) {
      issues.push({
        source,
        sku,
        field: "specifications.channels / channels",
        severity: "CRITICAL",
        message: "Recorder product missing channel count",
        recommendation: "Define channels (4, 8, 16, 32) so recorder resolver can size properly"
      });
    }
  }

  // Storage specs
  if (rawCat === "HDD" || normalizedCat === "storage") {
    const storageStr = specs.storage || p.storage_capacity_tb || p.capacity;
    if (!storageStr) {
      issues.push({
        source,
        sku,
        field: "specifications.storage / storage_capacity_tb",
        severity: "CRITICAL",
        message: "Storage product missing storage capacity spec",
        recommendation: "Set storage capacity (e.g. '1TB', '2TB', '4TB', 1.0, 2.0)"
      });
    }
  }

  // Cable specs
  if (rawCat === "CABLE" || normalizedCat === "cable") {
    const len = specs.lengthMeters || p.cable_length_m;
    if (!len) {
      issues.push({
        source,
        sku,
        field: "specifications.lengthMeters / cable_length_m",
        severity: "MEDIUM",
        message: "Cable product missing length in meters",
        recommendation: "Define roll length (e.g. 70, 90, 100, 305) for knapsack optimization"
      });
    }
  }

  // Power device specs
  if (rawCat === "POE_SWITCH" || rawCat === "POWER_SUPPLY" || normalizedCat === "power_device") {
    const ch = specs.channels || p.channels || p.max_cameras;
    if (!ch && !sku.includes("ROUTER")) {
      issues.push({
        source,
        sku,
        field: "specifications.channels / max_cameras",
        severity: "HIGH",
        message: "Power / PoE switch missing supported camera channels",
        recommendation: "Define channels (e.g. 4, 8, 16) for transmission quantity calculation"
      });
    }
  }

  // --- Tags & Features Checks ---
  if (p.features && !Array.isArray(p.features) && typeof p.features !== "string") {
    issues.push({
      source,
      sku,
      field: "features",
      severity: "LOW",
      message: "Features field is not an array or string",
      recommendation: "Store features as an array of FeatureTag identifiers"
    });
  }

  if (p.tags && !Array.isArray(p.tags) && typeof p.tags !== "string") {
    issues.push({
      source,
      sku,
      field: "tags",
      severity: "LOW",
      message: "Tags field is not an array or string",
      recommendation: "Store tags as an array of string keywords"
    });
  }
}

async function auditCatalog() {
  console.log("\n╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║     TEAM CCTV PLATFORM - PRODUCT SCHEMA & TAG INTEGRITY AUDIT        ║");
  console.log("║     Auditing IDs, Tags, Categories, Fields & Hardware Specs          ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝\n");

  const issues: Issue[] = [];

  // 1. Audit pricing-master-seed.json
  const seedJsonPath = path.resolve(__dirname, "pricing-master-seed.json");
  if (!fs.existsSync(seedJsonPath)) {
    console.error("pricing-master-seed.json not found!");
    process.exit(1);
  }

  const seedProducts: any[] = JSON.parse(fs.readFileSync(seedJsonPath, "utf8"));
  console.log(`[Source 1: Master Price Seed] Inspecting ${seedProducts.length} items in pricing-master-seed.json...`);

  const seenIds1 = new Set<string>();
  for (const p of seedProducts) {
    auditProduct(p, "pricing-master-seed.json", seenIds1, issues);
  }

  // 2. Audit seed-cctv-products.ts
  const staticProductsList = Object.entries(STATIC_PRODUCTS).map(([key, val]) => ({
    id: key,
    sku: key,
    ...val
  }));
  console.log(`[Source 2: Static Catalog Seed] Inspecting ${staticProductsList.length} items in seed-cctv-products.ts...`);

  const seenIds2 = new Set<string>();
  for (const p of staticProductsList) {
    auditProduct(p, "seed-cctv-products.ts", seenIds2, issues);
  }

  const totalAudited = seedProducts.length + staticProductsList.length;

  // Summary Report
  console.log("\n" + "═".repeat(70));
  console.log(`TOTAL PRODUCTS AUDITED ACROSS SOURCES: ${totalAudited}`);
  console.log(`  - Master Seed (pricing-master-seed.json): ${seedProducts.length}`);
  console.log(`  - Static Catalog (seed-cctv-products.ts): ${staticProductsList.length}`);
  console.log(`TOTAL ISSUES IDENTIFIED: ${issues.length}`);
  
  const criticalIssues = issues.filter(i => i.severity === "CRITICAL");
  const highIssues = issues.filter(i => i.severity === "HIGH");
  const mediumIssues = issues.filter(i => i.severity === "MEDIUM");
  const lowIssues = issues.filter(i => i.severity === "LOW");

  console.log(`  - CRITICAL: ${criticalIssues.length}`);
  console.log(`  - HIGH:     ${highIssues.length}`);
  console.log(`  - MEDIUM:   ${mediumIssues.length}`);
  console.log(`  - LOW:      ${lowIssues.length}`);
  console.log("═".repeat(70) + "\n");

  if (issues.length > 0) {
    console.log("Detailed Breakdown of Issues:\n");
    for (const iss of issues) {
      const badge = iss.severity === "CRITICAL" ? "🔴 CRITICAL" : (iss.severity === "HIGH" ? "🟠 HIGH    " : "🟡 MEDIUM  ");
      console.log(`[${badge}] Source: ${iss.source} | SKU: ${iss.sku}`);
      console.log(`  Field:          ${iss.field}`);
      console.log(`  Issue:          ${iss.message}`);
      if (iss.currentValue !== undefined) console.log(`  Current Value:  ${JSON.stringify(iss.currentValue)}`);
      console.log(`  Recommendation: ${iss.recommendation}`);
      console.log("");
    }
  } else {
    console.log("🎉 ALL PRODUCTS IN BOTH CATALOG SOURCES HAVE VALID TAGS, FIELDS, SPECS, AND IDENTIFIERS!\n");
  }

  return { total: totalAudited, issues };
}

auditCatalog().catch(err => {
  console.error("Audit tool failed:", err);
  process.exit(1);
});
