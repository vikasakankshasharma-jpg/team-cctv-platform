import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { quoteId, paymentId } = await request.json();
    if (!quoteId || !paymentId) return NextResponse.json({ success: false, error: "Missing payload" }, { status: 400 });

    // Fallback Verification for preview environments where webhooks fail to reach localhost/vercel preview branches
    const quoteRef = adminDb.collection("quotes").doc(quoteId);
    const docSnap = await quoteRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      // Only update if not already marked
      if (data?.status !== "PAID" && data?.status !== "BOOKED") {
        await quoteRef.update({
          status: "BOOKED",
          payment_status: "advance_paid",
          amount_paid: data?.amount_paid || 500, // At least 500
          booking_amount: 500,
          payment_id: paymentId,
          paid_at: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Fallback verify error", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
