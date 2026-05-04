"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FollowUpCampaign } from "@/types";
import { revalidatePath } from "next/cache";

export async function createCampaign(data: Omit<FollowUpCampaign, "id" | "created_at">) {
  const docRef = await adminDb.collection("followup_campaigns").add({
    ...data,
    created_at: new Date(),
    updated_at: new Date(),
  });

  revalidatePath("/admin/campaigns");

  return {
    id: docRef.id,
    ...data,
    created_at: new Date().toISOString(),
  } as FollowUpCampaign;
}

export async function updateCampaign(id: string, data: Partial<FollowUpCampaign>) {
  await adminDb.collection("followup_campaigns").doc(id).update({
    ...data,
    updated_at: new Date(),
  });

  revalidatePath("/admin/campaigns");
}

export async function deleteCampaign(id: string) {
  await adminDb.collection("followup_campaigns").doc(id).delete();
  revalidatePath("/admin/campaigns");
}
