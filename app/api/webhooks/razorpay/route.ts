import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { InventoryEngine } from "@/lib/inventory-engine";
import { sendCustomerWhatsApp, sendAdminNotification } from "@/lib/notification-service";


// ── Payment History Logger ──
// Appends a structured payment record to the quote's payment_history array
// This eliminates the need to open Razorpay Dashboard for payment tracking
function buildPaymentRecord(paymentEntity: any, stage: string) {
  return {
    payment_id: paymentEntity.id,
    order_id: paymentEntity.order_id || null,
    amount: paymentEntity.amount / 100,
    currency: paymentEntity.currency || "INR",
    method: paymentEntity.method || "unknown",       // card, upi, netbanking, wallet
    bank: paymentEntity.bank || null,
    wallet: paymentEntity.wallet || null,
    vpa: paymentEntity.vpa || null,                   // UPI VPA (e.g., user@paytm)
    email: paymentEntity.email || null,
    contact: paymentEntity.contact || null,
    card_last4: paymentEntity.card?.last4 || null,
    card_network: paymentEntity.card?.network || null, // Visa, Mastercard, etc.
    stage,  // "booking" | "delivery_90" | "installation_final" | "full"
    status: "captured",
    razorpay_fee: paymentEntity.fee ? paymentEntity.fee / 100 : null,
    razorpay_tax: paymentEntity.tax ? paymentEntity.tax / 100 : null,
    captured_at: new Date().toISOString(),
  };
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    // 1. Fail Closed: Webhook Secret MUST be set in environment
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("[Razorpay Webhook Error]: RAZORPAY_WEBHOOK_SECRET is not configured on server.");
      return NextResponse.json(
        { error: "Webhook configuration error" },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    // 2. Strict HMAC SHA-256 Signature Verification
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Razorpay Webhook Error]: Invalid signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(bodyText);

    // 3. Process Captured / Paid Events
    if (payload.event === "payment.captured" || payload.event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      if (!paymentEntity) {
        return NextResponse.json({ error: "Missing payment entity in payload" }, { status: 400 });
      }

      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const quoteId = paymentEntity.notes?.quote_id || paymentEntity.receipt;

      if (!quoteId) {
        console.error("[Razorpay Webhook Error]: No quote_id found in payment notes or receipt.");
        return NextResponse.json({ error: "Unbound payment: missing quote_id" }, { status: 400 });
      }

      // ── Route by payment_type ──
      const paymentType = paymentEntity.notes?.payment_type;

      if (paymentType === "delivery_90") {
        // ──────────────────────────────────────────────────────
        // STAGE 2: 90% Delivery Payment
        // ──────────────────────────────────────────────────────
        const dQuoteRef = adminDb.collection("quotes").doc(quoteId);
        const dQuoteDoc = await dQuoteRef.get();
        if (!dQuoteDoc.exists) {
          return NextResponse.json({ error: `Quote ${quoteId} not found` }, { status: 404 });
        }

        const dQuoteData = dQuoteDoc.data() as any;

        // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact payment
        const hasProcessed = dQuoteData.payment_history?.some((p: any) => p.payment_id === paymentId);
        if (hasProcessed) {
          console.log(`[Razorpay Webhook]: Idempotency caught duplicate delivery webhook for ${paymentId}`);
          return NextResponse.json({ success: true, note: "Already processed" });
        }

        const paidAmount = paymentEntity.amount / 100;
        const prevPaid = dQuoteData.amount_paid || 0;

        await dQuoteRef.update({
          payment_status: "delivery_paid",
          amount_paid: prevPaid + paidAmount,
          delivery_amount: paidAmount,
          delivery_payment_id: paymentEntity.id,
        payment_history: arrayUnion(buildPaymentRecord(paymentEntity, "delivery_90")),
          updated_at: serverTimestamp(),
        });

        const dLeadId = dQuoteData.lead_id || dQuoteData.leadId;
        if (dLeadId) {
          await adminDb.collection("leads").doc(dLeadId).update({
            payment_status: "delivery_paid",
            amount_paid: prevPaid + paidAmount,
            updated_at: serverTimestamp(),
          });
        }

        // Send Delivery OTP to customer now that 90% is paid
        const deliveryOtp = dQuoteData.delivery_otp;
        if (deliveryOtp && dQuoteData.customer_mobile) {
          await sendCustomerWhatsApp(
            dQuoteData.customer_mobile,
            `✅ Payment of ₹${paidAmount.toLocaleString()} received!\n\nYour secure Delivery OTP is: *${deliveryOtp}*\n\nPlease share this OTP with the delivery person only after inspecting your CCTV materials.\n\nThank you for choosing TEAM CCTV! 🛡️`
          );
        }

        await sendAdminNotification(`📦 Delivery Payment ₹${paidAmount} received for Quote ${quoteId}`);
        console.log(`[Razorpay Webhook]: Delivery payment ₹${paidAmount} received for Quote ${quoteId}.`);
        return NextResponse.json({ success: true });

      } else if (paymentType === "installation_final") {
        // ──────────────────────────────────────────────────────
        // STAGE 3: Final 10% Installation Payment
        // ──────────────────────────────────────────────────────
        const iQuoteRef = adminDb.collection("quotes").doc(quoteId);
        const iQuoteDoc = await iQuoteRef.get();
        if (!iQuoteDoc.exists) {
          return NextResponse.json({ error: `Quote ${quoteId} not found` }, { status: 404 });
        }

        const iQuoteData = iQuoteDoc.data() as any;

        // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact payment
        const hasProcessed = iQuoteData.payment_history?.some((p: any) => p.payment_id === paymentId);
        if (hasProcessed) {
          console.log(`[Razorpay Webhook]: Idempotency caught duplicate installation webhook for ${paymentId}`);
          return NextResponse.json({ success: true, note: "Already processed" });
        }

        const iPaidAmount = paymentEntity.amount / 100;
        const iPrevPaid = iQuoteData.amount_paid || 0;

        await iQuoteRef.update({
          status: "COMPLETED",
          payment_status: "paid",
          amount_paid: iPrevPaid + iPaidAmount,
          installation_amount: iPaidAmount,
          installation_payment_id: paymentEntity.id,
        payment_history: arrayUnion(buildPaymentRecord(paymentEntity, "installation_final")),
          completed_at: new Date().toISOString(),
          updated_at: serverTimestamp(),
        });

        const iLeadId = iQuoteData.lead_id || iQuoteData.leadId;
        if (iLeadId) {
          await adminDb.collection("leads").doc(iLeadId).update({
            payment_status: "paid",
            amount_paid: iPrevPaid + iPaidAmount,
            updated_at: serverTimestamp(),
          });
        }

        const iJobId = iQuoteData.job_id;
        if (iJobId) {
          await adminDb.collection("jobs").doc(iJobId).update({
            status: "COMPLETED",
            completed_at: new Date().toISOString(),
            updated_at: serverTimestamp(),
          });
        }

        if (iQuoteData.customer_mobile) {
          await sendCustomerWhatsApp(
            iQuoteData.customer_mobile,
            `🎉 Final payment of ₹${iPaidAmount.toLocaleString()} received!\n\nYour CCTV installation is now COMPLETE. Your Warranty Certificate is being generated and will be sent shortly.\n\nThank you for choosing TEAM CCTV! 🛡️`
          );
        }

        await sendAdminNotification(`🎉 Installation Complete! Final ₹${iPaidAmount} received for Quote ${quoteId}`);
        console.log(`[Razorpay Webhook]: Installation final payment ₹${iPaidAmount} for Quote ${quoteId}. Status: COMPLETED.`);
        return NextResponse.json({ success: true });
      }

      // ──────────────────────────────────────────────────────
      // STAGE 1: Initial Booking (advance_500_cod or full payment)
      // ──────────────────────────────────────────────────────
      // 4. Run Transaction: Strict Binding Checks & Idempotent State Transition
      const txResult = await adminDb.runTransaction(async (transaction) => {
        const quoteRef = adminDb.collection("quotes").doc(quoteId);
        const quoteDoc = await transaction.get(quoteRef);

        if (!quoteDoc.exists) {
          throw new Error(`Quote ${quoteId} not found in database`);
        }

        const quoteData = quoteDoc.data() as any;

        // Idempotency check: Already processed
        if (quoteData.status === "PAID" || quoteData.status === "BOOKED" || quoteData.payment_status === "captured" || quoteData.payment_status === "advance_paid") {
          console.log(`[Razorpay Webhook]: Quote ${quoteId} is already processed. Skipping duplicate event.`);
          return { status: "already_paid" };
        }

        // Binding Cross-Check 1: Currency must be INR
        if (paymentEntity.currency !== "INR") {
          throw new Error(`Currency mismatch: expected INR, got ${paymentEntity.currency}`);
        }

        // Binding Cross-Check 2: Order ID binding (if recorded on quote)
        if (quoteData.razorpay_order_id && orderId && quoteData.razorpay_order_id !== orderId) {
          throw new Error(`Order ID mismatch: quote expects ${quoteData.razorpay_order_id}, got ${orderId}`);
        }

        // Binding Cross-Check 3: Amount match (within 1 rupee tolerance for rounding)
        // IMPORTANT: compare against razorpay_order_amount (the amount actually
        // ordered for THIS payment, set correctly at order-creation time for
        // both full and "advance" partial payments) — not the quote's full
        // total_payable. Comparing against the full total unconditionally
        // rejects every legitimate advance/partial payment as a "mismatch".
        const expectedRupees = Number(
          quoteData.razorpay_order_amount ??
          quoteData.pricingSnapshot?.total_payable ??
          quoteData.total_payable ??
          quoteData.total ??
          0
        );
        const paidPaise = Number(paymentEntity.amount);
        const expectedPaise = Math.round(expectedRupees * 100);

        if (Math.abs(paidPaise - expectedPaise) > 100) {
          throw new Error(
            `Payment amount mismatch! Expected ₹${expectedRupees} (${expectedPaise} paise), but received ${paidPaise} paise.`
          );
        }

        // 5. Deduct/Reserve Inventory
        const items = quoteData.pricingSnapshot?.items || quoteData.configurationSnapshot?.items || [];
        const inventoryItems = items
          .filter((i: any) => i.product_id || i.id)
          .map((i: any) => ({ product_id: i.product_id || i.id, qty: i.qty || 1 }));

        let inventoryResult: { success: boolean; insufficientItems?: string[] } = { success: true, insufficientItems: [] };
        if (inventoryItems.length > 0) {
          inventoryResult = await InventoryEngine.attemptDeduction(
            transaction,
            inventoryItems,
            quoteId,
            "invoice"
          );
        }

        // 6. Create Job Card
        const jobId = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const jobRef = adminDb.collection("jobs").doc(jobId);
        const jobStatus = inventoryResult.success ? "PENDING_DISPATCH" : "BACKORDERED";

        const newJob = {
          id: jobId,
          lead_id: quoteData.lead_id || quoteData.leadId || null,
          quote_id: quoteId,
          invoice_ids: [quoteId],
          change_order_ids: [],
          customer: {
            name: quoteData.customer_name || "",
            mobile: quoteData.customer_mobile || "",
          },
          address: {
            pincode: quoteData.requirementSnapshot?.lead_pincode || quoteData.pincode || "000000",
            city: quoteData.requirementSnapshot?.city || "",
            full_address: quoteData.requirementSnapshot?.full_address || "",
          },
          type: "installation",
          status: jobStatus,
          created_at: new Date().toISOString(),
          server_created_at: serverTimestamp(),
        };
        transaction.set(jobRef, newJob);
        const fullTotal = Number(
          quoteData.negotiated_final_price ??
          quoteData.pricingSnapshot?.total_payable ??
          quoteData.total_payable ??
          quoteData.total ??
          expectedRupees
        );
        const pType = String(paymentEntity.notes?.payment_type || quoteData.payment_type || "").toLowerCase();
        const isAdvance = pType.includes("advance") || expectedRupees <= 1000 || (fullTotal > 1000 && expectedRupees < (fullTotal - 10));
        const quoteNewStatus = isAdvance ? "BOOKED" : "PAID";
        const quotePaymentStatus = isAdvance ? "advance_paid" : "paid";
        const actualPaid = expectedRupees;
        const actualDue = isAdvance ? Math.max(0, fullTotal - actualPaid) : 0;

        // 7. Create Invoice Record
        const invoiceRef = adminDb.collection("invoices").doc(quoteId);
        transaction.set(invoiceRef, {
          id: quoteId,
          quote_id: quoteId,
          lead_id: quoteData.lead_id || quoteData.leadId || null,
          customer_name: quoteData.customer_name || "",
          customer_mobile: quoteData.customer_mobile || "",
          total_amount: fullTotal,
          amount_paid: actualPaid,
          amount_due: actualDue,
          currency: "INR",
          status: quoteNewStatus,
          invoice_type: isAdvance ? "advance_receipt" : "tax_invoice",
          payment_id: paymentId,
          order_id: orderId,
          payment_method: paymentEntity.method,
          created_at: new Date().toISOString(),
          server_created_at: serverTimestamp(),
        });

        // 8. Update Quote Document to BOOKED or PAID with exact amounts
        transaction.update(quoteRef, {
          status: quoteNewStatus,
          payment_status: quotePaymentStatus,
          amount_paid: actualPaid,
          amount_due: actualDue,
          booking_amount: isAdvance ? actualPaid : (quoteData.booking_amount || 0),
          delivery_amount: isAdvance ? Math.round(actualDue * 0.9) : 0,
          installation_amount: isAdvance ? Math.max(0, actualDue - Math.round(actualDue * 0.9)) : 0,
          payment_preference: isAdvance ? "cash_on_delivery" : "online_all",
          payment_history: arrayUnion(buildPaymentRecord(paymentEntity, isAdvance ? "booking" : "full")),
          delivery_status: "PENDING",
          razorpay_payment_id: paymentId,
          razorpay_order_id: orderId,
          payment_method: paymentEntity.method,
          paid_at: new Date().toISOString(),
          job_id: jobId,
          updated_at: serverTimestamp(),
        });

        // 9. Update Associated Lead Status to 'won'
        const leadId = quoteData.lead_id || quoteData.leadId;
        if (leadId) {
          const leadRef = adminDb.collection("leads").doc(leadId);
          transaction.update(leadRef, {
            status: "won",
            payment_status: quotePaymentStatus,
            won_quote_id: quoteId,
            latest_quote_id: quoteId,
            last_quote_id: quoteId,
            paid_amount: expectedRupees,
            amount_paid: actualPaid,
            booking_amount: isAdvance ? actualPaid : (quoteData.booking_amount || actualPaid),
            amount_due: actualDue,
            quote_ids: arrayUnion(quoteId),
            quotes: arrayUnion({ quoteId, status: quoteNewStatus, amount_paid: actualPaid }),
            updated_at: serverTimestamp(),
          });
        }


        return { status: "processed", jobId, customerMobile: quoteData.customer_mobile, quoteId };
      });

      console.log(`[Razorpay Webhook]: Quote ${quoteId} successfully verified & transitioned.`, txResult);

      if (txResult.status === "processed") {
        try {
          const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com"}/track/${txResult.quoteId}`;
          const adminMessage = `💰 New Payment Received!\nQuote ID: ${txResult.quoteId}\nJob ID: ${txResult.jobId}\nCustomer Mobile: ${txResult.customerMobile || "N/A"}\nAmount: ₹${(paymentEntity.amount / 100).toFixed(2)}`;
          await sendAdminNotification(adminMessage);

          if (txResult.customerMobile) {
            const customerMessage = `🎉 Payment Received!\n\nYour booking is confirmed.\nQuote ID: ${txResult.quoteId}\nJob ID: ${txResult.jobId}\n\nTrack your booking in real-time here:\n${trackingUrl}\n\nThank you for choosing TEAM CCTV!`;
            await sendCustomerWhatsApp(txResult.customerMobile, customerMessage);
          }
        } catch (notifErr) {
          console.error("[Razorpay Webhook]: Failed to send notifications", notifErr);
        }
      }

    } else if (payload.event === "refund.processed") {
      const refundEntity = payload.payload?.refund?.entity;
      if (!refundEntity) {
        return NextResponse.json({ error: "Missing refund entity in payload" }, { status: 400 });
      }

      const refundPaymentId = refundEntity.payment_id;
      const refundQuoteId = refundEntity.notes?.quote_id;

      if (!refundQuoteId) {
        console.error("[Razorpay Webhook Error]: No quote_id found in refund notes.");
        return NextResponse.json({ error: "Unbound refund: missing quote_id" }, { status: 400 });
      }

      const refundTxResult = await adminDb.runTransaction(async (transaction) => {
        const quoteRef = adminDb.collection("quotes").doc(refundQuoteId);
        const quoteDoc = await transaction.get(quoteRef);

        if (!quoteDoc.exists) {
          throw new Error(`Quote ${refundQuoteId} not found in database`);
        }

        const quoteData = quoteDoc.data() as any;

        if (quoteData.payment_status === "refunded") {
          console.log(`[Razorpay Webhook]: Quote ${refundQuoteId} is already REFUNDED. Skipping.`);
          return { status: "already_refunded" };
        }

        transaction.update(quoteRef, {
          status: "CANCELLED",
          payment_status: "refunded",
          refund_id: refundEntity.id,
          refund_amount: refundEntity.amount / 100,
          updated_at: serverTimestamp(),
        });

        const invoiceRef = adminDb.collection("invoices").doc(refundQuoteId);
        const invoiceDoc = await transaction.get(invoiceRef);
        if (invoiceDoc.exists) {
          transaction.update(invoiceRef, {
            status: "REFUNDED",
            refund_id: refundEntity.id,
            updated_at: serverTimestamp(),
          });
        }

        const jobId = quoteData.job_id;
        if (jobId) {
          const jobRef = adminDb.collection("jobs").doc(jobId);
          const jobDoc = await transaction.get(jobRef);
          if (jobDoc.exists) {
            const jobData = jobDoc.data() as any;
            if (!["completed", "audited"].includes(jobData.status)) {
              transaction.update(jobRef, {
                status: "cancelled",
                cancellation_reason: "Customer Refund",
                updated_at: serverTimestamp(),
              });
            }
          }
        }

        const leadId = quoteData.lead_id || quoteData.leadId;
        if (leadId) {
          transaction.update(adminDb.collection("leads").doc(leadId), {
            status: "lost",
            lost_reason: "Refunded",
            updated_at: serverTimestamp(),
          });
        }

        const items = quoteData.pricingSnapshot?.items || quoteData.configurationSnapshot?.items || [];
        const inventoryItems = items
          .filter((i: any) => i.product_id || i.id)
          .map((i: any) => ({ product_id: i.product_id || i.id, qty: i.qty || 1 }));

        if (inventoryItems.length > 0) {
          await InventoryEngine.reverseDeduction(transaction, inventoryItems, refundEntity.id, "manual");
        }

        return { status: "processed", quoteId: refundQuoteId, customerMobile: quoteData.customer_mobile, amount: refundEntity.amount / 100 };
      });

      console.log(`[Razorpay Webhook]: Refund for Quote ${refundQuoteId} processed.`, refundTxResult);

      if (refundTxResult.status === "processed") {
        try {
          await sendAdminNotification(`💸 Refund Processed!\nQuote ID: ${refundTxResult.quoteId}\nAmount: ₹${refundTxResult.amount}`);
          if (refundTxResult.customerMobile) {
            await sendCustomerWhatsApp(refundTxResult.customerMobile, `Hi, your refund of ₹${refundTxResult.amount} for Quote ID ${refundTxResult.quoteId} has been successfully processed. It may take 5-7 business days to reflect in your account.`);
          }
        } catch (notifErr) {
          console.error("[Razorpay Webhook]: Failed to send refund notifications", notifErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 400 });
  }
}
