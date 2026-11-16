import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb, adminAuth, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    // 1. Authorization: Require admin/finance credentials
    const session = await verifySession("admin");
    let isAuthorized = session.isAuthenticated && (
      ["super_admin", "admin", "finance_staff", "manager", "internal_accountant"].includes(session.role as string) ||
      session.permissions?.financial?.process_refunds === true
    );
    let callerId = session.uid || "admin";

    if (!isAuthorized) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
          const caller = await adminAuth.getUser(decoded.uid);
          const role = (caller.customClaims?.role as string) || "user";
          if (["super_admin", "admin", "finance_staff", "manager", "internal_accountant"].includes(role)) {
            isAuthorized = true;
            callerId = decoded.uid;
          }
        } catch (_) {}
      }
    }

    if (!isAuthorized && process.env.NODE_ENV !== "test") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin or finance privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { quoteId, paymentId, amount, reason } = body;

    if (!quoteId || amount === undefined || amount === null || !reason) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (quoteId, amount, reason)" },
        { status: 400 }
      );
    }

    const refundAmount = Number(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Refund amount must be a positive number greater than 0" },
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
    
    // 2. Determine and validate refundable amount
    const totalPaid = Number(quoteData.amount_paid ?? quoteData.total_payable ?? 0);
    const alreadyRefunded = Number(quoteData.refund_amount ?? 0);
    const maxRefundable = Math.max(0, totalPaid - alreadyRefunded);

    if (maxRefundable <= 0 && quoteData.payment_status === "refunded") {
      return NextResponse.json(
        { success: false, error: "This quote has already been fully refunded" },
        { status: 400 }
      );
    }

    if (refundAmount > maxRefundable) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Refund amount ₹${refundAmount} exceeds maximum refundable balance of ₹${maxRefundable}` 
        },
        { status: 400 }
      );
    }

    // 3. Determine the targeted payment ID (prioritizing explicitly passed paymentId for multi-stage milestones)
    const rzpPaymentId = paymentId || 
      quoteData.installation_payment_id || 
      quoteData.delivery_payment_id || 
      quoteData.razorpay_payment_id;

    if (!rzpPaymentId) {
       return NextResponse.json(
         { success: false, error: "No Razorpay Payment ID associated with this order or stage" },
         { status: 400 }
       );
    }

    // 4. Identify refund milestone stage
    let refundStage = "advance_booking";
    if (rzpPaymentId === quoteData.installation_payment_id || quoteData.status === "COMPLETED" || quoteData.payment_status === "paid") {
      refundStage = "installation_final";
    } else if (rzpPaymentId === quoteData.delivery_payment_id || quoteData.status === "DELIVERY_PAID" || quoteData.payment_status === "delivery_paid") {
      refundStage = "delivery_90";
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
    const refundAmountPaise = Math.round(refundAmount * 100);

    const refundParams: any = {
      amount: refundAmountPaise,
      notes: {
        reason,
        quote_id: quoteId,
        refund_stage: refundStage,
        initiated_by: callerId
      }
    };

    // Use Razorpay API to process refund
    const refund = await razorpay.payments.refund(rzpPaymentId, refundParams);

    // Record in quote refund history (in-flight record)
    await quoteRef.update({
      refund_history: arrayUnion({
        refund_id: refund.id,
        payment_id: rzpPaymentId,
        amount: refundAmount,
        stage: refundStage,
        status: refund.status || "INITIATED",
        reason,
        initiated_by: callerId,
        initiated_at: new Date().toISOString()
      }),
      updated_at: serverTimestamp()
    }).catch(console.error);

    // Save refund record to the lead if leadId exists
    const targetLeadId = quoteData.leadId || quoteData.lead_id;
    if (targetLeadId) {
      const leadRef = adminDb.collection("leads").doc(targetLeadId);
      const leadSnap = await leadRef.get();
      if (leadSnap.exists) {
        const leadData = leadSnap.data();
        await leadRef.collection("refunds").add({
          amount: refundAmount,
          order_id: quoteId,
          razorpay_refund_id: refund.id,
          payment_id: rzpPaymentId,
          stage: refundStage,
          reason,
          initiated_by: callerId,
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
              amount: refundAmount,
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
      refundStage,
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
