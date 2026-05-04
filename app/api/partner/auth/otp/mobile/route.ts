import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    // Normalize mobile: strip +91 prefix, keep 10 digits
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    // Look up promoter by mobile_number
    const promoterSnap = await adminDb
      .collection(COLLECTIONS.PROMOTERS)
      .where("mobile_number", "==", normalized)
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (promoterSnap.empty) {
      return NextResponse.json(
        { error: "No active partner account found with this mobile number." },
        { status: 404 }
      );
    }

    const promoter = promoterSnap.docs[0].data();
    const otp = generateOtp();
    const expiresAt = otpExpiresAt();
    const e164Mobile = `+91${normalized}`;

    // Store OTP for verification
    await adminDb
      .collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS)
      .doc(normalized)
      .set({ otp, expiresAt, type: "mobile", promoterId: promoterSnap.docs[0].id, createdAt: new Date() });

    // NOTE: Firebase Phone Auth handles SMS delivery on the CLIENT side via RecaptchaVerifier.
    // This route stores the OTP for our server-side verification step.
    // For Firebase Phone Auth flow: the client calls signInWithPhoneNumber() directly.
    // This route is used as a fallback lookup to confirm the mobile is a valid partner.
    console.log(`✅ [Partner OTP] Mobile lookup validated for +91${normalized} (${promoter.name}). OTP: ${otp}`);
    
    // In production with Firebase Phone Auth, the SMS is sent by Firebase SDK on the client.
    // We return success and the partner name to personalize the UI.

    return NextResponse.json({ 
      success: true, 
      partnerName: promoter.name,
      e164Mobile, // Return E.164 format for Firebase Phone Auth on client
    });
  } catch (error) {
    console.error("[Partner OTP Mobile] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
