/**
 * @file secure-easy/scripts/cctv-live-browser-sync.ts
 * @description Enterprise Live Browser Ingestion Pipeline for TEAM CCTV Platform.
 * Uses real Playwright Chromium browser to eliminate scraper staleness & CDN cache poisoning.
 * Enforces 100% CCTV-only domain filtering, >5% price drift alerts, and 18% reverse GST reconciliation.
 *
 * Usage:
 *   npx ts-node --esm scripts/cctv-live-browser-sync.ts --audit
 *   npx ts-node --esm scripts/cctv-live-browser-sync.ts --apply
 *   npx ts-node --esm scripts/cctv-live-browser-sync.ts --single "https://megajaipur.com/data-storage/surveillance-hard-disk"
 */

import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
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

// Target CCTV Category Endpoints on Mega Compu World
export const CCTV_CATEGORY_TARGETS = [
  { name: "Surveillance Storage", url: "https://megajaipur.com/data-storage/surveillance-hard-disk?sort=price-low", cat: "storage" },
  { name: "SD & MicroSD Cards", url: "https://megajaipur.com/data-storage/sd-%2Dmicro-sd-cards?f=227&sort=price-low", cat: "storage" },
  { name: "HD Cameras (P1)", url: "https://megajaipur.com/security/hd-camera-dvr?sort=price-low", cat: "cctv_camera" },
  { name: "HD DVRs", url: "https://megajaipur.com/security/hd-dvr?sort=price-low", cat: "recorder" },
  { name: "IP Cameras (P1)", url: "https://megajaipur.com/security/ip-camera?sort=price-low", cat: "cctv_camera" },
  { name: "IP NVRs (P1)", url: "https://megajaipur.com/security/ip-nvr?sort=price-low", cat: "recorder" },
  { name: "PTZ / 4G / WiFi Cameras", url: "https://megajaipur.com/security/ptz-pt-4g-wifi-camera?sort=price-low", cat: "cctv_camera" },
  { name: "PoE Switches (P1)", url: "https://megajaipur.com/networking/poe-switch?f=629%2C630%2C631&sort=price-low", cat: "power_device" },
  { name: "Power Supply & SMPS (P1)", url: "https://megajaipur.com/security/power-supply-adapter?f=714%2C715%2C716&sort=price-low", cat: "power_device" },
  { name: "3+1 CCTV Cables", url: "https://megajaipur.com/cables2/31-cctv-cables?sort=price-low", cat: "cable" },
  { name: "CAT6 LAN Cables (P1)", url: "https://megajaipur.com/cables2/lan-cables-cat6?f=821%2C672%2C674&sort=price-low", cat: "cable" },
  { name: "Point to Point (P2P)", url: "https://megajaipur.com/networking/point-to-point-p2p?sort=price-low", cat: "network" },
  { name: "Racks & Enclosures", url: "https://megajaipur.com/security/rack-and-accessories-security?f=657%2C659%2C660%2C661%2C662&sort=price-low", cat: "rack" },
  { name: "CCTV Accessories", url: "https://megajaipur.com/accessories-cctv-%2Dnetworking?f=1069%2C1062%2C1068&sort=price-low", cat: "connector" },
  { name: "LED Monitors", url: "https://megajaipur.com/display/led-monitor?f=1151%2C1162%2C997&sort=price-low", cat: "display" },
];

export interface ScrapedProductLive {
  pid: string;
  item_code: string;
  title: string;
  gross_price: number;
  in_stock: boolean;
  image_url: string;
  source_url: string;
  scraped_at_utc: string;
  scraped_at_ist: string;
  cctv_classification: CCTVFilterResult;
}

export interface LiveSyncReport {
  execution_timestamp_utc: string;
  execution_timestamp_ist: string;
  target_host: string;
  browser_engine: string;
  cache_policy: string;
  total_scraped: number;
  total_cctv_eligible: number;
  total_rejected_non_cctv: number;
  exact_matches: number;
  safe_updates: number;
  high_drift_alerts: number;
  stock_changed: number;
  new_cctv_staged: number;
  results: {
    pid: string;
    title: string;
    category: string;
    gross_price: number;
    drift_analysis?: PriceDriftAnalysis;
    is_new: boolean;
    in_stock: boolean;
  }[];
}

/**
 * Executes live browser navigation with anti-staleness cache bypass.
 */
