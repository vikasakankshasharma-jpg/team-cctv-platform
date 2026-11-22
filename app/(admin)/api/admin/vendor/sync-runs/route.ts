/**
 * @file secure-easy/app/(admin)/api/admin/vendor/sync-runs/route.ts
 * @description Admin API to view past sync run history, updated items, unchanged items, and recommendations.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    if (!adminDb) {
      return NextResponse.json({ success: false, error: "Database not initialized" }, { status: 500 });
    }

    const snapshot = await adminDb
      .collection("vendor_sync_runs")
      .orderBy("started_at", "desc")
      .limit(15)
      .get();

    const runs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json({ success: true, runs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
