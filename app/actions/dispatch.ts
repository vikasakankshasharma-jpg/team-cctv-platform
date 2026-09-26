"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin, verifySession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { sendAdminNotification, sendCustomerWhatsApp } from "@/lib/notification-service";

/**
 * Assigns a Job to a Hub or Installer
 */
export async function assignJob(
  jobId: string, 
  payload: { hub_id?: string; installer_id?: string }
) {
  try {
    await requireAdmin();

    const jobRef = adminDb.collection("jobs").doc(jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return { success: false, error: "Job not found" };
    }

    const updates: any = {};
    if (payload.hub_id !== undefined) updates.hub_id = payload.hub_id;
    
    // If we're assigning an installer, explicitly update the status to dispatched
    if (payload.installer_id !== undefined) {
      updates.installer_id = payload.installer_id;
      updates.status = "dispatched";
      updates.dispatched_at = new Date();
      updates.sla_breach_at = new Date(Date.now() + 48 * 60 * 60 * 1000);
      updates.is_escalated = false;
    }

    await jobRef.update(updates);

    // If an installer was assigned, we can notify them and sync the lead.
    if (payload.installer_id) {
      const installerDoc = await adminDb.collection("installers").doc(payload.installer_id).get();
      if (installerDoc.exists) {
        const installerName = installerDoc.data()?.name || "Installer";
        
        // Sync to Lead
        // Sync to Lead and generate OTP if it doesn't exist
        const jobData = jobDoc.data();
        if (jobData?.lead_id) {
          const leadRef = adminDb.collection("leads").doc(jobData.lead_id);
          const leadSnap = await leadRef.get();
          const leadData = leadSnap.data();
          
          let pin = leadData?.completion_pin;
          if (!pin) {
            pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN
          }

          await leadRef.update({
            assigned_to_installer_id: payload.installer_id,
            assigned_installer_name: installerName,
            completion_pin: pin,
            updated_at: new Date()
          });

          // Notify Customer
          if (leadData?.mobile_number) {
            const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/track/${jobData.lead_id}`;
            await sendCustomerWhatsApp(
              leadData.mobile_number,
              `✅ *Installer Assigned!*\n\nHi ${leadData.customer_name},\nYour CCTV installer, ${installerName}, has been assigned and will be on their way shortly.\n\n*Track your installation status and view your secure Completion PIN here:*\n${trackingUrl}\n\nDo not share your PIN until the work is completed to your satisfaction.`
            );
          }
        }

        const mobile = installerDoc.data()?.mobile_number;
        
        if (mobile) {
          const { msg91 } = await import("@/lib/whatsapp/msg91-provider");
          const jobData = jobDoc.data();
          let address = "Customer Address";
          let custPhone = "Customer Phone";
          let customerName = "Customer";
          if (jobData?.lead_id) {
            const leadSnap = await adminDb.collection("leads").doc(jobData.lead_id).get();
            const lData = leadSnap.data();
            if (lData) {
              address = lData.installation_address || "Customer Address";
              custPhone = lData.mobile_number || "Customer Phone";
              customerName = lData.customer_name || "Customer";
            }
          }
          
          let scheduledDate = "As scheduled";
          if (jobData?.scheduled_at) {
             scheduledDate = typeof jobData.scheduled_at === "string" ? jobData.scheduled_at : "Scheduled date";
             if (jobData?.time_slot) scheduledDate += ` (${jobData.time_slot})`;
          }

          const jobTypeLabel = jobData?.type === "survey" ? "Site Survey Visit"
            : jobData?.type === "WARRANTY_SERVICE" ? "Warranty Service"
            : jobData?.type === "AMC_SERVICE" ? "AMC Service Visit"
            : "CCTV Installation";
          
          await msg91.sendJobAlert({
            phone: mobile,
            recipientName: installerName,
            jobType: jobTypeLabel,
            customer: `${customerName} (${custPhone})`,
            customerAddress: address,
            scheduledDate: scheduledDate
          });
        }
        await sendAdminNotification(`📦 Job ${jobId.substring(0,8).toUpperCase()} dispatched to ${installerName}.`);
      }
    }

    revalidatePath("/admin/dispatch");
    revalidatePath("/installer/jobs");
    
    return { success: true };
  } catch (err: any) {
    console.error("Assign Job Error:", err);
    return { success: false, error: err.message || "Failed to assign job." };
  }
}


export async function reportDeliveryFailure(quoteId: string, leadId: string, reason: string) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) return { success: false, error: 'Unauthorized' };

    const batch = adminDb.batch();
    
    // Update Quote
    if (quoteId) {
      batch.update(adminDb.collection('quotes').doc(quoteId), {
        delivery_status: 'FAILED',
        delivery_failure_reason: reason,
        updated_at: new Date()
      });
    }

    // Update Lead
    if (leadId) {
      batch.update(adminDb.collection('leads').doc(leadId), {
        delivery_status: 'FAILED',
        updated_at: new Date()
      });
      
      // Add a note
      batch.set(adminDb.collection('leads').doc(leadId).collection('notes').doc(), {
        content: `DELIVERY FAILED / RETURN TO HUB: ${reason}`,
        created_at: new Date(),
        created_by: session.uid,
        created_by_name: session.user?.name || 'Delivery Staff',
        created_by_role: session.role
      });
    }

    await batch.commit();
    revalidatePath('/delivery/route');
    revalidatePath(`/delivery/${quoteId}`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Failed to report delivery failure:', error);
    return { success: false, error: error.message };
  }
}

