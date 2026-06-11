import { NextRequest, NextResponse } from "next/server";
import { generateOtp } from "@/lib/otp-store";
import { adminDb } from "@/lib/firebase-admin";

/**
 * Server-side OTP sender — no Firebase Phone Auth / reCAPTCHA dependency.
 * Delivery priority:
 *  1. Fast2SMS (Indian SMS gateway) — if FAST2SMS_API_KEY set
 *  2. Resend email — if email provided and RESEND_API_KEY set
 *  3. Logs OTP to Vercel Function logs (visible to admin)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mobile, email } = body;

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ error: "Invalid 10-digit mobile number" }, { status: 400 });
    }



    // ── Generate and store OTP ──────────────────────────────────────────────
    const code = await generateOtp(mobile);

    // WebOTP API-compatible SMS text
    const smsText = `${code} is your TEAM CCTV verification code. Valid 5 mins.\n\n@cctvquotation.com #${code}`;

    let smsSent = false;
    let deliveryMethod = "none";

    // ── 1. Fast2SMS (primary Indian SMS) ───────────────────────────────────
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    if (fast2smsKey && fast2smsKey !== "placeholder") {
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
          deliveryMethod = "fast2sms";
          console.log(`[send-otp] ✅ SMS sent via Fast2SMS to ${mobile}`);
        } else {
          console.error("[send-otp] Fast2SMS error:", JSON.stringify(smsData));
        }
      } catch (e: any) {
        console.error("[send-otp] Fast2SMS exception:", e.message);
      }
    }

    // ── 2. Resend email OTP (secondary) ────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    if (!smsSent && resendKey) {
      // Try to send to a derived email or provided email
      const targetEmail = email || null;
      if (targetEmail) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "TEAM CCTV <noreply@cctvquotation.com>",
              to: [targetEmail],
              subject: `${code} — Your TEAM CCTV Verification Code`,
              html: `
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff">
                  <div style="background:#1e3a5f;padding:20px 24px;border-radius:12px 12px 0 0">
                    <h1 style="color:#fff;margin:0;font-size:20px;font-weight:900">TEAM CCTV</h1>
                    <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Verification Code</p>
                  </div>
                  <div style="padding:28px 24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px">
                    <p style="color:#374151;font-size:15px;margin:0 0 20px">Use this code to verify your phone number and access your CCTV quotation:</p>
                    <div style="background:#f0f4ff;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px">
                      <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#1e3a5f;font-family:monospace">${code}</div>
                    </div>
                    <p style="color:#6b7280;font-size:13px;margin:0">Valid for <strong>5 minutes</strong>. Do not share with anyone.</p>
                    <p style="color:#6b7280;font-size:13px;margin:8px 0 0">This is for phone <strong>+91 ${mobile}</strong></p>
                  </div>
                </div>
              `,
            }),
          });
          if (emailRes.ok) {
            smsSent = true;
            deliveryMethod = "resend_email";
            console.log(`[send-otp] ✅ OTP sent via Resend email to ${targetEmail}`);
          } else {
            const errBody = await emailRes.text();
            console.error("[send-otp] Resend error:", errBody);
          }
        } catch (e: any) {
          console.error("[send-otp] Resend exception:", e.message);
        }
      }
    }

    // ── 3. Final fallback — log to Vercel function output ──────────────────
    if (!smsSent) {
      // This is visible in Vercel dashboard → Logs for /api/send-otp
      console.log(`
╔═══════════════════════════════════════════╗
║  [OTP FALLBACK — No SMS gateway active]   ║
║  Mobile : +91 ${mobile}              ║
║  Code   : ${code}                         ║
║  Valid  : 5 minutes                       ║
╚═══════════════════════════════════════════╝
      `);
      deliveryMethod = "logs_only";
    }

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json({
      success: true,
      smsSent,
      deliveryMethod,
      message: smsSent
        ? `Verification code sent via ${deliveryMethod === "fast2sms" ? "SMS" : "email"}`
        : "OTP generated — SMS gateway not configured. Contact support.",
      // Only expose in local dev
      ...(isDev && { devCode: code }),
    }, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
    });

  } catch (error) {
    console.error("[send-otp error]:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
