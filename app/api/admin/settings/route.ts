import { verifySession } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";

/**
 * GET: Fetch global settings.
 */
export async function GET(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});

  try {
    const doc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
    return NextResponse.json({ success: true, settings: doc.data() || {} });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

/**
 * PATCH: Update global settings with audit logging.
 */
export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  try {
    const updates = await req.json();
    const { ip, ua } = getRequestMetadata(req);

    const docRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID);
    await docRef.update({
      ...updates,
      updated_at: new Date()
    });

    // Log the action
    await createAuditLog({
      action: "SETTINGS_UPDATE",
      actor_id: session.user?.uid || "system",
      actor_email: session.user?.email || "unknown",
      resource_id: SETTINGS_DOC_ID,
      resource_type: "settings",
      metadata: { updated_keys: Object.keys(updates) },
      ip_address: ip,
      user_agent: ua
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
