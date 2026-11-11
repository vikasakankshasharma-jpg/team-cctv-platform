import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";
import { cleanEnvVar, cleanPhoneEnvVar } from "@/lib/env-utils";
import { Msg91WhatsAppProvider } from "@/lib/whatsapp/msg91-provider";

export async function POST(req: Request) {
  let locale = resolveRequestLocale(req);
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json(
      { error: getApiMessage(locale, "too_many_requests") },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    locale = resolveRequestLocale(req, body);
    const { fullName, mobile } = body;

    if (!mobile || !fullName) {
      return NextResponse.json(
        { error: getApiMessage(locale, "name_mobile_required") },
        { status: 400 }
      );
    }

    const cleanPhone = mobile.toString().replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10 || !/^[6-9]/.test(cleanPhone)) {
      return NextResponse.json(
        { error: getApiMessage(locale, "phone_invalid") },
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
    const MSG91_AUTH_KEY = cleanEnvVar(process.env.MSG91_AUTH_KEY);
    const MSG91_WHATSAPP_NUMBER = cleanPhoneEnvVar(process.env.MSG91_WHATSAPP_NUMBER);

    if (MSG91_AUTH_KEY && MSG91_WHATSAPP_NUMBER) {
      const msg91 = new Msg91WhatsAppProvider();
      const result = await msg91.sendOtpTemplate(formattedPhone, otp);
      if (!result.success) {
        console.error("[Refer & Earn MSG91 Error]", result.error);
        return NextResponse.json(
          { error: getApiMessage(locale, "otp_service_error") },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: getApiMessage(locale, "otp_sent_whatsapp"),
    });
  } catch (error: any) {
    console.error("[Refer & Earn OTP Send Error]", error);
    return NextResponse.json({ error: getApiMessage(locale, "internal_error") }, { status: 500 });
  }
}
