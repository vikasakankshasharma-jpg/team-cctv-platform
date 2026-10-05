import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  try {
    const { fullName, mobile } = await req.json();

    if (!mobile || !fullName) {
      return NextResponse.json(
        { error: "Full Name and Mobile Number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = mobile.toString().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const formattedPhone = `91${cleanPhone}`;
    const docId = `+${formattedPhone}`;

    // Generate 4-digit numeric OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in OTP verifications
    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(docId).set({
      otp,
      expiresAt,
      type: "refer_and_earn",
      fullName: fullName.trim(),
      mobile: cleanPhone,
      createdAt: new Date(),
    });

    console.log(`[Refer & Earn OTP] Sent OTP for +${formattedPhone} (${fullName}): ${otp}`);

    // Dispatch via MSG91 WhatsApp if configured
    const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
    const MSG91_WHATSAPP_NUMBER = process.env.MSG91_WHATSAPP_NUMBER;

    if (MSG91_AUTH_KEY && MSG91_WHATSAPP_NUMBER) {
      const payload = {
        integrated_number: MSG91_WHATSAPP_NUMBER,
        content_type: "template",
        payload: {
          messaging_product: "sms",
          to: formattedPhone,
          type: "template",
          template: {
            name: "cctv_update",
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: [{ type: "text", text: otp }],
              },
            ],
          },
        },
      };

      try {
        await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
          method: "POST",
          headers: {
            authkey: MSG91_AUTH_KEY,
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (smsErr) {
        console.error("[Refer & Earn MSG91 Error]", smsErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Verification code dispatched.",
    });
  } catch (error: any) {
    console.error("[Refer & Earn OTP Send Error]", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
