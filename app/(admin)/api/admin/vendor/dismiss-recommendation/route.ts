/**
 * @file secure-easy/app/(admin)/api/admin/vendor/dismiss-recommendation/route.ts
 * @description Admin API to dismiss a vendor product recommendation permanently.
 * Adds the Vendor PID / Title to the blacklist and removes it from staging.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
    }

    const { stagedId, vendorProductId, title, action } = await req.json();

    if (!vendorProductId && !title) {
      return NextResponse.json({ success: false, error: "Missing vendorProductId or title" }, { status: 400 });
    }

    const batch = adminDb.batch();
    const settingsRef = adminDb.collection("settings").doc("vendor_sync");

    if (action === "restore") {
      const updates: any = {};
      if (vendorProductId) {
        updates.dismissed_vendor_pids = FieldValue.arrayRemove(vendorProductId.toUpperCase());
      }
      if (title) {
        updates.dismissed_product_titles = FieldValue.arrayRemove(title.trim().toLowerCase());
      }
      batch.set(settingsRef, updates, { merge: true });
      await batch.commit();

      return NextResponse.json({
        success: true,
        message: `Product [${vendorProductId || title}] restored to recommendation consideration.`,
      });
    }

    // Default: Dismiss and add to Blacklist
    const updates: any = {};
    if (vendorProductId) {
      updates.dismissed_vendor_pids = FieldValue.arrayUnion(vendorProductId.toUpperCase());
    }
    if (title) {
      updates.dismissed_product_titles = FieldValue.arrayUnion(title.trim().toLowerCase());
    }
    batch.set(settingsRef, updates, { merge: true });

    // 2. Remove or mark dismissed in staged_products
    if (stagedId) {
      const stagedRef = adminDb.collection("staged_products").doc(stagedId);
      batch.delete(stagedRef);
    } else if (vendorProductId) {
      const stagedDocs = await adminDb
        .collection("staged_products")
        .where("vendor_product_id", "==", vendorProductId)
        .get();
      stagedDocs.forEach((d) => batch.delete(d.ref));
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Product [${vendorProductId || title}] dismissed permanently. It will never be recommended again in future auto-sync runs.`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
