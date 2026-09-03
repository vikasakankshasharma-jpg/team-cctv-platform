import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { InventoryEngine } from "@/lib/inventory-engine";

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

      // 4. Run Transaction: Strict Binding Checks & Idempotent State Transition
      const txResult = await adminDb.runTransaction(async (transaction) => {
        const quoteRef = adminDb.collection("quotes").doc(quoteId);
        const quoteDoc = await transaction.get(quoteRef);

        if (!quoteDoc.exists) {
          throw new Error(`Quote ${quoteId} not found in database`);
        }

        const quoteData = quoteDoc.data() as any;

        // Idempotency check: Already processed
        if (quoteData.status === "PAID" || quoteData.payment_status === "captured") {
          console.log(`[Razorpay Webhook]: Quote ${quoteId} is already PAID. Skipping duplicate event.`);
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
        const expectedRupees = Number(
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

        // 7. Create Invoice Record
        const invoiceRef = adminDb.collection("invoices").doc(quoteId);
        transaction.set(invoiceRef, {
          id: quoteId,
          quote_id: quoteId,
          lead_id: quoteData.lead_id || quoteData.leadId || null,
          customer_name: quoteData.customer_name || "",
          customer_mobile: quoteData.customer_mobile || "",
          total_amount: expectedRupees,
          currency: "INR",
          status: "PAID",
          payment_id: paymentId,
          order_id: orderId,
          payment_method: paymentEntity.method,
          created_at: new Date().toISOString(),
          server_created_at: serverTimestamp(),
        });

        // 8. Update Quote Document to PAID
        transaction.update(quoteRef, {
          status: "PAID",
          payment_status: "captured",
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
            payment_status: "paid",
            won_quote_id: quoteId,
            paid_amount: expectedRupees,
            updated_at: serverTimestamp(),
          });
        }

        return { status: "processed", jobId };
      });

      console.log(`[Razorpay Webhook]: Quote ${quoteId} successfully verified & transitioned.`, txResult);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook Error]:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 400 });
  }
}
