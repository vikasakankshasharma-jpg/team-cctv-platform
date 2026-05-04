import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { generateOtp, otpExpiresAt } from "@/lib/auth-partner";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Look up promoter by email
    const promoterSnap = await adminDb
      .collection(COLLECTIONS.PROMOTERS)
      .where("email", "==", email.toLowerCase().trim())
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (promoterSnap.empty) {
      return NextResponse.json(
        { error: "No active partner account found with this email address." },
        { status: 404 }
      );
    }

    const promoter = promoterSnap.docs[0].data();
    const otp = generateOtp();
    const expiresAt = otpExpiresAt();

    // Store OTP in partner_otp_verifications
    await adminDb
      .collection(COLLECTIONS.PARTNER_OTP_VERIFICATIONS)
      .doc(email.toLowerCase().trim())
      .set({ otp, expiresAt, type: "email", promoterId: promoterSnap.docs[0].id, createdAt: new Date() });

    // Send email via Resend
    if (resend) {
      await resend.emails.send({
        from: "TEAM CCTV <onboarding@resend.dev>",
        to: email,
        subject: `${otp} — Your Partner Portal Access Code`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f9f9f9; border-radius: 24px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0;">TEAM CCTV</h1>
              <p style="color: #666; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 8px;">Partner Portal</p>
            </div>
            <div style="background-color: #ffffff; padding: 40px; border-radius: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); text-align: center;">
              <p style="color: #444; font-size: 16px; margin-bottom: 8px;">Hello <strong>${promoter.name}</strong>,</p>
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 32px;">
                Use the code below to log in to your partner portal and view your leads, commissions, and earnings.
              </p>
              <div style="background-color: #fffbeb; padding: 24px; border-radius: 16px; display: inline-block; border: 2px solid #fde68a;">
                <span style="font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #92400e;">${otp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 11px; margin-top: 32px; text-transform: uppercase; letter-spacing: 1px;">
                This code expires in 10 minutes. Do not share it with anyone.
              </p>
            </div>
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #94a3b8; font-size: 12px;">© ${new Date().getFullYear()} TEAM Smart Security Systems. All rights reserved.</p>
            </div>
          </div>
        `,
      });
      console.log(`✅ [Partner OTP] Sent email to ${email}`);
    } else {
      console.warn(`⚠️ [Partner OTP] Resend not configured. OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({ success: true, partnerName: promoter.name });
  } catch (error) {
    console.error("[Partner OTP Email] Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
