import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { PriceMatchReviewSchema } from "@/lib/validators";
import { ApiResponse } from "@/lib/api-response";
import { verifySession } from "@/lib/auth-server";
import type { Lead, Salesperson } from "@/types";

/**
 * PATCH /api/leads/[id]/price-match/[requestId]
 * Staff (admin or assigned salesperson) reviews a price match request.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id: leadId, requestId } = await params;
    if (!leadId || !requestId) {
      return ApiResponse.badRequest("Lead ID and Request ID are required");
    }

    // Auth check — must be admin or salesperson
    const session = await verifySession();
    if (!session.isAuthenticated || !session.user) {
      return ApiResponse.unauthorized("Authentication required");
    }

    const reviewerUid = session.user.uid;
    const reviewerRole = session.role;

    // Validate input
    const body = await request.json();
    const validation = PriceMatchReviewSchema.safeParse(body);
    if (!validation.success) {
      return ApiResponse.badRequest(
        "Invalid review payload",
        validation.error.format()
      );
    }

    const reviewData = validation.data;

    // Verify lead exists
    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }
    const leadData = leadDoc.data() as Lead;

    // Verify price match request exists
    const requestRef = leadRef
      .collection("price_match_requests")
      .doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return ApiResponse.error(
        "Price match request not found",
        "NOT_FOUND",
        404
      );
    }

    // Determine reviewer name
    let reviewerName = session.user.email || "Staff";
    let reviewerRoleLabel: "admin" | "salesperson" = "admin";

    // If salesperson, verify they are assigned to this lead and check discount limits
    if (reviewerRole === "sales_staff") {
      reviewerRoleLabel = "salesperson";

      // Look up salesperson record by firebase_uid
      const salespersonSnap = await adminDb
        .collection("salespersons")
        .where("firebase_uid", "==", reviewerUid)
        .limit(1)
        .get();

      if (!salespersonSnap.empty) {
        const salesperson = salespersonSnap.docs[0].data() as Salesperson;
        reviewerName = salesperson.name;

        // Check discount approval limit
        if (
          reviewData.approved_discount_percent &&
          salesperson.max_discount_approval_percent !== undefined
        ) {
          if (
            reviewData.approved_discount_percent >
            salesperson.max_discount_approval_percent
          ) {
            return ApiResponse.forbidden(
              `Discount exceeds your approval limit of ${salesperson.max_discount_approval_percent}%. Please escalate to Admin.`
            );
          }
        }
      }
    }

    // Update the price match request
    const updatePayload: Record<string, unknown> = {
      status: reviewData.status,
      reviewer_id: reviewerUid,
      reviewer_name: reviewerName,
      reviewer_role: reviewerRoleLabel,
      review_notes: reviewData.review_notes || null,
      reviewed_at: serverTimestamp(),
    };

    if (reviewData.approved_discount_percent !== undefined) {
      updatePayload.approved_discount_percent =
        reviewData.approved_discount_percent;
    }
    if (reviewData.approved_discount_flat !== undefined) {
      updatePayload.approved_discount_flat = reviewData.approved_discount_flat;
    }
    if (reviewData.counter_offer_amount !== undefined) {
      updatePayload.counter_offer_amount = reviewData.counter_offer_amount;
    }

    await requestRef.update(updatePayload);

    // Update lead's price_match_status
    const leadUpdate: Record<string, unknown> = {
      price_match_status: reviewData.status,
      updated_at: serverTimestamp(),
    };

    // If approved with a discount, apply it to the lead's active_offer
    if (reviewData.status === "approved") {
      if (reviewData.approved_discount_percent) {
        leadUpdate.active_offer = {
          type: "discount_percent",
          value: reviewData.approved_discount_percent,
          campaign_id: `price_match_${requestId}`,
        };
      }
    }

    await leadRef.update(leadUpdate);

    // Return updated request data
    return ApiResponse.success({
      id: requestId,
      ...updatePayload,
      reviewed_at: new Date().toISOString(),
      message: `Price match request ${reviewData.status} successfully`,
    });
  } catch (error: any) {
    console.error("Error reviewing price match request:", error);
    return ApiResponse.error(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      error.message
    );
  }
}
