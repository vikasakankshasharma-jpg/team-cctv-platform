import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";
import { getApiMessage, resolveRequestLocale } from "@/lib/i18n/api-messages";

export async function GET(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const { success } = await rateLimit(req);
  if (!success) {
    return ApiResponse.error(getApiMessage(locale, "too_many_requests"), "RATE_LIMIT_EXCEEDED", 429);
  }

  const code = req.nextUrl.searchParams.get("code");
  
  if (!code || code.trim().length === 0) {
    return ApiResponse.badRequest(getApiMessage(locale, "referral_required"));
  }

  try {
    const promoterSnap = await adminDb
      .collection("promoters")
      .where("referral_code", "==", code.toUpperCase().trim())
      .where("is_active", "==", true)
      .limit(1)
      .get();

    if (promoterSnap.empty) {
      return ApiResponse.success({ valid: false, message: getApiMessage(locale, "referral_invalid") });
    }

    const promoter = promoterSnap.docs[0].data();

    // Default to B2B schema (percent) if not explicitly set
    const discountType = promoter.discount_type || "percent";
    const discountValue = promoter.discount_value || 0;

    return ApiResponse.success({
      valid: true,
      partner_name: promoter.name || "Partner",
      partner_business: promoter.business_name || "",
      partner_type: promoter.partner_type || (discountType === "flat" ? "flat" : "percent"),
      discount_type: discountType,
      discount_value: discountValue,
      min_order_value: promoter.min_order_value || 0,
      message: discountType === "flat" && promoter.min_order_value
        ? getApiMessage(locale, "referral_applied_flat", {
            discount: discountValue,
            minOrder: promoter.min_order_value,
          })
        : getApiMessage(locale, "referral_applied")
    });
  } catch (error) {
    console.error("[Validate Referral Error]", error);
    return ApiResponse.error(getApiMessage(locale, "referral_failed"), "INTERNAL_ERROR", 500);
  }
}
