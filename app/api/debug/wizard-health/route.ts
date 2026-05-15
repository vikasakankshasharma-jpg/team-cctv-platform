/**
 * @file app/api/debug/wizard-health/route.ts
 * @description Production health-check endpoint.
 *   GET /api/debug/wizard-health
 *   Returns Firebase connection status, wizard_steps count, products count.
 *   Protected by a simple header token to avoid public exposure.
 */

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  // Simple protection: require ?token=health123 or X-Debug-Token header
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || request.headers.get("x-debug-token");
  if (token !== "teamcctv-health-check") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      node_env: process.env.NODE_ENV,
      firebase_project_id: process.env.FIREBASE_PROJECT_ID || "MISSING",
      firebase_client_email_set: !!process.env.FIREBASE_CLIENT_EMAIL,
      firebase_private_key_set: !!process.env.FIREBASE_PRIVATE_KEY,
      firebase_private_key_length: process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
    },
  };

  // Test 1: wizard_steps collection
  try {
    const wizSnap = await adminDb.collection("wizard_steps").limit(100).get();
    results.wizard_steps = {
      status: "ok",
      total_docs: wizSnap.size,
      is_empty: wizSnap.empty,
      doc_ids: wizSnap.docs.map((d) => d.id),
    };
  } catch (err: unknown) {
    const e = err as Error;
    results.wizard_steps = { status: "error", message: e.message };
  }

  // Test 2: products collection
  try {
    const [camSnap, recSnap, accSnap] = await Promise.all([
      adminDb.collection("products").where("category", "==", "camera").where("is_active", "==", true).get(),
      adminDb.collection("products").where("category", "==", "recorder").where("is_active", "==", true).get(),
      adminDb.collection("products").where("category", "==", "accessory").where("is_active", "==", true).get(),
    ]);
    const allCctv = [...camSnap.docs, ...recSnap.docs, ...accSnap.docs];
    results.products = {
      status: "ok",
      cameras: camSnap.size,
      recorders: recSnap.size,
      accessories: accSnap.size,
      total_cctv_products: allCctv.length,
      brands: [...new Set(allCctv.map((d) => d.data().brand))],
      camera_techs: [...new Set(camSnap.docs.map((d) => d.data().technology))],
    };
  } catch (err: unknown) {
    const e = err as Error;
    results.products = { status: "error", message: e.message };
  }

  // Test 3: settings doc
  try {
    const settingsSnap = await adminDb.collection("settings").doc("app_config").get();
    results.settings = {
      status: "ok",
      exists: settingsSnap.exists,
      fields: settingsSnap.exists ? Object.keys(settingsSnap.data() || {}) : [],
    };
  } catch (err: unknown) {
    const e = err as Error;
    results.settings = { status: "error", message: e.message };
  }

  // Overall status
  const allOk =
    (results.wizard_steps as Record<string, unknown>)?.status === "ok" &&
    (results.products as Record<string, unknown>)?.status === "ok";

  return NextResponse.json(
    { overall: allOk ? "healthy" : "degraded", ...results },
    { status: allOk ? 200 : 503 }
  );
}
