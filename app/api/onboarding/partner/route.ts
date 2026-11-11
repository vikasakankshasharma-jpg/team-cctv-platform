import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { z } from "zod";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

const OnboardingSchema = z.object({
  name: z.string().min(2),
  business_name: z.string().min(2),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  partner_type: z.enum(["promoter", "dealer"]),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

function generateReferralCode(name: string, business: string): string {
  const prefix = name.substring(0, 2).toUpperCase() + business.substring(0, 2).toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${suffix}`;
}

async function getUniqueReferralCode(name: string, business: string): Promise<string> {
  let code = generateReferralCode(name, business);
  let attempts = 0;
  while (attempts < 10) {
    const existing = await adminDb.collection("promoters").where("referral_code", "==", code).limit(1).get();
    if (existing.empty) return code;
    code = generateReferralCode(name, business);
    attempts++;
  }
  // Fallback: use timestamp-based code to guarantee uniqueness
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
    const validation = OnboardingSchema.safeParse(body);
    
    if (!validation.success) {
      return ApiResponse.badRequest(getApiMessage(locale, "lead_validation_failed"), validation.error.format());
    }

    const data = validation.data;

    // Check if mobile already exists
    const existing = await adminDb.collection("promoters").where("mobile_number", "==", data.mobile_number).get();
    if (!existing.empty) {
      return ApiResponse.badRequest(getApiMessage(locale, "partner_already_registered"));
    }

    const referralCode = generateReferralCode(data.name, data.business_name);

    const docRef = adminDb.collection("promoters").doc();
    await docRef.set({
      id: docRef.id,
      name: data.name,
      business_name: data.business_name,
      mobile_number: data.mobile_number,
      email: data.email,
      partner_type: data.partner_type, // "promoter" or "dealer"
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      lat: data.lat || null,
      lng: data.lng || null,
      referral_code: referralCode,
      is_active: true, // Auto-approve for now, or could set to false pending admin approval
      discount_type: "percent",
      discount_value: 3,
      use_global_commission: false,
      commission_slabs: [{ from: 0, to: null, type: "percent", value: 2 }],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Send WhatsApp notification
    try {
      const { sendCustomerWhatsApp, sendAdminNotification } = await import("@/lib/notification-service");
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
        notif.partnerWelcome({ name: data.name, code: referralCode, portalUrl })
      );
      await sendAdminNotification(`New ${data.partner_type.toUpperCase()} registered: ${data.name} (${data.business_name})`);
    } catch (e) {
      console.error("Failed to send onboarding notification", e);
    }

    return ApiResponse.success({ 
      id: docRef.id, 
      referral_code: referralCode,
      message: "Registration successful" 
    }, 201);
  } catch (err: any) {
    console.error("[Partner Onboarding Error]", err);
    return ApiResponse.error(getApiMessage(locale, "internal_error"), "INTERNAL_ERROR", 500);
  }
}
