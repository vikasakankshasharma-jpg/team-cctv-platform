import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { verifyWebhookSignature } from "@/lib/cashfree";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-webhook-signature") || "";
    
    // 1. Verify Signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.type;

    console.log(`[Cashfree Webhook] Received ${eventType}`, payload);

    // 2. Handle Payment Success (Customer EMI)
    if (eventType === "PAYMENT_SUCCESS_WEBHOOK") {
      const { order_id, payment_amount } = payload.data.order;
      const { lead_id, quote_id } = payload.data.order.order_tags || {};

      if (lead_id) {
        const leadRef = adminDb.collection(COLLECTIONS.LEADS).doc(lead_id);
        
        // Update Lead status to won
        await leadRef.update({
          status: "won",
          payment_status: "paid",
          paid_amount: payment_amount,
          quote_accepted_id: quote_id,
          updated_at: serverTimestamp()
        });

        // Trigger Commission Logic if routed to a dealer
        const leadDoc = await leadRef.get();
        const dealerId = leadDoc.data()?.franchise_dealer_id;
        
        if (dealerId) {
          await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
            total_leads_won: increment(1),
            total_ex_tax_business: increment(payment_amount / 1.18), // Rough estimate
            updated_at: serverTimestamp()
          });

          // Create Commission Record
          await adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).add({
            lead_id,
            dealer_id: dealerId,
            amount: payment_amount * 0.05, // 5% commission example
            status: "pending",
            created_at: serverTimestamp()
          });
        }
      }
    }

    // 3. Handle Subscription Status Change (Franchise Fee)
    if (eventType === "SUBSCRIPTION_STATUS_CHANGE_WEBHOOK") {
      const { subscription_id, status } = payload.data.subscription;
      const dealerId = payload.data.subscription.customer_details?.customer_id;

      if (dealerId) {
        await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).update({
          subscription_status: status,
          is_active: status === "ACTIVE",
          updated_at: serverTimestamp()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Cashfree Webhook Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
