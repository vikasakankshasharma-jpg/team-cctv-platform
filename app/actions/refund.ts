"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { msg91 } from "@/lib/whatsapp/msg91-provider";
import { revalidatePath } from "next/cache";

export async function initiateRefund(leadId: string, amount: number, orderId: string, reason: string) {
  try {
    const admin = await requireAdmin();
    if (admin.role !== "super_admin") {
      throw new Error("Only super_admins can initiate refunds.");
    }

    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();

    if (!leadSnap.exists) {
      throw new Error("Lead not found");
    }

    const leadData = leadSnap.data();
    
    // Save refund record
    await leadRef.collection("refunds").add({
      amount,
      order_id: orderId,
      reason,
      initiated_by: admin.user?.uid || "system",
      initiated_at: new Date().toISOString(),
      status: "INITIATED"
    });

    // Send WhatsApp Alert
    if (leadData?.customer_phone || leadData?.mobile_number) {
      const phone = leadData?.customer_phone || leadData?.mobile_number;
      const name = leadData?.customer_name || "Customer";
      
      try {
        await msg91.sendRefundInitiated({
          phone,
          customerName: name,
          amount,
          orderId
        });
      } catch (waErr) {
        console.error("Failed to send Refund WhatsApp:", waErr);
      }
    }

    revalidatePath(`/admin/leads/${leadId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Refund Initiation Error:", error);
    return { success: false, error: error.message };
  }
}
