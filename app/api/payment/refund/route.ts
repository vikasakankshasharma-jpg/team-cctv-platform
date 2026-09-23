import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, paymentId, amount, reason } = body;

    if (!quoteId || !amount || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    const quoteData = quoteSnap.data() as any;
    
    // Determine the razorpay payment id. Fallback to passed paymentId if not stored
    const rzpPaymentId = quoteData.razorpay_payment_id || paymentId;

    if (!rzpPaymentId) {
       return NextResponse.json(
         { success: false, error: "No Razorpay Payment ID associated with this order" },
         { status: 400 }
       );
    }

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

    // Amount is passed in INR (rupees), needs to be sent to Razorpay in Paise
    const refundAmountPaise = Math.round(Number(amount) * 100);

    const refundParams: any = {
      amount: refundAmountPaise,
      notes: {
        reason,
        quote_id: quoteId
      }
    };

    // Use Razorpay API to process refund
    const refund = await razorpay.payments.refund(rzpPaymentId, refundParams);

    // Save refund record to the lead if leadId exists
    if (quoteData.leadId) {
      const leadRef = adminDb.collection("leads").doc(quoteData.leadId);
      const leadSnap = await leadRef.get();
      if (leadSnap.exists) {
        const leadData = leadSnap.data();
        await leadRef.collection("refunds").add({
          amount,
          order_id: quoteId,
          razorpay_refund_id: refund.id,
          reason,
          initiated_by: "system_admin",
          initiated_at: new Date().toISOString(),
          status: refund.status || "INITIATED"
        });

        // Send WhatsApp Alert
        const phone = leadData?.customer_phone || leadData?.mobile_number;
        const name = leadData?.customer_name || "Customer";
        if (phone) {
          try {
            const { msg91 } = await import("@/lib/whatsapp/msg91-provider");
            await msg91.sendRefundInitiated({
              phone,
              customerName: name,
              amount,
              orderId: quoteId
            });
          } catch (waErr) {
            console.error("Failed to send Refund WhatsApp:", waErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      refund
    });

  } catch (error: any) {
    console.error("[Razorpay Refund Error]:", error);
    return NextResponse.json(
      { success: false, error: error.error?.description || error.message || "Failed to process refund" },
      { status: 500 }
    );
  }
}
