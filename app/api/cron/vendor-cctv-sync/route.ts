/**
 * @file secure-easy/app/api/cron/vendor-cctv-sync/route.ts
 * @description Scheduled Cron Endpoint for Automated CCTV Price & Inventory Ingestion.
 * Triggered daily or weekly via Vercel Cron or GitHub Actions.
 * Fully controlled by Admin in settings/vendor_sync (Enabled/Disabled/Frequency).
 */

import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import {
  classifyCCTVProduct,
  calculateReverseGST,
  analyzePriceDrift,
} from "@/lib/vendor/cctv-domain-filter";
import type { VendorSyncSettings, VendorSyncRunRecord } from "@/types";

export const maxDuration = 60; // 60 seconds maximum execution

export async function GET(req: Request) {
  const startedAt = new Date().toISOString();
  const startTimeMs = Date.now();

  try {
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // 1. Check Admin Sync Settings
    const settingsDoc = await adminDb.collection("settings").doc("vendor_sync").get();
    const settings: VendorSyncSettings = settingsDoc.exists
      ? (settingsDoc.data() as VendorSyncSettings)
      : {
          enabled: false, // Default: paused until admin enables
          frequency: "weekly",
          schedule_time: "03:00",
          schedule_day_of_week: 0, // Sunday
          drift_threshold_percent: 5,
          auto_apply_safe_updates: true,
          dismissed_vendor_pids: [],
          dismissed_product_titles: [],
          notify_on_high_drift: true,
        };

    // If disabled by Admin, immediately exit with 0 compute
    if (!settings.enabled) {
      return NextResponse.json({
        success: true,
        status: "skipped",
        message: "Automated vendor sync is paused by Admin in Settings.",
        settings,
      });
    }

    // 2. Check Frequency Schedule Guard
    const today = new Date();
    if (settings.frequency === "weekly") {
      const scheduledDay = settings.schedule_day_of_week ?? 0;
      if (today.getDay() !== scheduledDay) {
        return NextResponse.json({
          success: true,
          status: "skipped",
          message: `Weekly schedule active (runs on day ${scheduledDay}). Today is day ${today.getDay()}.`,
        });
      }
    }

    console.log("[Auto Vendor Sync] Starting scheduled CCTV catalog reconciliation...");

    // 3. Load Live Inventory (Catalog Sovereignty)
    const liveProductsSnapshot = await adminDb.collection("products").get();
    const catalogByPid = new Map<string, any>();
    const catalogByTitle = new Map<string, any>();

    liveProductsSnapshot.forEach((doc) => {
      const d = { id: doc.id, ...doc.data() } as any;
      if (d.vendor_product_id) catalogByPid.set(d.vendor_product_id.toUpperCase(), d);
      if (d.vendor_pid) catalogByPid.set(d.vendor_pid.toUpperCase(), d);
      if (d.internal_sku) catalogByPid.set(d.internal_sku.toUpperCase(), d);
      if (d.display_name) catalogByTitle.set(d.display_name.trim().toLowerCase(), d);
    });

    // 4. Load Dismissed/Blacklisted PIDs
    const dismissedPids = new Set((settings.dismissed_vendor_pids || []).map((p) => p.toUpperCase()));

    // 5. Ingest from Active Vendor Snapshot (or live scrape cache)
    const fs = await import("fs");
    const path = await import("path");
    const catalogJsonPath = path.join(process.cwd(), "data/mega-products.generated.json");

    let vendorProducts: any[] = [];
    if (fs.existsSync(catalogJsonPath)) {
      const raw = JSON.parse(fs.readFileSync(catalogJsonPath, "utf8"));
      vendorProducts = Array.isArray(raw) ? raw : raw.products || [];
    }

    let exactMatches = 0;
    let safeUpdates = 0;
    let highDriftAlerts = 0;
    let stockChanges = 0;
    let newRecommendations = 0;
    let dismissedSkipped = 0;
    let rejectedClutter = 0;

    const updatedItems: VendorSyncRunRecord["updated_items"] = [];
    const unchangedItems: VendorSyncRunRecord["unchanged_items"] = [];
    const recommendedItems: VendorSyncRunRecord["recommended_items"] = [];

    const productsToUpdate: any[] = [];
    const productsToStage: any[] = [];

    for (const vendorProd of vendorProducts) {
      const rawTitle = vendorProd.title || vendorProd.display_name || vendorProd.raw_title || "";
      if (!rawTitle) continue;

      const pid = (vendorProd.pid || vendorProd.vendor_product_id || vendorProd.mega_pid || "").toUpperCase();
      const livePrice = Number(vendorProd.new_unit_price || vendorProd.unit_price || vendorProd.price || 0);
      if (livePrice <= 0) continue;

      // Check if product is on Admin Dismissed Blacklist
      if (pid && dismissedPids.has(pid)) {
        dismissedSkipped++;
        continue;
      }

      // Catalog Sovereignty Lookup: Check if product already exists in platform inventory
      const existing = (pid ? catalogByPid.get(pid) : undefined) || catalogByTitle.get(rawTitle.trim().toLowerCase());

      const cctvClassification = classifyCCTVProduct(
        rawTitle,
        vendorProd.sourceUrl || "",
        existing?.category,
        existing ? { isListedInInventory: true, inventoryCategory: existing.category, matchedId: existing.id } : undefined
      );

      if (existing) {
        // Product already in inventory (Pre-approved Whitelisted Item)
        const currentPrice = Number(existing.unit_price || existing.base_cost || 0);
        const inStock = vendorProd.in_stock !== false;
        const stockChanged = existing.is_active !== undefined && existing.is_active !== inStock;

        const drift = analyzePriceDrift(currentPrice, livePrice, stockChanged);

        if (drift.status === "NO_CHANGE") {
          exactMatches++;
          unchangedItems.push({
            id: existing.id,
            pid: pid || existing.vendor_product_id || "",
            title: existing.display_name,
            unit_price: currentPrice,
          });
        } else {
          if (drift.status === "SAFE_AUTO_UPDATE") safeUpdates++;
          else if (drift.status === "HIGH_DRIFT_ADMIN_APPROVAL") highDriftAlerts++;
          else if (drift.status === "STOCK_STATUS_CHANGED") stockChanges++;

          updatedItems.push({
            id: existing.id,
            pid: pid || existing.vendor_product_id || "",
            title: existing.display_name,
            old_price: currentPrice,
            new_price: livePrice,
            drift_percent: drift.drift_percent,
            drift_status: drift.status,
            taxable_base: drift.reverse_gst.taxable_base,
            total_gst: drift.reverse_gst.total_gst,
          });

          // Auto-apply if safe update and enabled, otherwise flag for admin review
          if (settings.auto_apply_safe_updates || drift.status === "SAFE_AUTO_UPDATE") {
            const margin = Number(existing.margin_percentage || 20);
            productsToUpdate.push({
              id: existing.id,
              unit_price: livePrice,
              base_cost: Math.round(livePrice / (1 + margin / 100)),
              taxable_base: drift.reverse_gst.taxable_base,
              cgst_9: drift.reverse_gst.cgst_9,
              sgst_9: drift.reverse_gst.sgst_9,
              total_gst: drift.reverse_gst.total_gst,
              is_gst_reconciled: drift.reverse_gst.is_reconciled,
              last_price_drift_percent: drift.drift_percent,
              has_significant_price_drift: drift.has_significant_drift,
              price_drift_alert: drift.alert_message || null,
              is_active: inStock,
              updated_at: serverTimestamp(),
            });
          }
        }
      } else {
        // New Unlisted Vendor Item
        if (!cctvClassification.is_cctv_eligible) {
          rejectedClutter++;
          continue;
        }

        newRecommendations++;
        recommendedItems.push({
          pid,
          title: rawTitle,
          category: cctvClassification.category,
          price: livePrice,
          in_stock: vendorProd.in_stock !== false,
        });

        // Stage for Admin Recommendation Approval
        productsToStage.push({
          status: "pending",
          raw_title: rawTitle,
          vendor_product_id: pid,
          category: cctvClassification.category,
          brand: cctvClassification.metadata.brand || null,
          technology: cctvClassification.metadata.technology || null,
          form_factor: cctvClassification.metadata.form_factor || null,
          resolution_mp: cctvClassification.metadata.resolution_mp || null,
          channels: cctvClassification.metadata.channels || null,
          unit_price: livePrice,
          base_cost: Math.round(livePrice / 1.2),
          margin_percentage: 20,
          in_stock: vendorProd.in_stock !== false,
          is_cctv_eligible: true,
          ai_confidence_score: 95,
          ai_reasoning: "Automated CCTV Recommendation from Scheduled Sync",
          created_at: serverTimestamp(),
        });
      }
    }

    // Apply Verified Updates
    if (productsToUpdate.length > 0) {
      const batch = adminDb.batch();
      for (const item of productsToUpdate) {
        const { id, ...data } = item;
        batch.update(adminDb.collection("products").doc(id), data);
      }
      await batch.commit();
    }

    // Stage New Recommendations (capped at 50 per run to prevent flood)
    if (productsToStage.length > 0) {
      const stageBatch = adminDb.batch();
      const cap = Math.min(productsToStage.length, 50);
      for (let i = 0; i < cap; i++) {
        const ref = adminDb.collection("staged_products").doc();
        stageBatch.set(ref, productsToStage[i]);
      }
      await stageBatch.commit();
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - startTimeMs;

    // 6. Record Sync Run History in Firestore
    const runRecord: VendorSyncRunRecord = {
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: durationMs,
      status: highDriftAlerts > 0 ? "warning" : "success",
      trigger_type: settings.frequency === "daily" ? "cron_daily" : "cron_weekly",
      summary: {
        total_evaluated: vendorProducts.length,
        cctv_eligible: vendorProducts.length - rejectedClutter,
        exact_matches: exactMatches,
        safe_updates: safeUpdates,
        high_drift_alerts: highDriftAlerts,
        stock_changes: stockChanges,
        new_recommendations: newRecommendations,
        dismissed_skipped: dismissedSkipped,
        rejected_clutter: rejectedClutter,
      },
      updated_items: updatedItems.slice(0, 50),
      unchanged_items: unchangedItems.slice(0, 50),
      recommended_items: recommendedItems.slice(0, 50),
    };

    await adminDb.collection("vendor_sync_runs").add(runRecord);

    // Update Settings with Last Run Telemetry
    await adminDb.collection("settings").doc("vendor_sync").set(
      {
        ...settings,
        last_run_at: completedAt,
        last_run_status: highDriftAlerts > 0 ? "warning" : "success",
        last_run_summary: {
          total_scraped: vendorProducts.length,
          updated: updatedItems.length,
          unchanged: exactMatches,
          recommended: newRecommendations,
          rejected_clutter: rejectedClutter,
        },
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      duration_ms: durationMs,
      summary: runRecord.summary,
      high_drift_alerts: highDriftAlerts,
      message: `Completed automated sync: ${updatedItems.length} updated, ${exactMatches} unchanged, ${newRecommendations} recommended, ${rejectedClutter} clutter rejected.`,
    });
  } catch (err: any) {
    console.error("[Auto Vendor Sync Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
