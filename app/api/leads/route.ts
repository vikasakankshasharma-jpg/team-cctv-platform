import { NextResponse, NextRequest } from "next/server";
import { CreateLeadSchema } from "@/lib/validators";
import { adminDb, arrayUnion, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { routeLeadToFranchise, incrementFranchiseLeadCount } from "@/lib/lead-router";

export async function POST(request: NextRequest) {
  const { success } = rateLimit(request);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateLeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const leadData = validation.data;
    let promoterId: string | null = null;
    const discountApplied = 0;

    // Validate referral code if provided
    if (leadData.referral_code) {
      const promotersSnapshot = await adminDb
        .collection("promoters")
        .where("referral_code", "==", leadData.referral_code)
        .where("is_active", "==", true)
        .limit(1)
        .get();

      if (!promotersSnapshot.empty) {
        const promoterDoc = promotersSnapshot.docs[0];
        promoterId = promoterDoc.id;
        // The actual discount logic application happens during quote generation,
        // but we can store the snapshot value. We'll leave it as 0 here and update during quote.
      }
    }

    // ── Franchise Lead Routing ────────────────────────────────────────────────
    // Extract location from wizard_answers — customer fills pincode/city during wizard.
    // Keys checked in priority order to support any wizard schema.
    const wizardAnswers = (leadData.wizard_answers || {}) as Record<string, unknown>;
    const pincode = String(wizardAnswers?.q_pincode || wizardAnswers?.pincode || "");
    const city    = String(wizardAnswers?.q_city    || wizardAnswers?.city    || "");
    const state   = String(wizardAnswers?.q_state   || wizardAnswers?.state   || "");

    const routing = await routeLeadToFranchise(pincode, city, state);

    // Determine if hot lead (cabling already done = near-ready customer)
    const isHotLead = leadData.cabling_done === true;

    // Create the lead document
    const newLeadRef = adminDb.collection("leads").doc();

    await newLeadRef.set({
      customer_name:        leadData.customer_name,
      mobile_number:        leadData.mobile_number,
      firebase_uid:         leadData.firebase_uid,
      status:               "new",
      promoter_id:          promoterId,
      referral_code_used:   leadData.referral_code || null,
      discount_applied:     discountApplied,
      wizard_answers:       leadData.wizard_answers,
      property_type:        leadData.property_type,
      technology_choice:    leadData.technology_choice,
      cabling_done:         leadData.cabling_done,
      is_hot_lead:          isHotLead,

      // Franchise routing — auto-set at creation time
      franchise_dealer_id:   routing.franchise_dealer_id,
      franchise_dealer_name: routing.franchise_dealer_name,
      franchise_match_type:  routing.match_type,   // "pincode"|"zone"|"city"|"state"|"internal"

      created_at:        serverTimestamp(),
      updated_at:        serverTimestamp(),
      follow_up_notes:   arrayUnion("Lead created via website wizard"),
      is_deleted:        false,
      deleted_at:        null,
    });

    // Increment franchise lead counter — fire-and-forget, never blocks response
    if (routing.franchise_dealer_id) {
      incrementFranchiseLeadCount(routing.franchise_dealer_id).catch((err) =>
        console.error("[Leads API] Counter increment failed:", err)
      );
    }

    return NextResponse.json(
      { id: newLeadRef.id, message: "Lead created successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
