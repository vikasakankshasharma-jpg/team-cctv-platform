import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { COLLECTIONS } from "@/lib/constants";
import { getPincodeCoordinates } from "@/lib/geo-utils";

export async function GET(req: Request) {
  try {
    const session = await verifyInstallerSession();
    if (!session.isAuthenticated || !session.installerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch leads assigned to this installer
    const leadsSnap = await adminDb
      .collection(COLLECTIONS.LEADS)
      .where("assigned_to_installer_id", "==", session.installerId)
      .limit(150)
      .get();

    const allLeads: any[] = [];
    leadsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const pincode = data.address?.pincode || data.billing_details?.pincode || "";
      const defaultCoords = pincode ? getPincodeCoordinates(pincode) : null;
      const coords = data.address?.coordinates || data.billing_details?.coordinates || defaultCoords;

      allLeads.push({
        id: doc.id,
        ...data,
        coordinates: coords,
        map_url: data.address?.map_url || (coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null),
      });
    });

    // Separate into scheduled for this date vs unscheduled / pending pool
    const scheduledStops = allLeads
      .filter((l) => l.scheduled_date === selectedDate)
      .sort((a, b) => (Number(a.route_order) || 999) - (Number(b.route_order) || 999));

    const pendingPool = allLeads.filter(
      (l) => l.scheduled_date !== selectedDate && l.status !== "won" && l.status !== "lost"
    );

    return NextResponse.json({
      success: true,
      selectedDate,
      scheduledStops,
      pendingPool,
    });
  } catch (error: any) {
    console.error("[Installer Route GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifyInstallerSession();
    if (!session.isAuthenticated || !session.installerId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, leadId, scheduledDate, timeSlot, routeOrder, reorderedStops } = body;

    const batch = adminDb.batch();

    if (action === "reorder" && Array.isArray(reorderedStops)) {
      // Batch update the route sequence
      reorderedStops.forEach((stop: { id: string; route_order: number; time_slot?: string }) => {
        const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(stop.id);
        batch.update(leadRef, {
          route_order: stop.route_order,
          ...(stop.time_slot ? { time_slot: stop.time_slot } : {}),
          updated_at: serverTimestamp(),
        });
      });

      await batch.commit();
      return NextResponse.json({ success: true, message: "Route reordered successfully" });
    }

    if (action === "schedule" && leadId && scheduledDate) {
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      await leadRef.update({
        scheduled_date: scheduledDate,
        time_slot: timeSlot || "morning",
        route_order: Number(routeOrder) || 1,
        updated_at: serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: "Stop scheduled successfully" });
    }

    if (action === "unschedule" && leadId) {
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      await leadRef.update({
        scheduled_date: null,
        time_slot: null,
        route_order: null,
        updated_at: serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: "Stop moved back to pending pool" });
    }

    return NextResponse.json({ success: false, error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("[Installer Route POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
