"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { CreateInstallerSchema, type CreateInstallerInput } from "@/lib/validators";

/**
 * Creates a new Installer in Firestore
 */
export async function createInstaller(data: CreateInstallerInput) {
  await requireAdmin();

  const validated = CreateInstallerSchema.parse(data);

  const hasBankDetails = Boolean(validated.bank_account && validated.bank_ifsc);

  const installerData = {
    ...validated,
    kyc_status: validated.kyc_status || ("pending" as const),
    bank_account_verified: hasBankDetails,
    bank_verified_name: hasBankDetails ? (validated.bank_verified_name || validated.name) : undefined,
    is_active: true,
    sla_score: 100,
    avg_rating: 5.0,
    jobs_completed: 0,
    sla_breaches: 0,
    wallet_balance: 0,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const docRef = await adminDb.collection("installers").add(installerData);
  revalidatePath("/admin/installers");
  return { success: true, id: docRef.id };
}

/**
 * Updates an existing Installer's core details
 */
export async function updateInstaller(
  id: string,
  data: Partial<CreateInstallerInput> & {
    kyc_status?: "pending" | "verified" | "suspended";
    is_active?: boolean;
    serviceable_pincodes?: string[];
  }
) {
  await requireAdmin();

  const updateData = {
    ...data,
    updated_at: new Date(),
  };

  await adminDb.collection("installers").doc(id).update(updateData);
  revalidatePath("/admin/installers");
  return { success: true, id };
}

/**
 * Toggles an installer's active status
 */
export async function toggleInstallerActive(id: string, is_active: boolean) {
  await requireAdmin();

  await adminDb.collection("installers").doc(id).update({
    is_active,
    updated_at: new Date(),
  });
  revalidatePath("/admin/installers");
  return { success: true, id, is_active };
}

/**
 * Updates an installer's KYC status
 */
export async function updateInstallerKyc(
  id: string,
  kyc_status: "pending" | "verified" | "suspended"
) {
  await requireAdmin();

  await adminDb.collection("installers").doc(id).update({
    kyc_status,
    updated_at: new Date(),
  });
  revalidatePath("/admin/installers");
  return { success: true, id, kyc_status };
}

/**
 * Approves an inbound installer application and creates a verified installer profile
 */
export async function approveInstallerApplication(applicationId: string) {
  await requireAdmin();

  const appRef = adminDb.collection("installer_applications").doc(applicationId);
  const appSnap = await appRef.get();

  if (!appSnap.exists) {
    throw new Error("Application not found");
  }

  const appData = appSnap.data() || {};

  // Check if an installer with this mobile number already exists
  const existingCheck = await adminDb
    .collection("installers")
    .where("mobile_number", "==", appData.mobile_number)
    .limit(1)
    .get();

  let installerId = "";
  if (!existingCheck.empty) {
    installerId = existingCheck.docs[0].id;
    // Activate and update existing installer
    await adminDb.collection("installers").doc(installerId).update({
      is_active: true,
      updated_at: new Date(),
    });
  } else {
    // Create new installer document
    const newDoc = await adminDb.collection("installers").add({
      name: appData.name || "Technician",
      mobile_number: appData.mobile_number,
      company_name: appData.company_name || null,
      serviceable_pincodes: appData.primary_pincode ? [appData.primary_pincode] : [],
      skills: ["cctv_installation", "wiring", "mounting"],
      entity_type: appData.gstin ? "firm" : "individual",
      gst_number: appData.gstin || null,
      kyc_status: "pending",
      is_active: true,
      sla_score: 100,
      avg_rating: 5.0,
      jobs_completed: 0,
      sla_breaches: 0,
      wallet_balance: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
    installerId = newDoc.id;
  }

  // Mark application as approved
  await appRef.update({
    status: "approved",
    approved_at: new Date(),
    installer_id: installerId,
    updated_at: new Date(),
  });

  revalidatePath("/admin/installers");
  return { success: true, installerId };
}

/**
 * Rejects an inbound installer application
 */
export async function rejectInstallerApplication(applicationId: string, reason?: string) {
  await requireAdmin();

  await adminDb.collection("installer_applications").doc(applicationId).update({
    status: "rejected",
    rejection_reason: reason || "Does not meet current requirements",
    rejected_at: new Date(),
    updated_at: new Date(),
  });

  revalidatePath("/admin/installers");
  return { success: true };
}
