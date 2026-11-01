import { NextResponse } from "next/server";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { calculateInactivityAging } from "@/lib/inactivity-tracker";
import { verifySession } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { entity_type, entity_id, touchpoint_type, notes, coordinates } = body;

    if (!entity_type || !entity_id || !touchpoint_type) {
      return NextResponse.json(
        { success: false, error: "entity_type, entity_id, and touchpoint_type are required" },
        { status: 400 }
      );
    }

    const collectionName = entity_type === "promoter" ? "promoters" : "leads";
    const docRef = adminDb.collection(collectionName).doc(entity_id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json(
        { success: false, error: `${entity_type} with ID ${entity_id} not found` },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      last_contacted_at: nowIso,
      updated_at: serverTimestamp(),
    };

    let logMessage = "";
    if (touchpoint_type === "whatsapp") {
      updatePayload.last_whatsapp_at = nowIso;
      logMessage = `💬 WhatsApp chat initiated by ${session.role || "staff"}`;
    } else if (touchpoint_type === "call") {
      updatePayload.last_called_at = nowIso;
      logMessage = `📞 Phone call initiated by ${session.role || "staff"}`;
    } else if (touchpoint_type === "visit_checkin") {
      updatePayload.last_visited_at = nowIso;
      updatePayload.checkin_at = nowIso;
      updatePayload.checkin_notes = notes || null;
      if (coordinates) {
        updatePayload.checkin_coordinates = coordinates;
      }
      logMessage = `📍 On-site visit checked-in by ${session.role || "staff"}${notes ? `: ${notes}` : ""}`;
    } else {
      updatePayload.last_contacted_at = nowIso;
      logMessage = `Touchpoint logged: ${touchpoint_type}${notes ? ` - ${notes}` : ""}`;
    }

    if (notes && touchpoint_type !== "visit_checkin") {
      logMessage += ` (Note: ${notes})`;
    }

    updatePayload.follow_up_notes = arrayUnion(`[${new Date().toLocaleDateString("en-IN")}] ${logMessage}`);

    await docRef.update(updatePayload);

    const aging = calculateInactivityAging(nowIso, 14);

    return NextResponse.json({
      success: true,
      message: `Touchpoint '${touchpoint_type}' logged successfully`,
      entity_type,
      entity_id,
      timestamp: nowIso,
      aging,
    });
  } catch (error: any) {
    console.error("[Touchpoint API Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
