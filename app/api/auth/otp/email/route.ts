import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase-client";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to Firestore
    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(email).set({
      otp,
      expiresAt,
      name,
      createdAt: new Date(),
    });

    // Send Real Email via Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "TEAM CCTV <onboarding@resend.dev>", // Note: Custom domain requires Resend domain verification
        to: email,
        subject: `${otp} is your TEAM Elite Verification Code`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9f9f9; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0;">TEAM CCTV</h1>
              <p style="color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Smart Security Ecosystem</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
              <p style="color: #444; font-size: 16px; margin-bottom: 24px;">Hello <strong>${name}</strong>,</p>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">To unlock your custom security proposal and itemized hardware transparency, please use the following verification code:</p>
              
              <div style="background-color: #f1f5f9; padding: 24px; border-radius: 16px; display: inline-block;">
                <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1e293b;">${otp}</span>
              </div>
              
              <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">This code expires in 10 minutes.</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} TEAM Smart Security Systems. All rights reserved.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ [Resend] Successfully sent OTP to ${email}`);
    } else {
      console.warn("⚠️ [Resend] API Key missing. Logging OTP to console:", otp);
    }

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("🔥 Email OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
