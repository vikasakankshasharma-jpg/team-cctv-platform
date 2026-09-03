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
    const isPaid = quoteData.status === "PAID" || quoteData.payment_status === "captured";

    return NextResponse.json({
      ready: isPaid,
      status: quoteData.status,
      payment_status: quoteData.payment_status,
      invoice_url: isPaid ? `/api/invoice/${quoteId}/download` : null,
    });
  } catch (error: any) {
    return NextResponse.json({ ready: false, error: error.message }, { status: 500 });
  }
}
