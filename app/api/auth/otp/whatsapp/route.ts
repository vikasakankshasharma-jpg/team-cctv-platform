import { NextResponse } from "next/server";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";
import { Msg91WhatsAppProvider } from "@/lib/whatsapp/msg91-provider";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let locale = resolveRequestLocale(req);
  const { success } = await rateLimit(req);
  if (!success) {
    return NextResponse.json({ error: getApiMessage(locale, "too_many_requests") }, { status: 429 });
  }

  try {
    const body = await req.json();
    locale = resolveRequestLocale(req, body);
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: getApiMessage(locale, "phone_required") }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, "");
    
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = "91" + cleanPhone;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
      formattedPhone = cleanPhone;
    } else {
      return NextResponse.json({ error: getApiMessage(locale, "phone_invalid") }, { status: 400 });
    }

    let role = "customer";
    let userName = "Valued Customer";
    const normalized = cleanPhone.length === 12 ? cleanPhone.substring(2) : cleanPhone;

    // RBAC Lookup
    const adminSnap = await adminDb.collection("admins").where("mobile_number", "==", normalized).where("is_active", "==", true).limit(1).get();
    if (!adminSnap.empty) { role = "super_admin"; userName = adminSnap.docs[0].data().name || "Administrator"; }
    else {
      const spSnap = await adminDb.collection("salespeople").where("mobile_number", "==", normalized).where("is_active", "==", true).limit(1).get();
      if (!spSnap.empty) { role = "sales_staff"; userName = spSnap.docs[0].data().name || "Sales Professional"; }
      else {
        const partnerSnap = await adminDb.collection("promoters").where("mobile_number", "==", normalized).where("status", "==", "approved").limit(1).get();
        if (!partnerSnap.empty) { role = "partner"; userName = partnerSnap.docs[0].data().name || "Partner"; }
        else {
          const instSnap = await adminDb.collection("installers").where("mobile_number", "==", normalized).where("status", "in", ["active", "approved"]).limit(1).get();
          if (!instSnap.empty) { role = "installer"; userName = instSnap.docs[0].data().name || "Installer"; }
        }
      }
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.info(`[WhatsApp] Generating 4-digit OTP for ${formattedPhone} (Role: ${role})`);

    await adminDb.collection(COLLECTIONS.OTP_VERIFICATIONS).doc(`+${formattedPhone}`).set({
      otp,
      expiresAt,
      type: "whatsapp",
      role,
      name: userName,
      createdAt: new Date(),
    });

    const msg91 = new Msg91WhatsAppProvider();
    const result = await msg91.sendOtpTemplate(formattedPhone, otp);

    if (result.missingCredentials) {
      console.error("[MSG91 WhatsApp] Missing credentials in environment.");
      return NextResponse.json({ error: getApiMessage(locale, "otp_service_error") }, { status: 500 });
    }

    if (!result.success) {
      console.error("[MSG91 WhatsApp] API Error:", result.error);
      return NextResponse.json({ error: getApiMessage(locale, "otp_service_error") }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: getApiMessage(locale, "otp_sent_whatsapp") });
  } catch (error: any) {
    console.error("WhatsApp OTP Error:", error);
    return NextResponse.json({ error: getApiMessage(locale, "internal_error") }, { status: 500 });
  }
}
