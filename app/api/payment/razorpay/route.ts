import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, notes = {} } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return NextResponse.json(
        { success: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    // 1. Fetch Quote Server-Side (Zero Client Trust)
    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const quoteData = quoteSnap.data() as any;

    // 2. Prevent Double Payments
    if (quoteData.status === "PAID" || quoteData.payment_status === "captured") {
      return NextResponse.json(
        { success: false, error: "Quote has already been paid" },
        { status: 400 }
      );
    }

    // 3. Enforce Quote Expiration (e.g. 7 days)
    if (quoteData.validUntil) {
      const expiry = new Date(quoteData.validUntil).getTime();
      if (!isNaN(expiry) && Date.now() > expiry) {
        return NextResponse.json(
          { success: false, error: "Quote has expired and cannot be paid" },
          { status: 400 }
        );
      }
    }

    // 4. Compute Amount Authoritatively from Quote Snapshot
    const serverAmount = Number(
      quoteData.pricingSnapshot?.total_payable ??
      quoteData.total_payable ??
      quoteData.total ??
      0
    );

    if (isNaN(serverAmount) || serverAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid commercial total on quote snapshot" },
        { status: 400 }
      );
    }

    const { paymentType = "full" } = body;
    let chargeAmount = serverAmount;
    if (paymentType === "advance") {
      const advancePercent = Number(
        quoteData.advancePercent ??
        quoteData.advance_percent ??
        quoteData.pricingSnapshot?.advance_percent ??
        30
      );
      chargeAmount = Math.round(serverAmount * (advancePercent / 100));
    }

    if (isNaN(chargeAmount) || chargeAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid charge amount computed" },
        { status: 400 }
      );
    }

    // 5. Initialize Razorpay Gateway
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json(
        { success: false, error: "Payment gateway credentials not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(chargeAmount * 100), // Razorpay amount in paise
      currency: "INR",
      receipt: quoteId,
      notes: {
        ...notes,
        quote_id: quoteId,
        payment_type: paymentType,
        customer_name: quoteData.customer_name || "",
        customer_mobile: quoteData.customer_mobile || "",
      },
    };

    const order = await razorpay.orders.create(options);

    // 6. Bind Order ID and Expected Amount Back to the Quote Document
    await quoteRef.update({
      razorpay_order_id: order.id,
      razorpay_order_amount: chargeAmount,
      payment_type: paymentType,
      currency: "INR",
      payment_status: "ORDER_CREATED",
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      order,
      key_id, // Return public key for client SDK invocation
    });
  } catch (error: any) {
    console.error("[Razorpay Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}

