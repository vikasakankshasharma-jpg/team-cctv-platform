import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/api-response";

/**
 * Partial Lead Update endpoint.
 * Used exclusively for saving 'partial' cart abandonment data mid-wizard
 * or transitioning a 'partial' lead to 'completed' / 'new'.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { success } = await rateLimit(request);
  if (!success) {
    return ApiResponse.error("Too many requests", "RATE_LIMIT_EXCEEDED", 429);
  }

  try {
    const { id } = await params;
    if (!id) return ApiResponse.badRequest("Lead ID is required");

    const body = await request.json();

    // Ensure we are only updating safe fields from the wizard flow
    const updateData: any = {
      updated_at: serverTimestamp(),
    };

    if (body.wizard_answers) {
      updateData.wizard_answers = body.wizard_answers;
    }
    
    // When final step is completed, it transitions to "new" so sales can see it
    if (body.status === "completed") {
      updateData.status = "new"; // "completed" the wizard, so it is a "new" lead to the system
      
      // Update metadata extracted from wizard
      if (body.property_type) updateData.property_type = body.property_type;
      if (body.technology_choice) updateData.technology_choice = body.technology_choice;
      if (typeof body.cabling_done === "boolean") {
        updateData.cabling_done = body.cabling_done;
        updateData.is_hot_lead = body.cabling_done;
      }
    }

    const leadRef = adminDb.collection("leads").doc(id);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      return ApiResponse.error("Lead not found", "NOT_FOUND", 404);
    }

    // Security: Only allow updating leads that are currently 'partial'
    if (leadDoc.data()?.status !== "partial") {
      return ApiResponse.error("Only partial leads can be updated from this endpoint", "FORBIDDEN", 403);
    }

    await leadRef.update(updateData);

    return ApiResponse.success({ message: "Lead updated successfully" });

  } catch (error: any) {
    console.error("Error updating lead:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
