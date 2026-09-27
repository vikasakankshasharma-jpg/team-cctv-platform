import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { getPincodeCoordinates } from "@/lib/geo-utils";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || (session.role !== "operations_manager" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch active active jobs for today (from leads and quotes)
    // To keep it simple for the dispatch map, we pull all leads that are scheduled for today, en route, or on site.
    const leadsSnap = await adminDb.collection("leads")
      .where("scheduled_date", "==", todayStr)
      .get();

    const quotesSnap = await adminDb.collection("quotes")
      .where("delivery_scheduled_date", "==", todayStr)
      .get();

    const dispatchMarkers: any[] = [];

    // Parse leads (Installations / Surveys)
    leadsSnap.docs.forEach((doc) => {
      const data = doc.data();
      const pincode = data.address?.pincode || data.billing_details?.pincode || "";
      const defaultCoords = pincode ? getPincodeCoordinates(pincode) : null;
      const coords = data.address?.coordinates || defaultCoords;

      if (coords) {
        dispatchMarkers.push({
          id: doc.id,
          type: "service",
          status: data.status || "scheduled",
          title: data.customer_name || "Customer",
          agent_id: data.assigned_installer_id || data.assigned_salesperson_id || "Unassigned",
          time_slot: data.time_slot || "morning",
          coordinates: coords,
        });
      }
    });

    // Parse quotes (Deliveries)
    quotesSnap.docs.forEach((doc) => {
      const data = doc.data();
      const coords = data.shipping_address?.coordinates;

      if (coords) {
        dispatchMarkers.push({
          id: doc.id,
          type: "delivery",
          status: data.delivery_status || "scheduled",
          title: data.customer_name || "Delivery",
          agent_id: data.assigned_delivery_agent || "Unassigned",
          time_slot: data.delivery_time_slot || "morning",
          coordinates: coords,
        });
      }
    });

    // Fetch agents (mock live locations based on their assigned stops)
    // Normally we'd track live lat/lng in a `agent_locations` collection.
    // For now we just return the markers.

    return NextResponse.json({
      success: true,
      markers: dispatchMarkers,
    });
  } catch (error: any) {
    console.error("Dispatch map fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
