import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { createCashfreeOrder } from "@/lib/cashfree";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    // paymentType: "advance" | "full", paymentMethod: "all" | "emi"
    const { leadId, paymentType = "full", paymentMethod = "all" } = body;

    if (!leadId) {
      return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
    }

    // 1. Fetch Lead and Quote
    const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    const lead = leadDoc.data()!;

    const quoteRef = leadRef.collection(SUBCOLLECTIONS.QUOTES).doc(quoteId);
    const quoteDoc = await quoteRef.get();
    if (!quoteDoc.exists) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    const quote = quoteDoc.data()!;

    // 2. Create Cashfree Order
    let amount = quote.total_payable || 0;
    
    if (paymentType === "advance") {
      const advancePercent = quote.advance_percent || 30;
      amount = Math.round(amount * (advancePercent / 100));
    }

    const orderId = `order_${quoteId}_${Date.now()}`;

    const cfOrder = await createCashfreeOrder({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: leadId,
        customer_name: lead.customer_name,
        customer_email: lead.email || `${leadId}@customer.teamcctv.in`,
        customer_phone: lead.mobile_number,
      },
      order_meta: {
        return_url: `${request.nextUrl.origin}/quote/${leadId}/review/${quoteId}?status=payment_success`,
        notify_url: `${request.nextUrl.origin}/api/webhooks/cashfree`,
        payment_methods: paymentMethod === "emi" ? "emi" : undefined
      },
      order_tags: {
        lead_id: leadId,
        quote_id: quoteId
      }
    } as any);

    // 3. Log the attempt in Lead history or a new collection
    await leadRef.update({
      last_payment_attempt_id: orderId,
      updated_at: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      payment_session_id: cfOrder.payment_session_id,
      order_id: orderId 
    });
  } catch (err: any) {
    console.error("[Quote Accept API]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
