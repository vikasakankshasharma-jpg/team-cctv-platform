import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    let doc = await adminDb.collection("quotes").doc(quoteId).get();

    if (!doc.exists) {
      // Check uppercase
      doc = await adminDb.collection("quotes").doc(quoteId.toUpperCase()).get();
    }

    if (!doc.exists) {
      // Check invoices collection
      const invDoc = await adminDb.collection("invoices").doc(quoteId).get();
      if (invDoc.exists) {
        doc = invDoc as any;
      } else {
        const invSnap = await adminDb.collection("invoices").where("quote_id", "==", quoteId).limit(1).get();
        if (!invSnap.empty) {
          doc = invSnap.docs[0] as any;
        }
      }
    }

    if (!doc.exists) {
      // Check collectionGroup
      try {
        const cgSnap = await adminDb.collectionGroup("quotes").where("id", "==", quoteId).limit(1).get();
        if (!cgSnap.empty) {
          doc = cgSnap.docs[0] as any;
        }
      } catch {
        // Ignored
      }
    }

    if (!doc.exists) {
      return NextResponse.json({ ready: false, error: "Quote/Invoice not found" }, { status: 404 });
    }

    const quoteData = doc.data() as any;
    const isPaid = 
      quoteData.status === "PAID" || 
      quoteData.payment_status === "captured" || 
      quoteData.payment_status === "paid" ||
      quoteData.status === "COMPLETED";

    const isAdvance = 
      quoteData.status === "BOOKED" || 
      quoteData.payment_status === "advance_paid" || 
      String(quoteData.payment_type || '').includes("advance") ||
      (quoteData.amount_paid && quoteData.amount_paid < (quoteData.total_payable || 999999));

    const isReady = isPaid || isAdvance || !!quoteData.paid_at || !!quoteData.payment_id || (quoteData.amount_paid || 0) > 0;

    const totalPayable = Number(
      quoteData.total_amount ??
      quoteData.pricingSnapshot?.total_payable ??
      quoteData.total_payable ??
      quoteData.total ??
      0
    );
    const amountPaid = Number(quoteData.amount_paid ?? (isAdvance ? 500 : 0));
    const amountDue = isPaid ? 0 : Number(quoteData.amount_due ?? Math.max(0, totalPayable - amountPaid));

    return NextResponse.json({
      ready: isReady,
      status: quoteData.status,
      payment_status: quoteData.payment_status,
      is_advance: isAdvance,
      amount_paid: amountPaid,
      amount_due: amountDue,
      total_payable: totalPayable,
      invoice_url: isReady ? `/api/invoice/${quoteId}/download` : null,
    });
  } catch (error: any) {
    return NextResponse.json({ ready: false, error: error.message }, { status: 500 });
  }
}
