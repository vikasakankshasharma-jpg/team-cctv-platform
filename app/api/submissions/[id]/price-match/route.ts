import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { PriceMatchSubmitSchema } from "@/lib/validators";
import { ApiResponse } from "@/lib/api-response";

/**
 * POST /api/leads/[id]/price-match
 * Customer submits a competitor quote for price matching.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id: leadId } = await params;
    if (!leadId) return ApiResponse.badRequest("Lead ID is required");

    const body = await request.json();

    // Validate input
    const validation = PriceMatchSubmitSchema.safeParse({
      ...body,
      lead_id: leadId,
    });

    if (!validation.success) {
      return ApiResponse.badRequest(
        "Invalid price match submission",
        validation.error.format()
      );
    }

    const data = validation.data;

    // Verify the lead exists
    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }

    // Create price match request in subcollection
    const requestRef = leadRef.collection("price_match_requests").doc();
    const priceMatchDoc = {
      lead_id: leadId,
      uploaded_by: body.uploaded_by || "customer",
      uploaded_by_name: data.uploaded_by_name,
      competitor_name: data.competitor_name || null,
      competitor_quote_url: data.competitor_quote_url,
      competitor_total: data.competitor_total || null,
      notes: data.notes || null,
      status: "pending" as const,
      created_at: serverTimestamp(),
    };

    await requestRef.set(priceMatchDoc);

    // Update the lead with the price match reference
    await leadRef.update({
      price_match_request_id: requestRef.id,
      price_match_status: "pending",
      competitor_quote_url: data.competitor_quote_url,
      updated_at: serverTimestamp(),
    });

    return ApiResponse.success(
      {
        id: requestRef.id,
        ...priceMatchDoc,
        created_at: new Date().toISOString(),
      },
      201
    );
  } catch (error: any) {
    console.error("Error creating price match request:", error);
    return ApiResponse.error(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      error.message
    );
  }
}

/**
 * GET /api/leads/[id]/price-match
 * Fetch all price match requests for a lead.
 * No auth required — the lead ID serves as the access token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id: leadId } = await params;
    if (!leadId) return ApiResponse.badRequest("Lead ID is required");

    // Verify the lead exists
    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadDoc = await leadRef.get();
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }

    // Fetch price match requests ordered by created_at desc
    const snapshot = await leadRef
      .collection("price_match_requests")
      .orderBy("created_at", "desc")
      .get();

    const requests = snapshot.docs.map((doc) => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        created_at:
          (docData.created_at as any)?.toDate?.()?.toISOString() ||
          docData.created_at ||
          null,
        reviewed_at:
          (docData.reviewed_at as any)?.toDate?.()?.toISOString() ||
          docData.reviewed_at ||
          null,
      };
    });

    return ApiResponse.success(requests);
  } catch (error: any) {
    console.error("Error fetching price match requests:", error);
    return ApiResponse.error(
      "Internal server error",
      "INTERNAL_ERROR",
      500,
      error.message
    );
  }
}
