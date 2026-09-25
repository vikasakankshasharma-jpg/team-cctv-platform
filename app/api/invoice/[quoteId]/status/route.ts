import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const doc = await adminDb.collection("quotes").doc(quoteId).get();

    if (!doc.exists) {
      return NextResponse.json({ ready: false, error: "Quote not found" }, { status: 404 });
    }

    const quoteData = doc.data() as any;
    const isPaid = quoteData.status === "PAID" || quoteData.payment_status === "captured" || quoteData.payment_status === "paid";
    const isAdvance = quoteData.status === "BOOKED" || quoteData.payment_status === "advance_paid" || String(quoteData.payment_type || '').includes("advance");
    const isReady = isPaid || isAdvance || !!quoteData.paid_at;

    const totalPayable = Number(
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
