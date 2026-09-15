import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import { COLLECTIONS } from "@/lib/constants";

/**
 * ENTERPRISE BOOKING SYSTEM
 * Handles site visit scheduling with ownership verification and audit logging.
 */
export async function POST(request: NextRequest) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await request.json();
    const { lead_id, address, quote_id, firebase_uid } = body;

    if (!lead_id || !address) {
      return ApiResponse.badRequest("Missing lead_id or address");
    }


    if (!adminDb) {
       return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    // 1. Ownership & Existence Verification
    const leadRef = adminDb.collection("leads").doc(lead_id);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }
    
    const leadData = leadDoc.data();
    if (firebase_uid && leadData?.firebase_uid !== firebase_uid) {
      return ApiResponse.forbidden("You do not have permission to book for this lead.");
    }

    // 2. Extract detailed visit data
    const { 
      preferred_date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
      time_slot = "10:00 AM - 01:00 PM", 
      special_notes = "",
      customer_name = leadData?.customer_name || "Customer",
      customer_mobile = leadData?.mobile_number || ""
    } = body;

    // 3. Persist Booking in site_visit_bookings
    const isTestBooking = customer_mobile === "9999999999" || customer_name.toLowerCase().includes("e2e test");
    const bookingRef = adminDb.collection(COLLECTIONS.SITE_VISIT_BOOKINGS).doc();
    const bookingData = {
      id: bookingRef.id,
      lead_id,
      quote_id: quote_id || null,
      address,
      customer_name,
      customer_mobile,
      preferred_date,
      time_slot,
      special_notes,
      status: "pending",
      created_at: serverTimestamp(),
      is_test: isTestBooking,
      ttl: isTestBooking ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
    };
    const bookingPromise = bookingRef.set(bookingData);

    // 4. Update Lead to site_visit stage
    const leadPromise = leadRef.update({
      address: typeof address === "string" ? { full_address: address, pincode: leadData?.address?.pincode || "302001" } : address,
      status: "site_visit",
      site_visit_date: preferred_date,
      site_visit_slot: time_slot,
      last_booking_id: bookingRef.id,
      updated_at: serverTimestamp()
    });

    // 5. Create Survey Job for dispatch
    const jobId = `SURVEY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const jobRef = adminDb.collection("jobs").doc(jobId);
    const jobPromise = jobRef.set({
      id: jobId,
      lead_id,
      quote_id: quote_id || null,
      booking_id: bookingRef.id,
      type: "survey",
      status: "PENDING_DISPATCH",
      customer: {
        name: customer_name,
        mobile: customer_mobile,
      },
      address: typeof address === "string" ? { full_address: address, pincode: leadData?.address?.pincode || "302001" } : address,
      scheduled_at: preferred_date,
      time_slot: time_slot,
      special_notes: special_notes,
      created_at: new Date().toISOString(),
      server_created_at: serverTimestamp(),
    });

    await Promise.all([bookingPromise, leadPromise, jobPromise]);

    // 4. Audit Log
    const { ip, ua } = getRequestMetadata(request);
    await createAuditLog({
      action: "LEAD_UPDATE", // Booking is a lead-stage update
      actor_id: firebase_uid || "guest",
      resource_id: lead_id,
      resource_type: "lead",
      ip_address: ip,
      user_agent: ua,
      metadata: { action: "SITE_VISIT_BOOKED", booking_id: bookingRef.id }
    });

    return ApiResponse.success({ 
      id: bookingRef.id, 
      message: "Site visit booked successfully" 
    }, 201);

  } catch (error: any) {
    console.error("Critical error in bookings API:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
