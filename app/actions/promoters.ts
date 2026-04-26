"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { Promoter } from "@/types";

/**
 * Creates a new Promoter in Firestore
 */
export async function createPromoter(data: { name: string; email: string; mobile_number: string; referral_code: string; is_active: boolean }) {
  await requireAdmin();
  
  const promoterData = {
    ...data,
    total_ex_tax_business: 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  const docRef = await adminDb.collection("promoters").add(promoterData);
  revalidatePath("/admin/promoters");
  return { id: docRef.id, ...promoterData };
}

/**
 * Updates an existing Promoter
 */
export async function updatePromoter(id: string, data: { name?: string; email?: string; mobile_number?: string; is_active?: boolean }) {
  await requireAdmin();

  const updateData = {
    ...data,
    updated_at: new Date()
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
