import { NextResponse } from "next/server";
import { adminDb, serverTimestamp, arrayUnion } from "@/lib/firebase-admin";
import { InventoryEngine } from "@/lib/inventory-engine";

export async function POST(req: Request) {
  try {
    const { quoteId, amount, paymentMethod, reference, stage } = await req.json();

    if (!quoteId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const txResult = await adminDb.runTransaction(async (transaction) => {
      const quoteRef = adminDb.collection("quotes").doc(quoteId);
      const quoteDoc = await transaction.get(quoteRef);

      if (!quoteDoc.exists) {
        throw new Error("Quote not found");
      }

      const quoteData = quoteDoc.data() as any;
      const totalPayable = Number(
        quoteData.pricingSnapshot?.total_payable ??
        quoteData.total_payable ??
        0
      );
      
      const previousPaid = Number(quoteData.amount_paid ?? 0);
      const newAmountPaid = previousPaid + Number(amount);
      const newAmountDue = Math.max(0, totalPayable - newAmountPaid);
      const isFullyPaid = newAmountDue <= 0;
      const isFirstPayment = previousPaid === 0;
      
      let newQuoteStatus = isFullyPaid ? "PAID" : "PARTIAL_PAID";
      if (isFirstPayment && !isFullyPaid) newQuoteStatus = "BOOKED";
      const newPaymentStatus = isFullyPaid ? "paid" : "advance_paid";

      const txId = `MANUAL-${Date.now()}`;
      
      const paymentRecord = {
        payment_id: txId,
        order_id: reference || null,
        amount: Number(amount),
        currency: "INR",
        method: paymentMethod || "manual",
        stage: stage || (isFirstPayment ? "booking" : (isFullyPaid ? "full" : "partial")),
        status: "captured",
        captured_at: new Date().toISOString(),
      };

      // 1. Inventory & Job (if first payment)
      let jobId = quoteData.job_id;
      if (isFirstPayment && !jobId) {
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

        jobId = `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const jobRef = adminDb.collection("jobs").doc(jobId);
        transaction.set(jobRef, {
          id: jobId,
          lead_id: quoteData.lead_id || quoteData.leadId || null,
          quote_id: quoteId,
          invoice_ids: [quoteId],
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
          status: inventoryResult.success ? "PENDING_DISPATCH" : "BACKORDERED",
          created_at: new Date().toISOString(),
          server_created_at: serverTimestamp(),
        });
      }

      // 2. Update quote
      const quoteUpdates: any = {
        status: newQuoteStatus,
        payment_status: newPaymentStatus,
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        payment_history: arrayUnion(paymentRecord),
        updated_at: serverTimestamp(),
      };
      
      if (isFirstPayment) {
        quoteUpdates.job_id = jobId;
        quoteUpdates.booking_amount = Number(amount);
        quoteUpdates.delivery_status = "PENDING";
      }
      
      transaction.update(quoteRef, quoteUpdates);
      
      // 3. Update Lead
      const leadId = quoteData.lead_id || quoteData.leadId;
      if (leadId) {
        const leadRef = adminDb.collection("leads").doc(leadId);
        const leadUpdates: any = {
          payment_status: newPaymentStatus,
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          updated_at: serverTimestamp(),
        };
        if (isFirstPayment) {
          leadUpdates.status = "won";
          leadUpdates.booking_amount = Number(amount);
        }
        transaction.update(leadRef, leadUpdates);
      }

      // 4. Upsert Invoice
      const invoiceRef = adminDb.collection("invoices").doc(quoteId);
      const invoiceDoc = await transaction.get(invoiceRef);
      if (invoiceDoc.exists) {
        transaction.update(invoiceRef, {
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          status: newQuoteStatus,
          payment_status: newPaymentStatus,
          updated_at: serverTimestamp()
        });
      } else {
        transaction.set(invoiceRef, {
          id: quoteId,
          quote_id: quoteId,
          lead_id: leadId || null,
          customer_name: quoteData.customer_name || "",
          customer_mobile: quoteData.customer_mobile || "",
          total_amount: totalPayable,
          amount_paid: newAmountPaid,
          amount_due: newAmountDue,
          currency: "INR",
          status: newQuoteStatus,
          invoice_type: isFirstPayment && !isFullyPaid ? "advance_receipt" : "tax_invoice",
          payment_id: txId,
          order_id: reference || "manual",
          payment_method: paymentMethod || "manual",
          created_at: new Date().toISOString(),
          server_created_at: serverTimestamp(),
        });
      }

      // 5. Record transaction
      const txRef = adminDb.collection("transactions").doc(txId);
      transaction.set(txRef, {
        id: txId,
        transaction_id: txId,
        order_id: reference || "manual",
        reference_entity_id: quoteId,
        reference_entity_type: "invoice",
        amount: Number(amount),
        status: "SUCCESS",
        gateway_response: { method: paymentMethod || "manual", reference },
        created_at: new Date().toISOString()
      });

      return { newAmountPaid, newAmountDue, status: newQuoteStatus };
    });

    return NextResponse.json({ success: true, data: txResult });
  } catch (error: any) {
    console.error("[Manual Payment Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
