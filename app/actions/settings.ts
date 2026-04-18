"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import type { AppSettings } from "@/types";

/**
 * Updates the global application settings in Firestore.
 * Requires admin session.
 */
export async function updateSettings(data: Partial<AppSettings>) {
  const session = await requireAdmin();

  const settingsData = {
    ...data,
    updated_at: new Date(),
    updated_by: session.user?.email || "unknown_admin"
  };

  await adminDb
    .collection("settings")
    .doc(SETTINGS_DOC_ID)
    .set(settingsData, { merge: true });

  revalidatePath("/admin/settings");
  revalidatePath("/"); // Revalidate home page if settings are used there (e.g. company name)
  
  return { success: true };
}
