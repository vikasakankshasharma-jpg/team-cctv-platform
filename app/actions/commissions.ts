"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { COLLECTIONS } from "@/lib/firebase-client";

/**
 * Marks a commission record as settled (paid).
 * Requires admin session.
 */
export async function markCommissionPaid(id: string) {
  const session = await requireAdmin();

  const recordRef = adminDb.collection(COLLECTIONS.COMMISSION_RECORDS).doc(id);
  const snapshot = await recordRef.get();

  if (!snapshot.exists) {
    throw new Error("Commission record not found");
  }

  const data = snapshot.data();
  if (data?.status === "paid") {
    return { success: true, message: "Already paid" };
  }

  await recordRef.update({
    status: "paid",
    paid_at: new Date(),
    updated_at: new Date(),
    updated_by: session.user?.email || "unknown_admin"
  });

  revalidatePath("/admin/commission");
  return { success: true };
}
