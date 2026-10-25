import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { quoteId, leadId, amount, paymentType, description } = body;

    if (!quoteId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Valid quoteId and amount are required" }, { status: 400 });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const defaultUpiId = "teamcctv@okhdfc";
    const noteText = description || `TEAM CCTV Quote ${quoteId.slice(0, 8)}`;
    const standardUpiString = `upi://pay?pa=${defaultUpiId}&pn=TEAM%20CCTV%20SOLUTIONS&am=${amount}&cu=INR&tn=${encodeURIComponent(noteText)}`;

    // If Razorpay keys are available, try creating an official dynamic QR
    if (key_id && key_secret) {
      try {
        const razorpay = new Razorpay({ key_id, key_secret });
        const qrResponse: any = await razorpay.qrCode.create({
          type: "upi_qr",
          name: "TEAM CCTV SOLUTIONS",
          usage: "single_use",
          fixed_amount: true,
          payment_amount: Math.round(amount * 100), // in paise
          description: noteText,
          notes: {
            quote_id: quoteId,
            lead_id: leadId || "",
            payment_type: paymentType || "handover_payment",
          },
        });

        if (qrResponse && (qrResponse.image_url || qrResponse.qr_string || qrResponse.id)) {
          // Log QR code creation on quote document
          try {
            await adminDb.collection("quotes").doc(quoteId).update({
              last_dynamic_qr_id: qrResponse.id,
              last_dynamic_qr_amount: amount,
              last_dynamic_qr_type: paymentType,
              updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
            });
          } catch {}

          return NextResponse.json({
            success: true,
            qr_string: qrResponse.qr_string || qrResponse.image_url || standardUpiString,
            image_url: qrResponse.image_url,
            qr_id: qrResponse.id,
          });
        }
      } catch (rzpErr: any) {
        console.warn("[Razorpay QR API Fallback to standard UPI]:", rzpErr?.message || rzpErr);
      }
    }

    // Graceful fallback to verified standard Indian banking UPI string
    return NextResponse.json({
      success: true,
      qr_string: standardUpiString,
      is_fallback: true,
    });
  } catch (error: any) {
    console.error("[Razorpay QR Route Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
