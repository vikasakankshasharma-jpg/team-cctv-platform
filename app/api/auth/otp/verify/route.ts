import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase-client";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const otpDoc = await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).get();

    if (!otpDoc.exists) {
      return NextResponse.json({ error: "OTP not found or expired." }, { status: 404 });
    }

    const data = otpDoc.data();
    const now = new Date();
    const expiry = data?.expiresAt?.toDate();

    if (expiry && now > expiry) {
      await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).delete();
      return NextResponse.json({ error: "OTP has expired." }, { status: 400 });
    }

    if (data?.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    // Success - delete the OTP doc
    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("🔥 OTP Verification Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
