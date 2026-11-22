/**
 * @file secure-easy/scripts/cctv-vendor-batch-ingest.ts
 * @description Batch Ingestion & Reconciliation Engine for Downloaded Vendor Category HTMLs.
 * Filters out non-CCTV clutter, verifies 100% GST-paid math, and generates audit metrics.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import {
  classifyCCTVProduct,
  calculateReverseGST,
  analyzePriceDrift,
} from "../lib/vendor/cctv-domain-filter.ts";
import type {
  CCTVFilterResult,
  PriceDriftAnalysis,
} from "../lib/vendor/cctv-domain-filter.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VENDOR_HTML_DIR = "C:\\Users\\hp\\Downloads\\Megacompuworld";

async function runBatchAudit() {
  console.log("==========================================================");
  console.log("   TEAM CCTV — Batch Ingestion & Reconciliation Audit     ");
  console.log(`   Source Directory: ${VENDOR_HTML_DIR}               `);
  console.log("==========================================================\n");

  if (!fs.existsSync(VENDOR_HTML_DIR)) {
    console.error(`Directory not found: ${VENDOR_HTML_DIR}`);
    process.exit(1);
  }

  const htmlFiles = fs.readdirSync(VENDOR_HTML_DIR).filter((f) => f.endsWith(".html"));
  console.log(`Found ${htmlFiles.length} vendor category HTML files.\n`);

  // Load existing catalog
  const catalogPath = path.join(__dirname, "../data/mega-products.generated.json");
  let liveCatalogData: any = {};
  if (fs.existsSync(catalogPath)) {
    liveCatalogData = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  }
  const liveCatalog: any[] = Array.isArray(liveCatalogData) ? liveCatalogData : (liveCatalogData.products || []);

  const catalogByPid = new Map<string, any>();
  const catalogByTitle = new Map<string, any>();
  liveCatalog.forEach((p) => {
    if (p.pid) catalogByPid.set(p.pid.toUpperCase(), p);
    if (p.vendor_product_id) catalogByPid.set(p.vendor_product_id.toUpperCase(), p);
    if (p.mega_pid) catalogByPid.set(p.mega_pid.toUpperCase(), p);
    if (p.title) catalogByTitle.set(p.title.trim().toLowerCase(), p);
    if (p.display_name) catalogByTitle.set(p.display_name.trim().toLowerCase(), p);
  });

  let totalParsed = 0;
  let totalCCTVEligible = 0;
  let totalNonCCTVRejected = 0;
  const cctvByCategory: Record<string, number> = {};
  const rejectedReasons: Record<string, number> = {};

  let exactMatches = 0;
  let safeUpdates = 0;
  let highDriftAlerts = 0;
  let newCCTVProducts = 0;
  let allGSTReconciled = true;

  const uniqueProducts = new Map<string, any>();

  for (const fileName of htmlFiles) {
    const filePath = path.join(VENDOR_HTML_DIR, fileName);
    const content = fs.readFileSync(filePath, "utf8");

    // Extract saved from url
    const urlMatch = content.substring(0, 500).match(/saved from url=\(\d+\)(.+?)(?:-->|\s|$)/);
    const sourceUrl = urlMatch ? urlMatch[1].trim() : "";

    const $ = cheerio.load(content);
    const cards = $(".pcard, .product-thumb");

    cards.each((_, el) => {
      const cardEl = $(el);
      const text = cardEl.text() || "";

      // Title
      const title =
        cardEl.find("a.pcard-img").attr("aria-label") ||
        cardEl.find("a.pcard-img").attr("title") ||
        cardEl.find(".pcard-title, h3, h2, a.pcard-name").text().trim() ||
        cardEl.find(".name a").text().trim() ||
        "";

      if (!title || title.length < 3) return;

      // Price: ₹ X,XXX
      let price = 0;
      const priceText =
        cardEl.find(".pcard-price, .pcard-price-row, .price").text().trim() || text;
      const priceMatch = priceText.match(/₹\s*([\d,]+)/);
      if (priceMatch) {
        price = parseFloat(priceMatch[1].replace(/,/g, ""));
      }
      if (price <= 0) return;

      // PID & Item Code
      let pid = "";
      let itemCode = "";
      const pidMatch = text.match(/PID:\s*([A-Za-z0-9]+?)(?=\s*Item|\s|<|$)/i);
      if (pidMatch) pid = pidMatch[1].toUpperCase();

      const itemCdMatch = text.match(/Item\s*CD:\s*([A-Za-z0-9]+)/i);
      if (itemCdMatch) itemCode = itemCdMatch[1].toUpperCase();

      const dedupKey = pid ? `PID:${pid}` : `TITLE:${title.toLowerCase()}`;
      if (uniqueProducts.has(dedupKey)) return;

      uniqueProducts.set(dedupKey, { pid, itemCode, title, price, sourceUrl, fileName });
    });
  }

  console.log(`Extracted ${uniqueProducts.size} unique products across all files.\n`);

  for (const item of Array.from(uniqueProducts.values())) {
    totalParsed++;

    // SUPREME INVARIANT: Catalog Sovereignty Check
    const existing =
      (item.pid ? catalogByPid.get(item.pid.toUpperCase()) : undefined) ||
      catalogByTitle.get(item.title.trim().toLowerCase());

    const classification = classifyCCTVProduct(
      item.title,
      item.sourceUrl,
      existing?.category,
      existing ? { isListedInInventory: true, inventoryCategory: existing.category, matchedId: existing.id } : undefined
    );

    const reverseGst = calculateReverseGST(item.price);
    if (!reverseGst.is_reconciled) allGSTReconciled = false;

    if (!classification.is_cctv_eligible) {
      totalNonCCTVRejected++;
      const reason = classification.rejection_reason || "General non-CCTV consumer item";
      rejectedReasons[reason] = (rejectedReasons[reason] || 0) + 1;
      continue;
    }

    totalCCTVEligible++;
    cctvByCategory[classification.category] = (cctvByCategory[classification.category] || 0) + 1;

    // Reconciliation against live catalog
    if (existing) {
      const currentPrice = existing.new_unit_price || existing.unit_price || existing.price || 0;
      const drift = analyzePriceDrift(currentPrice, item.price);

      if (drift.status === "NO_CHANGE") exactMatches++;
      else if (drift.status === "SAFE_AUTO_UPDATE") safeUpdates++;
      else if (drift.status === "HIGH_DRIFT_ADMIN_APPROVAL") highDriftAlerts++;
    } else {
      newCCTVProducts++;
    }
  }

  console.log("==========================================================");
  console.log("   CCTV DOMAIN CLASSIFICATION & RECONCILIATION SUMMARY    ");
  console.log("==========================================================");
  console.log(`Total Unique Products Evaluated   : ${totalParsed}`);
  console.log(`Genuine CCTV Hardware Identified  : ${totalCCTVEligible} (${Math.round((totalCCTVEligible / totalParsed) * 100)}%)`);
  console.log(`Non-CCTV Consumer Clutter Rejected: ${totalNonCCTVRejected} (${Math.round((totalNonCCTVRejected / totalParsed) * 100)}%)`);
  console.log(`Statutory GST ₹0.00 Reconciliation: ${allGSTReconciled ? "✅ PERFECT 100% (All Items)" : "❌ DRIFT"}\n`);

  console.log("--- CCTV Hardware by Subsystem Category ---");
  for (const [cat, count] of Object.entries(cctvByCategory)) {
    console.log(`  • ${cat.padEnd(16)} : ${count} SKUs`);
  }

  console.log("\n--- Rejected Non-CCTV Items by Root Cause ---");
  for (const [reason, count] of Object.entries(rejectedReasons)) {
    console.log(`  • [${count} SKUs] ${reason}`);
  }

  console.log("\n--- Catalog Parity & Drift Analysis ---");
  console.log(`  • Exact Catalog Matches (0% drift) : ${exactMatches}`);
  console.log(`  • Safe Updates (<= 5% drift)       : ${safeUpdates}`);
  console.log(`  • High Drift Alerts (> 5% drift)   : ${highDriftAlerts}`);
  console.log(`  • New CCTV Hardware Staged         : ${newCCTVProducts}`);
  console.log("==========================================================\n");
}

runBatchAudit()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
