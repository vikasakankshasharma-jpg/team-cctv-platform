import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/constants";
import type { WizardStep, WizardOption } from "@/types";

export async function getSettingsConfig() {
  try {
    const docSnap = await adminDb
      .collection(COLLECTIONS.SETTINGS)
      .doc(SETTINGS_DOC_ID)
      .get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    return {
      ...data,
      created_at: data?.created_at?.toDate?.()?.toISOString() || null,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || null,
    };
  } catch (err) {
    console.error("Error fetching settings:", err);
    return null;
  }
}

