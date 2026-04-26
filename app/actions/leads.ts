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

/**
 * Fetches all quotes associated with a specific lead
 */
export async function getLeadQuotes(leadId: string) {
  await requireAdmin();

  const snapshot = await adminDb
    .collection("leads")
    .doc(leadId)
    .collection("quotes")
    .orderBy("created_at", "desc")
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
    };
  });
}
