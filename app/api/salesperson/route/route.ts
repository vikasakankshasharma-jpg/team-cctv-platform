import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { COLLECTIONS } from "@/lib/constants";
import { getPincodeCoordinates } from "@/lib/geo-utils";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch leads assigned to this salesperson, or recent active leads
    let leadsQuery = adminDb.collection(COLLECTIONS.LEADS).limit(100);

    const leadsSnap = await leadsQuery.get();
    const allLeads: any[] = [];

    leadsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const pincode = data.address?.pincode || data.billing_details?.pincode || "";
      const defaultCoords = pincode ? getPincodeCoordinates(pincode) : null;
      const coords = data.address?.coordinates || data.billing_details?.coordinates || defaultCoords;

      allLeads.push({
        id: doc.id,
        customer_name: data.customer_name || data.billing_details?.customer_name || "Customer",
        mobile_number: data.mobile_number || data.phone || data.billing_details?.phone || "",
        property_type: data.property_type || "Residential",
        budget: data.budget || "Standard",
        camera_count: data.camera_count || 4,
        status: data.status || "new",
        scheduled_date: data.scheduled_date || data.survey_date,
        time_slot: data.time_slot || "morning",
        route_order: data.route_order,
        address: data.address || {
          street: data.billing_details?.address_line1,
          city: data.billing_details?.city || "Jaipur",
          pincode: pincode,
        },
        coordinates: coords,
        map_url: data.address?.map_url || (coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null),
      });
    });

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
    console.error("[Salesperson Route GET Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, leadId, scheduledDate, timeSlot, routeOrder, reorderedStops, status } = body;

    if (action === "reorder" && Array.isArray(reorderedStops)) {
      const batch = adminDb.batch();
      reorderedStops.forEach((stop: any) => {
        const ref = adminDb.collection(COLLECTIONS.LEADS).doc(stop.id);
        batch.update(ref, {
          route_order: stop.route_order,
          time_slot: stop.time_slot,
          updated_at: serverTimestamp(),
        });
      });
      await batch.commit();
      return NextResponse.json({ success: true, message: "Client visits reordered successfully" });
    }

    if (action === "schedule" && leadId && scheduledDate) {
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      await leadRef.update({
        scheduled_date: scheduledDate,
        time_slot: timeSlot || "morning",
        route_order: routeOrder || 1,
        status: status || "site_visit",
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: "Visit scheduled" });
    }

    if (action === "unschedule" && leadId) {
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      await leadRef.update({
        scheduled_date: null,
        time_slot: null,
        route_order: null,
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: "Visit unscheduled" });
    }

    if (action === "update_status" && leadId && status) {
      const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
      await leadRef.update({
        status: status,
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: `Status updated to ${status}` });
    }

    return NextResponse.json({ success: false, error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("[Salesperson Route POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
