"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { Promoter } from "@/types";

/**
 * Creates a new Promoter in Firestore
 * Initializes total_ex_tax_business to 0
 */
export async function createPromoter(data: { name: string; referral_code: string; is_active: boolean }) {
  await requireAdmin();
  
  const promoterData = {
    ...data,
    total_ex_tax_business: 0,
    created_at: new Date()
  };

  const docRef = await adminDb.collection("promoters").add(promoterData);
  revalidatePath("/admin/promoters");
  return { id: docRef.id, ...promoterData };
}

/**
 * Updates an existing Promoter (Name and Status)
 */
export async function updatePromoter(id: string, data: { name?: string; is_active?: boolean }) {
  await requireAdmin();

  const updateData = {
    ...data,
  };

  await adminDb.collection("promoters").doc(id).update(updateData);
  revalidatePath("/admin/promoters");
  return { id, ...data };
}

/**
 * Bans a promoter by setting `is_active` to false instead of deleting
 * them, to maintain foreign key integrity across commissions.
 */
export async function banPromoter(id: string) {
  await requireAdmin();

  await adminDb.collection("promoters").doc(id).update({
    is_active: false
  });
  revalidatePath("/admin/promoters");
  return { success: true };
}
