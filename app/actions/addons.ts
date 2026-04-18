"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { Addon } from "@/types";

/**
 * Creates a new Add-on in Firestore
 */
export async function createAddon(data: Omit<Addon, "id"> & { technical_name?: string }) {
  await requireAdmin();
  
  const addonData = {
    ...data,
    is_deleted: false,
    created_at: new Date()
  };

  const docRef = await adminDb.collection("addons").add(addonData);
  revalidatePath("/admin/addons");
  return { id: docRef.id, ...addonData };
}

/**
 * Updates an existing Add-on
 */
export async function updateAddon(id: string, data: Partial<Addon> & { technical_name?: string }) {
  await requireAdmin();

  const updateData = {
    ...data,
    updated_at: new Date()
  };

  await adminDb.collection("addons").doc(id).update(updateData);
  revalidatePath("/admin/addons");
  return { id, ...data };
}

/**
 * Soft deletes an Add-on by setting is_deleted: true
 */
export async function deleteAddon(id: string) {
  await requireAdmin();

  await adminDb.collection("addons").doc(id).update({
    is_deleted: true,
    deleted_at: new Date()
  });
  revalidatePath("/admin/addons");
  return { success: true };
}
