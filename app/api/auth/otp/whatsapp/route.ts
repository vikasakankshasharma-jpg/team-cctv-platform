import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = "91" + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      formattedPhone = cleanPhone;
    } else {
      return NextResponse.json({ error: "Invalid phone number format." }, { status: 400 });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.info(`[WhatsApp] Generating OTP for ${formattedPhone}`);

    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(`+${formattedPhone}`).set({
      otp,
      expiresAt,
      type: "whatsapp",
      createdAt: new Date(),
    });

    const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
    const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return NextResponse.json({ error: "WhatsApp service is not configured correctly." }, { status: 500 });
    }

    const payload = {
      messaging_product: "whatsapp",
      to: formattedPhone,
      type: "template",
      template: {
        name: "team_cctv_otp",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: otp }]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: otp }]
          }
        ]
      }
    };

    const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[WhatsApp] API Error:", responseData);
      return NextResponse.json({ error: "Template does not exist or failed to send." }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "WhatsApp OTP sent." });
  } catch (error: any) {
    console.error("WhatsApp OTP Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
