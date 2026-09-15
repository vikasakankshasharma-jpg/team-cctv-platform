import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { quoteId, amount, paymentMethod, reference } = await req.json();

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
      
      const newQuoteStatus = isFullyPaid ? "PAID" : "PARTIAL_PAID";
      const newPaymentStatus = isFullyPaid ? "fully_paid" : "partial";

      const txId = `MANUAL-${Date.now()}`;

      // Update quote
      transaction.update(quoteRef, {
        status: newQuoteStatus,
        payment_status: newPaymentStatus,
        amount_paid: newAmountPaid,
        amount_due: newAmountDue,
        updated_at: serverTimestamp()
      });

      // Update invoice if exists
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
      }

      // Record transaction
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
