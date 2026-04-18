"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

/**
 * Updates the status of a lead.
 * Transitioning to "won" will trigger downstream commission logic via Cloud Functions.
 */
export async function updateLeadStatus(leadId: string, status: string) {
  await requireAdmin();

  await adminDb.collection("leads").doc(leadId).update({
    status,
    updated_at: new Date()
  });

  revalidatePath("/admin/leads");
  return { success: true };
}
