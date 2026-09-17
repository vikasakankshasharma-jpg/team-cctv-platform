import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";
import { sendSmsOtp } from "@/lib/sms-provider";

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

    await sendSmsOtp(normalized, otp);

    return NextResponse.json({ 
      success: true, 
      partnerName: promoter.name,
      e164Mobile, // Return E.164 format for Firebase Phone Auth on client
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("[Partner OTP Mobile] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

