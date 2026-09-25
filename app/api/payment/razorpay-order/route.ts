import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, leadId, paymentType = "booking" } = await req.json();

    if (!quoteId) {
      return NextResponse.json({ success: false, error: "quoteId is required" }, { status: 400 });
    }

    let quoteRef = adminDb.collection("quotes").doc(quoteId);
    let quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists && leadId) {
       quoteRef = adminDb.collection("leads").doc(leadId).collection("quotes").doc(quoteId);
       quoteSnap = await quoteRef.get();
    }

    if (!quoteSnap.exists) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteSnap.data() as any;

    if (quoteData.status === "PAID" || quoteData.payment_status === "captured") {
      return NextResponse.json({ success: false, error: "Already paid" }, { status: 400 });
    }

    // Amount logic (Flat ₹500 for Advance booking)
    let chargeAmount = 500;
    if (paymentType === "delivery_90") {
      const totalPayable = quoteData.pricingSnapshot?.total_payable || quoteData.total_payable || 0;
      chargeAmount = Math.round((totalPayable - 500) * 0.90);
    } else if (paymentType === "installation_final") {
      const totalPayable = quoteData.pricingSnapshot?.total_payable || quoteData.total_payable || 0;
      chargeAmount = Math.round((totalPayable - 500) * 0.10);
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ success: false, error: "Razorpay credentials missing on server" }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    // Create the Order for UI Checkout
    const options = {
      amount: chargeAmount * 100, // paise
      currency: "INR",
      receipt: `rcpt_${quoteId.substring(0, 8)}_${Date.now()}`,
      notes: {
        quote_id: quoteId,
        lead_id: leadId,
        payment_type: paymentType
      }
    };

    const order = await razorpay.orders.create(options);

    await quoteRef.update({
      razorpay_order_id: order.id,
      razorpay_order_amount: chargeAmount,
      payment_type: paymentType,
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true, orderId: order.id, amount: options.amount, keyId: key_id });
  } catch (error: any) {
    console.error("[Razorpay UI Order Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
