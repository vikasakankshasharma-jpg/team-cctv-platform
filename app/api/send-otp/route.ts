import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp-store";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Server-side OTP sender — no Firebase Phone Auth / reCAPTCHA dependency.
 * Uses Fast2SMS (Indian bulk SMS) as primary, with fallback to console log.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, email } = body;

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Invalid 10-digit mobile number" }, { status: 400 });
    }

    // ── Test numbers (dev bypass) ───────────────────────────────────────────
    let code = "";
    if (mobile === "9999999999" || mobile === "9876543210") {
      code = "123456";
      await adminDb.collection("temp_otps").doc(mobile).set({
        code,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        mobile,
      });
      return NextResponse.json({ success: true, message: "OTP sent (dev mode)" }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    // ── Generate and store OTP ──────────────────────────────────────────────
    code = await generateOtp(mobile);

    // WebOTP API-compatible format: @origin #code
    const smsText = `${code} is your TEAM CCTV verification code. Valid 5 mins.\n\n@cctvquotation.com #${code}`;

    let smsSent = false;
    let smsError = "";

    // ── Primary: Fast2SMS (Indian SMS gateway — free tier available) ────────
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey) {
      try {
        const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: code,
            flash: "0",
            numbers: mobile,
          }),
        });
        const smsData = await smsRes.json();
        if (smsData.return === true) {
          smsSent = true;
          console.log(`[send-otp] SMS sent via Fast2SMS to ${mobile}`);
        } else {
          smsError = smsData.message || "Fast2SMS error";
          console.error("[send-otp] Fast2SMS error:", smsData);
        }
      } catch (e: any) {
        smsError = e.message;
        console.error("[send-otp] Fast2SMS exception:", e.message);
      }
    }

    // ── Secondary: Resend (email OTP if email provided and SMS failed) ──────
    if (!smsSent && email && process.env.RESEND_API_KEY) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TEAM CCTV <noreply@cctvquotation.com>",
            to: [email],
            subject: `${code} — Your TEAM CCTV Verification Code`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <h2 style="color:#1e3a5f;margin-bottom:8px">Your Verification Code</h2>
                <p style="color:#555;margin-bottom:24px">Use the code below to access your CCTV quote.</p>
                <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
                  <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1e3a5f">${code}</span>
                </div>
                <p style="color:#888;font-size:13px">This code expires in 5 minutes. Do not share it with anyone.</p>
              </div>
            `,
          }),
        });
        if (emailRes.ok) {
          smsSent = true;
          console.log(`[send-otp] OTP sent via email to ${email}`);
        }
      } catch (e: any) {
        console.error("[send-otp] Resend email error:", e.message);
      }
    }

    // ── Fallback: Log to console (visible in Vercel logs) ──────────────────
    if (!smsSent) {
      console.log(`\n💬 [OTP FALLBACK] To: +91 ${mobile}\nCode: ${code}\nError: ${smsError}\n`);
    }

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json({
      success: true,
      message: smsSent ? "OTP sent successfully" : "OTP generated (SMS gateway unavailable — check logs)",
      smsSent,
      // Only expose code in dev
      ...(isDev && { devCode: code }),
    }, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
    });

  } catch (error) {
    console.error("[send-otp error]:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
