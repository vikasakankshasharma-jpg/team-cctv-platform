import { NextRequest } from "next/server";
import { CreateLeadSchema } from "@/lib/validators";
import { adminDb, arrayUnion, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { routeLeadToFranchise, incrementFranchiseLeadCount } from "@/lib/lead-router";
import { ApiResponse } from "@/lib/api-response";

/**
 * ENTERPRISE LEAD INGESTION
 * Handles lead creation, referral validation, and territory-based load balancing.
 */
export async function POST(request: NextRequest) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await request.json();

    // 1. Validate request body
    const validation = CreateLeadSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest("Lead validation failed", validation.error.format());
    }

    const leadData = validation.data;
    let promoterId: string | null = null;

    // 2. Validate referral code if provided
    if (leadData.referral_code) {
      const promotersSnapshot = await adminDb
        .collection("promoters")
        .where("referral_code", "==", leadData.referral_code)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (!promotersSnapshot.empty) {
        promoterId = promotersSnapshot.docs[0].id;
      }
    }

    // 3. ENTERPRISE LOAD BALANCING & ROUTING
    const wizardAnswers = (leadData.wizard_answers || {}) as Record<string, unknown>;
    const pincode = String(wizardAnswers?.q_pincode || wizardAnswers?.pincode || "");
    const city    = String(wizardAnswers?.q_city    || wizardAnswers?.city    || "");
    const state   = String(wizardAnswers?.q_state   || wizardAnswers?.state   || "");

    const routing = await routeLeadToFranchise(pincode, city, state);

    // 4. Create Lead Document
    const newLeadRef = adminDb.collection("leads").doc();
    const isHotLead = leadData.cabling_done === true;

    await newLeadRef.set({
      customer_name:        leadData.customer_name,
      mobile_number:        leadData.mobile_number,
      firebase_uid:         leadData.firebase_uid,
      status:               "new",
      promoter_id:          promoterId,
      referral_code_used:   leadData.referral_code || null,
      wizard_answers:       leadData.wizard_answers,
      property_type:        leadData.property_type,
      technology_choice:    leadData.technology_choice,
      cabling_done:         leadData.cabling_done,
      is_hot_lead:          isHotLead,

      // Franchise load-balanced routing
      franchise_dealer_id:   routing.franchise_dealer_id,
      franchise_dealer_name: routing.franchise_dealer_name,
      franchise_match_type:  routing.match_type,

      created_at:        serverTimestamp(),
      updated_at:        serverTimestamp(),
      follow_up_notes:   arrayUnion("Lead ingested via enterprise router"),
      is_deleted:        false,
    });

    // 5. Update Franchise Counters (Async)
    if (routing.franchise_dealer_id) {
      incrementFranchiseLeadCount(routing.franchise_dealer_id).catch((err) =>
        console.error("[Leads API] Counter increment failed:", err)
      );
    }

    return ApiResponse.success({ 
      id: newLeadRef.id, 
      message: "Lead created and routed successfully" 
    }, 201);

  } catch (error: any) {
    console.error("Critical error in lead ingestion:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