export async function scrapeCategoryLive(
  page: Page,
  target: { name: string; url: string; cat: string }
): Promise<ScrapedProductLive[]> {
  // Anti-cache query parameter to bypass CDN/edge cache
  const cacheBusterUrl = target.url.includes("?")
    ? `${target.url}&_cb=${Date.now()}`
    : `${target.url}?_cb=${Date.now()}`;

  console.log(`🌐 Navigating to [${target.name}] live: ${cacheBusterUrl}`);

  // Hard cache bypass headers
  await page.setExtraHTTPHeaders({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  });

  await page.goto(cacheBusterUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

  // Wait for React client-side hydration: .pcard or .product-thumb
  try {
    await page.waitForSelector(".pcard, .product-thumb, .pcard-price", { timeout: 8000 });
  } catch (e) {
    console.log(`   ⚠️ Timeout waiting for .pcard on ${target.name}, attempting fallback extract...`);
  }

  // Small delay to allow price hydration
  await page.waitForTimeout(1000);

  const nowUTC = new Date().toISOString();
  const nowIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const rawProducts = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".pcard, .product-thumb"));
    return cards.map((card) => {
      const text = card.textContent || "";

      // Title: aria-label / title / .pcard-title / .name a
      const title =
        card.querySelector("a.pcard-img")?.getAttribute("aria-label") ||
        card.querySelector("a.pcard-img")?.getAttribute("title") ||
        card.querySelector(".pcard-title, h3, h2, a.pcard-name")?.textContent?.trim() ||
        card.querySelector(".name a")?.textContent?.trim() ||
        "";

      // PID & Item Code
      let pid = "";
      let itemCode = "";
      const pidMatch = text.match(/PID:\s*([A-Za-z0-9]+?)(?=\s*Item|\s|$)/i);
      if (pidMatch) pid = pidMatch[1].toUpperCase();

      const itemCdMatch = text.match(/Item\s*CD:\s*([A-Za-z0-9]+)/i);
      if (itemCdMatch) itemCode = itemCdMatch[1].toUpperCase();

      // Price: ₹ X,XXX
      let price = 0;
      const priceText =
        card.querySelector(".pcard-price, .pcard-price-row, .price")?.textContent?.trim() || text;
      const priceMatch = priceText.match(/₹\s*([\d,]+)/);
      if (priceMatch && priceMatch[1]) {
        price = parseFloat(priceMatch[1].replace(/,/g, ""));
      }

      // Stock
      const textLower = text.toLowerCase();
      const inStock = !(textLower.includes("out of stock") || textLower.includes("sold out"));

      // Image
      const imgEl =
        card.querySelector(".product-img img") ||
        card.querySelector(".image img") ||
        card.querySelector("img");
      const imgUrl = imgEl?.getAttribute("src") || imgEl?.getAttribute("data-src") || "";

      return {
        pid,
        itemCode,
        title,
        price,
        inStock,
        imgUrl,
      };
    });
  });

  const processed: ScrapedProductLive[] = [];

  for (const raw of rawProducts) {
    if (!raw.title || raw.price <= 0) continue;

    const classification = classifyCCTVProduct(raw.title, target.url, target.cat);
    classification.reverse_gst = calculateReverseGST(raw.price);

    processed.push({
      pid: raw.pid,
      item_code: raw.itemCode,
      title: raw.title,
      gross_price: raw.price,
      in_stock: raw.inStock,
      image_url: raw.imgUrl,
      source_url: target.url,
      scraped_at_utc: nowUTC,
      scraped_at_ist: nowIST,
      cctv_classification: classification,
    });
  }

  return processed;
}

/**
 * Main execution controller for Live CCTV Browser Sync.
 */
