import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Dynamic Universal Shortlink & QR Redirect Route: /wa/[code]
 * Example: cctvquotation.com/wa/P102 or cctvquotation.com/wa/FLYER1
 * 
 * Benefits:
 * 1. Clean, permanent short URLs on printed posters/flyers/visiting cards.
 * 2. Number-agnostic: If business WhatsApp number changes, printed QR codes never break!
 * 3. Logs scan impressions in real-time before redirecting to WhatsApp.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = (code || "").toUpperCase().trim();
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917357612865";

  try {
    // 1. Asynchronously log scan impression for analytics
    if (adminDb && cleanCode) {
      // Check if it's a marketing campaign
      const campSnap = await adminDb
        .collection(COLLECTIONS.MARKETING_CAMPAIGNS)
        .where("keyword", "==", cleanCode)
        .limit(1)
        .get();

      if (!campSnap.empty) {
        const docRef = campSnap.docs[0].ref;
        docRef.update({
          total_scans: (campSnap.docs[0].data().total_scans || 0) + 1,
          last_scanned_at: new Date(),
        }).catch(() => {});
      } else {
        // Check if it's a promoter/partner
        const promoterSnap = await adminDb
          .collection(COLLECTIONS.PROMOTERS)
          .where("referral_code", "==", cleanCode)
          .limit(1)
          .get();

        if (!promoterSnap.empty) {
          const docRef = promoterSnap.docs[0].ref;
          docRef.update({
            total_qr_scans: (promoterSnap.docs[0].data().total_qr_scans || 0) + 1,
            last_scanned_at: new Date(),
          }).catch(() => {});
        }
      }
    }
  } catch (e) {
    console.error("Scan logging error:", e);
  }

  // 2. Perform 302 redirect directly into WhatsApp
  const message = `Hi ${cleanCode} I want a CCTV quotation`;
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  return NextResponse.redirect(waUrl, { status: 302 });
}
