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

    return NextResponse.json({ success: true, quoteId, snapshot });
  } catch (error: any) {
    console.error("Quote save error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
