import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { z } from "zod";

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
  const { success } = await rateLimit(req);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const body = await req.json();
    const validation = B2CJoinSchema.safeParse(body);
    
    if (!validation.success) {
      return ApiResponse.badRequest("Validation failed", validation.error.format());
    }

    const data = validation.data;

    // Check if mobile already exists
    const existing = await adminDb.collection("promoters").where("mobile_number", "==", data.mobile_number).get();
    if (!existing.empty) {
      return ApiResponse.badRequest("You are already registered! Please login to your dashboard.");
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
      await sendCustomerWhatsApp(
        data.mobile_number,
        `🎉 Welcome to TEAM CCTV Refer & Earn, ${data.name}!\n\nYour unique Referral Code is: *${referralCode}*\n\nShare this code with friends. They get a ₹500 discount, and you earn ₹500 cash per installation!\n\nLogin to your dashboard: https://teamcctv.in/partner/login`
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
    return ApiResponse.error("Registration failed", "INTERNAL_ERROR", 500);
  }
}
