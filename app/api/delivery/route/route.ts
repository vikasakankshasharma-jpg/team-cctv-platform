import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { getPincodeCoordinates } from "@/lib/geo-utils";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    // Allow delivery staff, installers, sales staff, and admins
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Fetch quotes that are ready for delivery or dispatched
    const quotesSnap = await adminDb
      .collection("quotes")
      .where("delivery_status", "in", ["ASSIGNED", "DISPATCHED", "PENDING_DELIVERY", "DELIVERED", "SCHEDULED"])
      .limit(100)
      .get();

    // Fallback if none found with delivery_status: fetch BOOKED quotes with COD
    let allQuotesDocs = quotesSnap.docs;
    if (allQuotesDocs.length === 0) {
      const bookedSnap = await adminDb
        .collection("quotes")
        .where("status", "in", ["BOOKED", "CONFIRMED", "PAID"])
        .limit(50)
        .get();
      allQuotesDocs = bookedSnap.docs;
    }

    const deliveryJobs: any[] = [];
    allQuotesDocs.forEach((doc) => {
      const data = doc.data();
      const pincode = data.address?.pincode || data.billing_details?.pincode || "";
      const defaultCoords = pincode ? getPincodeCoordinates(pincode) : null;
      const coords = data.address?.coordinates || data.billing_details?.coordinates || defaultCoords;

      const totalPayable = data.pricingSnapshot?.total_payable || data.total_payable || 0;
      const amountPaid = data.amount_paid || data.booking_amount || 0;
      const balanceDue = Math.max(0, totalPayable - amountPaid);

      // Summarize hardware items
      const items = (data.hardware_cart || []).map((i: any) => `${i.quantity}x ${i.title || i.name}`).join(", ") || "CCTV Package";

      deliveryJobs.push({
        id: doc.id,
        quote_id: data.quote_id || doc.id,
        customer_name: data.customer_name || data.billing_details?.customer_name || "Customer",
        mobile_number: data.customer_mobile || data.billing_details?.phone || "",
        address: data.address || {
          street: data.billing_details?.address_line1,
          city: data.billing_details?.city || "Jaipur",
          pincode: pincode,
        },
        items_summary: items,
        total_payable: totalPayable,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        payment_preference: data.payment_preference || "cash_on_delivery",
        delivery_status: data.delivery_status || "DISPATCHED",
        delivery_otp: data.delivery_otp,
        delivery_token: data.delivery_token,
        scheduled_date: data.scheduled_delivery_date || data.scheduled_date,
        time_slot: data.delivery_time_slot || data.time_slot || "morning",
        route_order: data.delivery_route_order || data.route_order,
        coordinates: coords,
        map_url: data.address?.map_url || (coords ? `https://maps.google.com/?q=${coords.lat},${coords.lng}` : null),
      });
    });

    const scheduledStops = deliveryJobs
      .filter((j) => j.scheduled_date === selectedDate)
      .sort((a, b) => (Number(a.route_order) || 999) - (Number(b.route_order) || 999));

    const pendingPool = deliveryJobs.filter(
      (j) => j.scheduled_date !== selectedDate && j.delivery_status !== "DELIVERED"
    );

    return NextResponse.json({
      success: true,
      selectedDate,
      scheduledStops,
      pendingPool,
    });
  } catch (error: any) {
    console.error("[Delivery Route GET Error]:", error);
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
    const { action, quoteId, scheduledDate, timeSlot, routeOrder, reorderedStops, status } = body;

    if (action === "reorder" && Array.isArray(reorderedStops)) {
      const batch = adminDb.batch();
      reorderedStops.forEach((stop: any) => {
        const ref = adminDb.collection("quotes").doc(stop.id);
        batch.update(ref, {
          delivery_route_order: stop.route_order,
          route_order: stop.route_order,
          delivery_time_slot: stop.time_slot,
          updated_at: serverTimestamp(),
        });
      });
      await batch.commit();
      return NextResponse.json({ success: true, message: "Delivery route reordered successfully" });
    }

    if (action === "schedule" && quoteId && scheduledDate) {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      await quoteRef.update({
        scheduled_delivery_date: scheduledDate,
        scheduled_date: scheduledDate,
        delivery_time_slot: timeSlot || "morning",
        time_slot: timeSlot || "morning",
        delivery_route_order: routeOrder || 1,
        route_order: routeOrder || 1,
        delivery_status: "SCHEDULED",
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: "Delivery job scheduled" });
    }

    if (action === "unschedule" && quoteId) {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      await quoteRef.update({
        scheduled_delivery_date: null,
        scheduled_date: null,
        delivery_time_slot: null,
        delivery_route_order: null,
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: "Delivery unscheduled" });
    }

    if (action === "update_status" && quoteId && status) {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      await quoteRef.update({
        delivery_status: status,
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: `Status updated to ${status}` });
    }

    return NextResponse.json({ success: false, error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("[Delivery Route POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
