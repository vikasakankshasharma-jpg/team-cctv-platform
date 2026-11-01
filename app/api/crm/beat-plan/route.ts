import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { getPincodeCoordinates } from "@/lib/geo-utils";
import { calculateInactivityAging, getLatestTouchpointDate } from "@/lib/inactivity-tracker";
import { optimizeRouteWithTimeWindows, buildGoogleMapsMultiStopUrl, LatLng } from "@/lib/routing/optimizer";
import type { BeatStop } from "@/types";

export async function GET(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const salespersonId = searchParams.get("salesperson_id") || (session.role === "sales_staff" ? session.uid : null);

    // Fetch Leads and Promoters concurrently
    const [leadsSnap, promotersSnap] = await Promise.all([
      adminDb.collection("leads").limit(100).get(),
      adminDb.collection("promoters").limit(100).get(),
    ]);

    const allStops: BeatStop[] = [];

    // 1. Process Customer Leads
    leadsSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.is_test || data.is_deleted) return;

      const pincode = String(data.detected_pincode || data.address?.pincode || data.billing_details?.pincode || "");
      const coords = data.address?.coordinates || data.billing_details?.coordinates || (pincode ? getPincodeCoordinates(pincode) : null);
      
      const lastTouch = getLatestTouchpointDate({
        last_visited_at: data.last_visited_at,
        last_called_at: data.last_called_at,
        last_whatsapp_at: data.last_whatsapp_at,
        last_contacted_at: data.last_contacted_at,
        created_at: data.created_at,
      });

      const aging = calculateInactivityAging(lastTouch, 10); // 10 days target for customer leads
      const scheduledDate = data.scheduled_visit_date || data.scheduled_date || (data.site_visit_date ? String(data.site_visit_date).split("T")[0] : null);

      allStops.push({
        id: doc.id,
        entity_type: "lead",
        title: data.customer_name || data.billing_details?.customer_name || "Customer Lead",
        subtitle: `${data.camera_count || 4} Cameras • ${data.technology_choice || "HD"} • ₹${Number(data.total_payable || 0).toLocaleString("en-IN")}`,
        business_name: data.company_name || null,
        mobile_number: data.mobile_number || data.phone || data.billing_details?.phone || "",
        address: {
          street: data.address?.street || data.billing_details?.address_line1 || "",
          locality: data.locality || data.address?.locality || "",
          city: data.detected_city || data.address?.city || "Jaipur",
          pincode: pincode,
          full_address: data.address?.full_address || `${data.detected_city || "Jaipur"} ${pincode}`.trim(),
        },
        coordinates: coords,
        scheduled_date: scheduledDate || "",
        time_slot: data.scheduled_visit_slot || data.time_slot || "morning",
        route_order: Number(data.route_order) || 999,
        status: data.status || "new",
        urgency: data.timeline || "asap",
        priority: data.priority || "HOT",
        total_value: Number(data.total_payable || 0),
        last_visited_at: data.last_visited_at || null,
        last_called_at: data.last_called_at || null,
        last_whatsapp_at: data.last_whatsapp_at || null,
        last_contacted_at: lastTouch,
        days_since_last_visit: data.last_visited_at ? calculateInactivityAging(data.last_visited_at).days_inactive : null,
        days_since_last_contact: aging.days_inactive,
        health_status: aging.health,
        checkin_notes: data.checkin_notes || null,
        checkin_at: data.checkin_at || null,
      });
    });

    // 2. Process B2B Promoters (Channel Partners)
    promotersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.is_active === false) return;

      const pincode = String(data.address?.pincode || "");
      const coords = data.coordinates || (pincode ? getPincodeCoordinates(pincode) : null);

      const lastTouch = getLatestTouchpointDate({
        last_visited_at: data.last_visited_at,
        last_called_at: data.last_called_at,
        last_whatsapp_at: data.last_whatsapp_at,
        last_contacted_at: data.last_contacted_at,
        created_at: data.created_at,
      });

      const targetFrequency = Number(data.visit_frequency_days) || 14;
      const aging = calculateInactivityAging(lastTouch, targetFrequency);
      const scheduledDate = data.scheduled_visit_date || (data.scheduled_date ? String(data.scheduled_date).split("T")[0] : null);

      allStops.push({
        id: doc.id,
        entity_type: "b2b_partner",
        title: data.name || "B2B Partner",
        subtitle: `🤝 Code: ${data.referral_code} • Won: ${data.total_won_leads || 0} • ₹${Number(data.total_ex_tax_business || 0).toLocaleString("en-IN")}`,
        business_name: data.business_name || "Partner Firm",
        mobile_number: data.mobile_number || "",
        address: {
          street: data.address?.street || "",
          locality: data.address?.locality || "",
          city: data.address?.city || "Jaipur",
          pincode: pincode,
          full_address: data.address?.full_address || `${data.business_name || ""} ${pincode}`.trim(),
        },
        coordinates: coords,
        scheduled_date: scheduledDate || "",
        time_slot: data.scheduled_visit_slot || "afternoon",
        route_order: Number(data.route_order) || 999,
        status: "active",
        priority: aging.is_overdue ? "HOT" : "WARM",
        total_value: Number(data.total_ex_tax_business || 0),
        last_visited_at: data.last_visited_at || null,
        last_called_at: data.last_called_at || null,
        last_whatsapp_at: data.last_whatsapp_at || null,
        last_contacted_at: lastTouch,
        days_since_last_visit: data.last_visited_at ? calculateInactivityAging(data.last_visited_at).days_inactive : null,
        days_since_last_contact: aging.days_inactive,
        health_status: aging.health,
        checkin_notes: data.checkin_notes || null,
        checkin_at: data.checkin_at || null,
      });
    });

    // Partition into Today's Scheduled Stops and Overdue/Unscheduled Backlog
    const scheduledStops = allStops
      .filter((s) => s.scheduled_date === selectedDate)
      .sort((a, b) => a.route_order - b.route_order);

    const overdueBacklog = allStops
      .filter((s) => s.scheduled_date !== selectedDate && (s.health_status === "overdue" || s.health_status === "never" || (s.days_since_last_contact ?? 0) >= 14))
      .sort((a, b) => (b.days_since_last_contact ?? 999) - (a.days_since_last_contact ?? 999));

    const nearbyB2BPartners = allStops
      .filter((s) => s.entity_type === "b2b_partner" && s.scheduled_date !== selectedDate);

    // Calculate metrics
    const googleNavigationUrl = buildGoogleMapsMultiStopUrl(scheduledStops);

    return NextResponse.json({
      success: true,
      selectedDate,
      summary: {
        total_stops: scheduledStops.length,
        leads_count: scheduledStops.filter((s) => s.entity_type === "lead").length,
        partners_count: scheduledStops.filter((s) => s.entity_type === "b2b_partner").length,
        overdue_backlog_count: overdueBacklog.length,
        total_pipeline_value: scheduledStops.reduce((sum, s) => sum + (s.total_value || 0), 0),
        googleNavigationUrl,
      },
      scheduledStops,
      overdueBacklog,
      nearbyB2BPartners,
    });
  } catch (error: any) {
    console.error("[Beat Plan GET Error]:", error);
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
    const { action } = body;

    // 1. Schedule a Lead or B2B Partner to a Beat Date & Slot
    if (action === "schedule") {
      const { entity_type, entity_id, scheduled_date, time_slot, route_order } = body;
      if (!entity_type || !entity_id || !scheduled_date) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }

      const collectionName = entity_type === "b2b_partner" || entity_type === "promoter" ? "promoters" : "leads";
      const docRef = adminDb.collection(collectionName).doc(entity_id);

      await docRef.update({
        scheduled_visit_date: scheduled_date,
        scheduled_visit_slot: time_slot || "morning",
        route_order: Number(route_order) || 1,
        updated_at: serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: "Stop scheduled in Beat Plan" });
    }

    // 2. Remove from schedule (return to backlog)
    if (action === "unschedule") {
      const { entity_type, entity_id } = body;
      const collectionName = entity_type === "b2b_partner" || entity_type === "promoter" ? "promoters" : "leads";
      await adminDb.collection(collectionName).doc(entity_id).update({
        scheduled_visit_date: null,
        scheduled_visit_slot: null,
        route_order: 999,
        updated_at: serverTimestamp(),
      });
      return NextResponse.json({ success: true, message: "Stop returned to backlog" });
    }

    // 3. Reorder Stops
    if (action === "reorder") {
      const { reorderedStops } = body;
      if (!Array.isArray(reorderedStops)) {
        return NextResponse.json({ success: false, error: "reorderedStops array required" }, { status: 400 });
      }

      const batch = adminDb.batch();
      reorderedStops.forEach((stop: BeatStop, idx: number) => {
        const col = stop.entity_type === "b2b_partner" ? "promoters" : "leads";
        const ref = adminDb.collection(col).doc(stop.id);
        batch.update(ref, {
          route_order: idx + 1,
          scheduled_visit_slot: stop.time_slot || "morning",
          updated_at: serverTimestamp(),
        });
      });
      await batch.commit();
      return NextResponse.json({ success: true, message: "Beat route reordered successfully" });
    }

    // 4. Auto-Optimize Route (TSP with Time Windows)
    if (action === "auto_optimize") {
      const { stops, origin } = body;
      if (!Array.isArray(stops)) {
        return NextResponse.json({ success: false, error: "stops array required" }, { status: 400 });
      }

      const result = optimizeRouteWithTimeWindows(stops, origin);
      const batch = adminDb.batch();

      result.optimizedStops.forEach((stop: BeatStop) => {
        const col = stop.entity_type === "b2b_partner" ? "promoters" : "leads";
        const ref = adminDb.collection(col).doc(stop.id);
        batch.update(ref, {
          route_order: stop.route_order,
          updated_at: serverTimestamp(),
        });
      });
      await batch.commit();

      return NextResponse.json({
        success: true,
        message: "Beat Plan optimized with shortest round trip",
        result,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Beat Plan POST Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
