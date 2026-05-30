import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-installer";

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    // Normalize mobile: strip +91 prefix, keep 10 digits
    const normalized = mobile?.toString().replace(/^\+?91/, "").replace(/\D/g, "").trim();

    if (!normalized || normalized.length !== 10) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    // Look up promoter by mobile_number
    const INSTALLERSnap = await adminDb
      .collection(COLLECTIONS.INSTALLERS)
      .where("mobile_number", "==", normalized)
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (INSTALLERSnap.empty) {
      return NextResponse.json(
        { error: "No active installer account found with this mobile number." },
        { status: 404 }
      );
    }

    const promoter = INSTALLERSnap.docs[0].data();
    const otp = generateOtp();
    const expiresAt = otpExpiresAt();
    const e164Mobile = `+91${normalized}`;

    // Store OTP for verification
    await adminDb
      .collection(COLLECTIONS.INSTALLER_OTP_VERIFICATIONS)
      .doc(normalized)
      .set({ otp, expiresAt, type: "mobile", installerId: INSTALLERSnap.docs[0].id, createdAt: new Date() });

    // NOTE: Firebase Phone Auth handles SMS delivery on the CLIENT side via RecaptchaVerifier.
    // This route stores the OTP for our server-side verification step.
    // For Firebase Phone Auth flow: the client calls signInWithPhoneNumber() directly.
    // This route is used as a fallback lookup to confirm the mobile is a valid installer.
    console.log(`✅ [installer OTP] Mobile lookup validated for +91${normalized} (${promoter.name}). OTP: ${otp}`);
    
    // In production with Firebase Phone Auth, the SMS is sent by Firebase SDK on the client.
    // We return success and the installer name to personalize the UI.

    return NextResponse.json({ 
      success: true, 
      installerName: promoter.name,
      e164Mobile, // Return E.164 format for Firebase Phone Auth on client
    });
  } catch (error) {
    console.error("[installer OTP Mobile] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
