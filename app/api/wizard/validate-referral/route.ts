import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { success } = await rateLimit(req);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  const code = req.nextUrl.searchParams.get("code");
  
  if (!code || code.trim().length === 0) {
    return ApiResponse.badRequest("Referral code is required");
  }

  try {
    const promoterSnap = await adminDb
      .collection("promoters")
      .where("referral_code", "==", code.toUpperCase().trim())
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (promoterSnap.empty) {
      return ApiResponse.success({ valid: false, message: "Invalid or inactive referral code" });
    }

    const promoter = promoterSnap.docs[0].data();

    // Default to B2B schema (percent) if not explicitly set
    const discountType = promoter.discount_type || "percent";
    const discountValue = promoter.discount_value || 0;

    return ApiResponse.success({
      valid: true,
      partner_name: promoter.name || "Partner",
      partner_business: promoter.business_name || "",
      discount_type: discountType,
      discount_value: discountValue,
      message: "Referral code applied successfully!"
    });
  } catch (error) {
    console.error("[Validate Referral Error]", error);
    return ApiResponse.error("Failed to validate referral code", "INTERNAL_ERROR", 500);
  }
}
