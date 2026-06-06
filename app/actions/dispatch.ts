"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
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
            pin = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit PIN
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
        // Mock sending WhatsApp to installer
        if (mobile) {
          await sendCustomerWhatsApp(
            mobile, 
            `🚨 *New Job Assigned!*\nJob ID: ${jobId.substring(0,8).toUpperCase()}\nPlease check your dashboard.`
          );
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
