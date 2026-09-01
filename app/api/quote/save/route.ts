import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { QuoteSnapshot } from "@/types";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      customer_mobile, 
      customer_name, 
      requirementSnapshot, 
      configurationSnapshot, 
      pricingSnapshot, 
      selectedPlan,
      parentQuoteId,
      source
    } = data;

    if (!customer_mobile || !requirementSnapshot || !configurationSnapshot || !pricingSnapshot || !selectedPlan) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Generate a human-readable Quote ID like QT-2026-00124
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const quoteId = parentQuoteId || `QT-${year}-${randomSuffix}`;
    
    // Determine version
    let version = 1;
    if (parentQuoteId) {
       const parentDoc = await adminDb.collection("quotes").doc(parentQuoteId).get();
       if (parentDoc.exists) {
           version = (parentDoc.data()?.version || 1) + 1;
       }
    }

    // Set validity (e.g., 7 days from now)
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 7);

    const snapshot: QuoteSnapshot = {
      id: quoteId,
      customer_mobile,
      customer_name: customer_name || "",
      requirementSnapshot,
      configurationSnapshot,
      pricingSnapshot,
      selectedPlan,
      source: source || "wizard",
      status: "GENERATED",
      version,
      parentQuoteId: parentQuoteId || null,
      createdAt: new Date().toISOString(),
      validUntil: validUntilDate.toISOString()
    };

    // Save to Firebase (Immutable save)
    await adminDb.collection("quotes").doc(quoteId).set({
        ...snapshot,
        _serverCreatedAt: serverTimestamp(),
    });

    // ---------------------------------------------------------
    // CRITICAL FIX: Also capture the quote in the leads collection
    // ---------------------------------------------------------
    if (!parentQuoteId) {
      try {
        const leadsRef = adminDb.collection("leads");
        // Try to find if a lead already exists for this mobile number
        const existingLeadSnap = await leadsRef.where("mobile_number", "==", customer_mobile).limit(1).get();
        
        let leadId;
        if (!existingLeadSnap.empty) {
          leadId = existingLeadSnap.docs[0].id;
          await leadsRef.doc(leadId).update({
            updated_at: serverTimestamp(),
            latest_quote_id: quoteId,
            wizard_answers: requirementSnapshot,
            status: "new"
          });
        } else {
          const newLeadRef = leadsRef.doc();
          leadId = newLeadRef.id;
          await newLeadRef.set({
            id: leadId,
            customer_name: customer_name || "Unknown User",
            mobile_number: customer_mobile,
            property_type: requirementSnapshot.property_type || "home",
            technology_choice: requirementSnapshot.technology_preference || "HD",
            cabling_done: false, // Default assumption
            wizard_answers: requirementSnapshot,
            latest_quote_id: quoteId,
            status: "new",
            source: source || "wizard",
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Failed to capture lead in quotes save route:", err);
      }
    }

    return NextResponse.json({ success: true, quoteId, snapshot });
  } catch (error: any) {
    console.error("Quote save error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
