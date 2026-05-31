import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { z } from "zod";

const OnboardingSchema = z.object({
  name: z.string().min(2),
  business_name: z.string().min(2),
  mobile_number: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  partner_type: z.enum(["promoter", "dealer"]),
});

function generateReferralCode(name: string, business: string): string {
  const prefix = name.substring(0, 2).toUpperCase() + business.substring(0, 2).toUpperCase();
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${suffix}`;
}

export async function POST(req: NextRequest) {
  const { success } = await rateLimit(req);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await req.json();
    const validation = OnboardingSchema.safeParse(body);
    
    if (!validation.success) {
      return ApiResponse.badRequest("Validation failed", validation.error.format());
    }

    const data = validation.data;

    // Check if mobile already exists
    const existing = await adminDb.collection("promoters").where("mobile_number", "==", data.mobile_number).get();
    if (!existing.empty) {
      return ApiResponse.badRequest("A partner with this mobile number already exists.");
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
      referral_code: referralCode,
      is_active: true, // Auto-approve for now, or could set to false pending admin approval
      discount_type: "percent",
      discount_value: 5,
      use_global_commission: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Send WhatsApp notification
    try {
      const { sendCustomerWhatsApp, sendAdminNotification } = await import("@/lib/notification-service");
      await sendCustomerWhatsApp(
        data.mobile_number,
        `🎉 Welcome to TEAM CCTV, ${data.name}!\n\nYour Partner account has been created.\nYour unique Referral Code is: *${referralCode}*\n\nYou can now log in to your partner portal at https://teamcctv.in/partner/login`
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
    return ApiResponse.error("Registration failed", "INTERNAL_ERROR", 500);
  }
}
