import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, leadId, notes = {} } = body;

    if (!quoteId || typeof quoteId !== "string") {
      return NextResponse.json(
        { success: false, error: "quoteId is required" },
        { status: 400 }
      );
    }

    let quoteRef = adminDb.collection("quotes").doc(quoteId);
    let quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists && leadId) {
       quoteRef = adminDb.collection("leads").doc(leadId).collection("quotes").doc(quoteId);
       quoteSnap = await quoteRef.get();
    }

    if (!quoteSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const quoteData = quoteSnap.data() as any;

    // 2. Prevent Double Payments (but allow BOOKED quotes to pay delivery/installation stages)
    if (quoteData.status === "PAID" || quoteData.payment_status === "captured" || quoteData.payment_status === "paid") {
      return NextResponse.json(
        { success: false, error: "Quote has already been fully paid" },
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
    
    if (paymentType === "full_discount" || paymentType === "full_discounted") {
      // 2% discount on full upfront payment
      chargeAmount = Math.round(serverAmount * 0.98);
    } else if (paymentType === "advance" || paymentType === "advance_500" || paymentType === "advance_500_cod") {
      chargeAmount = 500;
    } else if (paymentType === "delivery_90") {
      // 90% of remaining balance after ₹500 booking
      const remaining = serverAmount - 500;
      chargeAmount = Math.round(remaining * 0.90);
    } else if (paymentType === "installation_final") {
      // Final 10% of remaining balance after ₹500 booking
      const remaining = serverAmount - 500;
      chargeAmount = Math.round(remaining * 0.10);
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

    let customerMobile = notes.customer_phone || quoteData.customer_mobile || quoteData.customer?.phone || "+919876543210";
    const cleanMobile = customerMobile.replace(/[^0-9+]/g, "");
    if (cleanMobile.length === 10) {
      customerMobile = `+91${cleanMobile}`;
    }

    const paymentLinkOptions = {
      amount: Math.round(chargeAmount * 100), // paise
      currency: "INR",
      accept_partial: false,
      description: `Security System Installation (${paymentType === "advance" ? "Advance Booking" : "Full Payment"})`,
      customer: {
        name: quoteData.customer_name || quoteData.customer?.name || "Customer",
        contact: customerMobile,
        email: quoteData.customer_email || quoteData.customer?.email || "customer@example.com"
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        ...notes,
        quote_id: quoteId,
        payment_type: paymentType,
        lead_id: leadId,
      },
      callback_url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://cctvquotation.com"}/payment-success?quoteId=${quoteId}`,
      callback_method: "get"
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    await quoteRef.update({
      razorpay_payment_link_id: paymentLink.id,
      razorpay_order_amount: chargeAmount,
      payment_type: paymentType,
      currency: "INR",
      payment_status: "PAYMENT_LINK_CREATED",
      updated_at: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      payment_url: paymentLink.short_url,
    });
  } catch (error: any) {
    console.error("[Razorpay Order Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create payment order", razorpayError: error },
      { status: 500 }
    );
  }
}

