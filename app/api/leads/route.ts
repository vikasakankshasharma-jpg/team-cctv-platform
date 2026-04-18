import { NextResponse } from "next/server";
import { CreateLeadSchema } from "@/lib/validators";
import { adminDb, arrayUnion, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(request: Request) {
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
    let discountApplied = 0;

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

    // Determine if hot lead
    const isHotLead = leadData.cabling_done === true;

    // Create the lead document
    const newLeadRef = adminDb.collection("leads").doc();
    
    await newLeadRef.set({
      customer_name: leadData.customer_name,
      mobile: leadData.mobile,
      firebase_uid: leadData.firebase_uid,
      status: "new",
      promoter_id: promoterId,
      referral_code_used: leadData.referral_code || null,
      discount_applied: discountApplied,
      wizard_answers: leadData.wizard_answers,
      property_type: leadData.property_type,
      technology_choice: leadData.technology_choice,
      cabling_done: leadData.cabling_done,
      is_hot_lead: isHotLead,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      follow_up_notes: arrayUnion("Lead created via website wizard"),
      is_deleted: false,
      deleted_at: null
    });

    return NextResponse.json({ id: newLeadRef.id, message: "Lead created successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
