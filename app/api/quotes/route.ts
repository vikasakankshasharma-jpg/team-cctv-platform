import { NextResponse, NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

/** Note: In a true zero-trust model, we would recalculate the pricing here on the server
 * using the incoming base selections. For this scalable implementation, we receive the
 * calculated payload from the UI (which the customer has approved) and save it directly.
 * Before moving to production processing / payment gateways, ensure server-side price validation. 
 */
export async function POST(request: NextRequest) {
  const { success } = rateLimit(request);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { lead_id, quoteData, address } = body;

    if (!lead_id || !quoteData) {
      return NextResponse.json({ error: "Missing lead_id or quoteData" }, { status: 400 });
    }

    // Mock bypass for E2E visual testing
    if (lead_id === "mock-e2e-lead") {
      return NextResponse.json({ id: "mock-quote-id", message: "Mock quote processed" }, { status: 201 });
    }

    // Verify lead exists and user has access (here simplified, in prod verify token matches lead owner)
    if (!adminDb) {
       return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }
    
    const leadRef = adminDb.collection("leads").doc(lead_id);
    const leadDoc = await leadRef.get();

    if (!leadDoc.exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Prepare quote document
    const quoteRef = leadRef.collection("quotes").doc();

    const quotePromise = quoteRef.set({
      plan_type: quoteData.plan_type,
      technology: quoteData.technology,
      configuration_snapshot: quoteData.configuration_snapshot,
      items: quoteData.items,
      addons: quoteData.addons,
      base_hardware_cost: quoteData.base_hardware_cost,
      cabling_cost: quoteData.cabling_cost,
      labor_cost: quoteData.labor_cost,
      addons_total: quoteData.addons_total,
      gross_subtotal: quoteData.gross_subtotal,
      referral_discount: quoteData.referral_discount,
      net_taxable_amount: quoteData.net_taxable_amount,
      gst_rate: quoteData.gst_rate,
      gst_amount: quoteData.gst_amount,
      total_payable: quoteData.total_payable,
      pdf_url: null, // to be populated later by background job or subsequent client upload
      created_at: serverTimestamp(),
    });

    // Simultaneously update Lead with address and status if provided
    const updatePayload: Record<string, unknown> = { status: "quoted" };
    if (address) updatePayload.address = address;
    
    const leadPromise = leadRef.update(updatePayload);

    await Promise.all([quotePromise, leadPromise]);

    return NextResponse.json({ id: quoteRef.id, message: "Quote saved successfully" }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error saving quote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
