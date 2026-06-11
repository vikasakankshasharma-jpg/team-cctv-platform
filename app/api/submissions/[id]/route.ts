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
    const currentStatus = leadDoc.data()?.status;
    if (currentStatus !== "partial") {
      return ApiResponse.error("Only partial leads can be updated from this endpoint", "FORBIDDEN", 403);
    }

    await leadRef.update(updateData);

    // --- NOTIFICATIONS TRIGGER ---
    if (body.status === "completed") {
      try {
        const { sendCustomerWhatsApp, sendAdminNotification } = await import("@/lib/notification-service");
        const leadData = leadDoc.data();
        const customerName = leadData?.customer_name || "Customer";
        const mobileNumber = leadData?.mobile_number;
        
        // 1. Send Link to Customer
        if (mobileNumber) {
          const quoteLink = `https://teamcctv.in/quote/${id}`;
          await sendCustomerWhatsApp(
            mobileNumber,
            `👋 Hi ${customerName},\n\nYour customized CCTV quotations are ready! 🎥🛡️\n\nClick the link below to view, compare, and customize your system:\n${quoteLink}\n\nOur team is here if you need any help.\n- TEAM CCTV`
          );
        }

        // 2. Alert Admin/Sales that a partial lead just finished the wizard!
        if (leadData?.assigned_salesperson_id) {
          const spDoc = await adminDb.collection("salespersons").doc(leadData.assigned_salesperson_id).get();
          if (spDoc.exists && spDoc.data()?.mobile_number) {
            await sendCustomerWhatsApp(
              spDoc.data()!.mobile_number,
              `🔥 *Hot Lead Completed Wizard!*\n${customerName} just finished their setup and generated quotes.\nLead ID: ${id}`
            );
          }
        } else {
          await sendAdminNotification(`🔥 *Hot Lead Completed Wizard!*\n${customerName} just generated quotes (Lead ID: ${id}). No specific salesperson is assigned.`);
        }
      } catch (notifyErr) {
        console.error("Failed to send completion notifications:", notifyErr);
      }
    }

    return ApiResponse.success({ message: "Lead updated successfully" });

  } catch (error: any) {
    console.error("Error updating lead:", error);
    return ApiResponse.error("Internal server error", "INTERNAL_ERROR", 500, error.message);
  }
}
