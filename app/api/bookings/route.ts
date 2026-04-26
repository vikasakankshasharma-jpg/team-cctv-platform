import { NextResponse, NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { success } = rateLimit(request);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { lead_id, address, quote_id } = body;

    if (!lead_id || !address) {
      return NextResponse.json({ error: "Missing lead_id or address" }, { status: 400 });
    }

    // Mock bypass for E2E visual/logic testing
    if (lead_id === "mock-e2e-lead" || lead_id === "mock-lead") {
      return NextResponse.json({ id: "mock-booking-id", message: "Booking confirmed (Mock)" }, { status: 201 });
    }

    if (!adminDb) {
       return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Prepare booking document in a top-level 'bookings' collection
    const bookingRef = adminDb.collection("bookings").doc();
    
    await bookingRef.set({
      lead_id,
      quote_id,
      address,
      status: "pending",
      created_at: new Date()
    });

    // Also update the lead status to 'contacted' or 'quoted' if needed
    await adminDb.collection("leads").doc(lead_id).update({
      address,
      status: "quoted"
    });

    return NextResponse.json({ id: bookingRef.id, message: "Site visit booked successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
