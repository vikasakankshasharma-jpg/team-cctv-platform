import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Dynamic Universal Shortlink & QR Redirect Route: /wa/[code]
 * Example: cctvquotation.com/wa/P102 or cctvquotation.com/wa/FLYER1
 * 
 * Benefits:
 * 1. Clean, permanent short URLs on printed posters/flyers/visiting cards/standees.
 * 2. Number-agnostic: If business WhatsApp number changes or moves to Meta Cloud API,
 *    printed QR codes NEVER break!
 * 3. Logs scan impressions in real-time before redirecting to WhatsApp.
 * 4. Dynamically pulls active WhatsApp number from Firestore settings or env.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const cleanCode = (code || "").toUpperCase().trim();
  
  let waNumber = 
    process.env.MSG91_WHATSAPP_NUMBER || 
    process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || 
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || 
    "919982549315";

  try {
    // 1. Asynchronously log scan impression for analytics & check dynamic number
    if (adminDb && cleanCode) {
      // Dynamic config lookup
      try {
        const settingsSnap = await adminDb.collection(COLLECTIONS.SETTINGS).doc(SETTINGS_DOC_ID).get();
        if (settingsSnap.exists) {
          const sData = settingsSnap.data();
          if (sData?.whatsapp_bot_number) {
            waNumber = String(sData.whatsapp_bot_number).replace(/\D/g, "");
          } else if (sData?.whatsapp_support_number) {
            waNumber = String(sData.whatsapp_support_number).replace(/\D/g, "");
          }
        }
      } catch (e) {
        // Fallback to env
      }

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
  const cleanWaNumber = String(waNumber).replace(/\D/g, "") || "919982549315";
  const message = `Hi ${cleanCode}`;
  const waUrl = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(message)}`;

  return NextResponse.redirect(waUrl, { status: 302 });
}
