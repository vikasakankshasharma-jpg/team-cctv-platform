import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

const B2CJoinSchema = z.object({
  name: z.string().min(2),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/)
});

async function getUniqueReferralCode(name: string): Promise<string> {
  const prefix = name.substring(0, 4).toUpperCase().padEnd(4, 'X');
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    code = `${prefix}${suffix}`;
    const existing = await adminDb.collection("promoters").where("referral_code", "==", code).limit(1).get();
    if (existing.empty) return code;
    attempts++;
  }
  return `TEAM${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function POST(req: NextRequest) {
  let locale = resolveRequestLocale(req);
  const { success } = await rateLimit(req);
  if (!success) {
    return ApiResponse.error(getApiMessage(locale, "too_many_requests"), "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await req.json();
    locale = resolveRequestLocale(req, body);
    const validation = B2CJoinSchema.safeParse(body);
    
    if (!validation.success) {
      return ApiResponse.badRequest(getApiMessage(locale, "lead_validation_failed"), validation.error.format());
    }

    const data = validation.data;

    // Check if mobile already exists
    const existing = await adminDb.collection("promoters").where("mobile_number", "==", data.mobile_number).get();
    if (!existing.empty) {
      return ApiResponse.badRequest(getApiMessage(locale, "partner_already_registered"));
    }

    const referralCode = await getUniqueReferralCode(data.name);

    const docRef = adminDb.collection("promoters").doc();
    await docRef.set({
      id: docRef.id,
      name: data.name,
      business_name: "Individual Partner", // Default for B2C
      mobile_number: data.mobile_number,
      partner_type: "individual", // B2C flag
      referral_code: referralCode,
      is_active: true, // Auto-approve individuals
      
      // B2C Specific Scheme: Flat ₹500
      discount_type: "flat",
      discount_value: 500,
      use_global_commission: false,
      commission_slabs: [{ from: 0, to: null, type: "flat", value: 500 }],
      
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Send WhatsApp notification
    try {
      const { sendCustomerWhatsApp } = await import("@/lib/notification-service");
      const { resolveCustomerLocale, getCustomerNotifications } = await import("@/lib/whatsapp/customer-notifications-i18n");
      const custLocale = await resolveCustomerLocale({
        preferredLanguage: body?.preferred_language,
        cookieLocale: req.cookies.get("team_locale")?.value,
        phone: data.mobile_number,
      });
      const notif = getCustomerNotifications(custLocale);
      const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://teamcctv.in"}/partner/login`;
      await sendCustomerWhatsApp(
        data.mobile_number,
        notif.referEarnWelcome({ name: data.name, code: referralCode, portalUrl })
      );
    } catch (e) {
      console.error("Failed to send welcome notification", e);
    }

    return ApiResponse.success({ 
      id: docRef.id, 
      referral_code: referralCode,
      message: "Registration successful" 
    }, 201);
  } catch (err: any) {
    console.error("[B2C Join Error]", err);
    return ApiResponse.error(getApiMessage(locale, "internal_error"), "INTERNAL_ERROR", 500);
  }
}