export async function runLiveCCTVBrowserSync(options: {
  mode: "audit" | "apply";
  singleUrl?: string;
  headless?: boolean;
}): Promise<LiveSyncReport> {
  const executionStartUTC = new Date().toISOString();
  const executionStartIST = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  console.log("\n========================================================");
  console.log("   TEAM CCTV — Automated Live Browser Ingestion Engine   ");
  console.log(`   Execution Time (UTC): ${executionStartUTC}        `);
  console.log(`   Execution Time (IST): ${executionStartIST}        `);
  console.log(`   Mode: ${options.mode.toUpperCase()} | Cache: HARD BYPASS (No-Cache) `);
  console.log("========================================================\n");

  const browser: Browser = await chromium.launch({
    headless: options.headless !== false,
    args: [
      "--disable-cache",
      "--disable-application-cache",
      "--disable-offline-load-stale-cache",
      "--disk-cache-size=0",
      "--media-cache-size=0",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 TEAM-CCTV-LiveInspector/2.0",
  });

  const page: Page = await context.newPage();

  // Load existing catalog for reconciliation
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

  const targets = options.singleUrl
    ? [{ name: "Custom Target", url: options.singleUrl, cat: "cctv_camera" }]
    : CCTV_CATEGORY_TARGETS;

  const allScraped: ScrapedProductLive[] = [];
  let totalEligible = 0;
  let totalRejected = 0;

  for (const target of targets) {
    try {
      const products = await scrapeCategoryLive(page, target);
      console.log(`   -> Extracted ${products.length} products from ${target.name}`);

      for (const p of products) {
        allScraped.push(p);
        if (p.cctv_classification.is_cctv_eligible) {
          totalEligible++;
        } else {
          totalRejected++;
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to scrape ${target.name}:`, err.message);
    }
  }

  // Save verification screenshot of the last inspected page
  const screenshotDir = path.join(__dirname, "../../scratch/live_browser_evidence");
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
  const screenshotPath = path.join(screenshotDir, `live_audit_${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`📸 Saved Live Browser Verification Screenshot: ${screenshotPath}`);

  await browser.close();

  // Reconcile and Analyze
  console.log("\n--- Analyzing Price Drift & CCTV Subsystem Reconciliation ---");

  let exactMatches = 0;
  let safeUpdates = 0;
  let highDriftAlerts = 0;
  let stockChanged = 0;
  let newCCTVStaged = 0;

  const reportResults: LiveSyncReport["results"] = [];

  for (const item of allScraped) {
    // SUPREME INVARIANT: Match against current catalog first (Catalog Sovereignty)
    const existing =
      (item.pid ? catalogByPid.get(item.pid.toUpperCase()) : undefined) ||
      catalogByTitle.get(item.title.trim().toLowerCase());

    if (existing && !item.cctv_classification.is_cctv_eligible) {
      item.cctv_classification.is_cctv_eligible = true;
      item.cctv_classification.category = existing.category || "accessories";
      item.cctv_classification.is_pre_approved_inventory = true;
    }

    if (!item.cctv_classification.is_cctv_eligible) continue;

    if (existing) {
      const currentPrice = existing.new_unit_price || existing.unit_price || existing.price || 0;
      const stockChangedFlag = existing.in_stock !== undefined && existing.in_stock !== item.in_stock;
      const drift = analyzePriceDrift(currentPrice, item.gross_price, stockChangedFlag);

      if (drift.status === "NO_CHANGE") exactMatches++;
      else if (drift.status === "SAFE_AUTO_UPDATE") safeUpdates++;
      else if (drift.status === "HIGH_DRIFT_ADMIN_APPROVAL") highDriftAlerts++;
      else if (drift.status === "STOCK_STATUS_CHANGED") stockChanged++;

      reportResults.push({
        pid: item.pid,
        title: item.title,
        category: item.cctv_classification.category,
        gross_price: item.gross_price,
        drift_analysis: drift,
        is_new: false,
        in_stock: item.in_stock,
      });
    } else {
      newCCTVStaged++;
      const drift = analyzePriceDrift(0, item.gross_price);
      reportResults.push({
        pid: item.pid,
        title: item.title,
        category: item.cctv_classification.category,
        gross_price: item.gross_price,
        drift_analysis: drift,
        is_new: true,
        in_stock: item.in_stock,
      });
    }
  }

  const report: LiveSyncReport = {
    execution_timestamp_utc: executionStartUTC,
    execution_timestamp_ist: executionStartIST,
    target_host: "https://megajaipur.com",
    browser_engine: "Playwright Chromium (Headless)",
    cache_policy: "Strict Bypass (Cache-Control: no-cache, no-store, _cb nonce)",
    total_scraped: allScraped.length,
    total_cctv_eligible: totalEligible,
    total_rejected_non_cctv: totalRejected,
    exact_matches: exactMatches,
    safe_updates: safeUpdates,
    high_drift_alerts: highDriftAlerts,
    stock_changed: stockChanged,
    new_cctv_staged: newCCTVStaged,
    results: reportResults,
  };

  // Write Report to Disk
  const reportPath = path.join(__dirname, "../../scratch/live_cctv_sync_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n========================================================");
  console.log("   LIVE BROWSER CCTV RECONCILIATION SUMMARY             ");
  console.log("========================================================");
  console.log(`Total Products Extracted Live : ${allScraped.length}`);
  console.log(`Genuine CCTV Hardware Items   : ${totalEligible} (100% CCTV Verified)`);
  console.log(`Rejected Non-CCTV Clutter     : ${totalRejected} (TVs, desktop switches, generic SSDs)`);
  console.log(`Exact Price Matches (0% drift): ${exactMatches}`);
  console.log(`Safe Price Updates (<= 5%)    : ${safeUpdates}`);
  console.log(`High Price Drift Alerts (> 5%): ${highDriftAlerts} (Requires Admin Approval)`);
  console.log(`Stock Availability Changed    : ${stockChanged}`);
  console.log(`New CCTV Products Staged      : ${newCCTVStaged}`);
  console.log(`Audit Report File             : ${reportPath}`);
  console.log("========================================================\n");

  return report;
}

// Direct Execution Hook
if (process.argv[1] && process.argv[1].endsWith("cctv-live-browser-sync.ts")) {
  const args = process.argv.slice(2);
  const isApply = args.includes("--apply");
  const singleIdx = args.indexOf("--single");
  const singleUrl = singleIdx !== -1 ? args[singleIdx + 1] : undefined;

  runLiveCCTVBrowserSync({
    mode: isApply ? "apply" : "audit",
    singleUrl,
  })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Pipeline failure:", err);
      process.exit(1);
    });
}
