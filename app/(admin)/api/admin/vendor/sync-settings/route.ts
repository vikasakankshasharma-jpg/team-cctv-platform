/**
 * @file secure-easy/app/(admin)/api/admin/vendor/sync-settings/route.ts
 * @description Admin API to view and customize automated vendor sync schedule & preferences.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { VendorSyncSettings } from "@/types";

const DEFAULT_SETTINGS: VendorSyncSettings = {
  enabled: false, // Default is paused until admin explicitly turns it on
  frequency: "weekly",
  schedule_time: "03:00",
  schedule_day_of_week: 0, // Sunday
  drift_threshold_percent: 5,
  auto_apply_safe_updates: true,
  dismissed_vendor_pids: [],
  dismissed_product_titles: [],
  notify_on_high_drift: true,
};

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
    }

    const doc = await adminDb.collection("settings").doc("vendor_sync").get();
    const settings = doc.exists ? (doc.data() as VendorSyncSettings) : DEFAULT_SETTINGS;

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
    }

    const body = await req.json();
    const currentDoc = await adminDb.collection("settings").doc("vendor_sync").get();
    const currentData = currentDoc.exists ? (currentDoc.data() as VendorSyncSettings) : DEFAULT_SETTINGS;

    const updatedSettings: VendorSyncSettings = {
      ...currentData,
      enabled: typeof body.enabled === "boolean" ? body.enabled : currentData.enabled,
      frequency: body.frequency || currentData.frequency,
      schedule_time: body.schedule_time || currentData.schedule_time,
      schedule_day_of_week: typeof body.schedule_day_of_week === "number" ? body.schedule_day_of_week : currentData.schedule_day_of_week,
      drift_threshold_percent: typeof body.drift_threshold_percent === "number" ? body.drift_threshold_percent : currentData.drift_threshold_percent,
      auto_apply_safe_updates: typeof body.auto_apply_safe_updates === "boolean" ? body.auto_apply_safe_updates : currentData.auto_apply_safe_updates,
      notification_email: body.notification_email ?? currentData.notification_email,
      notify_on_high_drift: typeof body.notify_on_high_drift === "boolean" ? body.notify_on_high_drift : currentData.notify_on_high_drift,
    };

    await adminDb.collection("settings").doc("vendor_sync").set(updatedSettings, { merge: true });

    return NextResponse.json({
      success: true,
      message: updatedSettings.enabled
        ? `Automated vendor sync is ACTIVE (${updatedSettings.frequency.toUpperCase()} at ${updatedSettings.schedule_time} IST)`
        : "Automated vendor sync is PAUSED (OFF).",
      settings: updatedSettings,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
