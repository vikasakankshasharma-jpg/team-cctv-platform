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
    }

    await jobRef.update(updates);

    // If an installer was assigned, we can notify them.
    if (payload.installer_id) {
      const installerDoc = await adminDb.collection("installers").doc(payload.installer_id).get();
      if (installerDoc.exists) {
        const installerName = installerDoc.data()?.name || "Installer";
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
