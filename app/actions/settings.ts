"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireSuperAdmin } from "@/lib/auth-server";
import { revalidatePath, revalidateTag } from "next/cache";
import { SETTINGS_DOC_ID } from "@/lib/constants";
import { createAuditLog } from "@/lib/audit-logs";
import type { AppSettings } from "@/types";

/**
 * Updates the global application settings in Firestore.
 * Requires super_admin session.
 */
export async function updateSettings(data: Partial<AppSettings>) {
  const session = await requireSuperAdmin();

  const settingsData = {
    ...data,
    updated_at: new Date(),
    updated_by: session.user?.email || "unknown_admin"
  };

  await adminDb
    .collection("settings")
    .doc(SETTINGS_DOC_ID)
    .set(settingsData, { merge: true });

  await createAuditLog({
    action: "SETTINGS_UPDATE",
    actor_id: session.user?.uid || "admin",
    actor_email: session.user?.email || "unknown_admin",
    resource_id: SETTINGS_DOC_ID,
    resource_type: "settings",
    metadata: { updated_keys: Object.keys(data) }
  }).catch(err => console.warn("Failed to create settings audit log:", err));

  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/admin/pricing/matrices");
  try {
    (revalidateTag as any)("settings");
  } catch {
    // ignore if revalidateTag is not supported in current environment
  }
  
  return { success: true };
}
