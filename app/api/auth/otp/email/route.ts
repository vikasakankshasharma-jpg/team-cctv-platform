import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase-client";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to Firestore
    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).set({
      otp,
      expiresAt,
      name,
      createdAt: new Date(),
    });

    // MOCK EMAIL SENDING
    // In production, use Resend, SendGrid, or Nodemailer here.
    console.log(`\n===========================================`);
    console.log(`📧 [MOCK EMAIL OTP] to: ${email}`);
    console.log(`Code: ${otp}`);
    console.log(`===========================================\n`);

    // For now, I'll log it so the user can see it in the console/logs.
    // If you have an API key for Resend, I can integrate it here!

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("🔥 Email OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
