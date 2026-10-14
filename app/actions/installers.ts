"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { CreateInstallerSchema, type CreateInstallerInput } from "@/lib/validators";

/**
 * Creates a new Installer in Firestore
 */
export async function createInstaller(data: CreateInstallerInput): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();

    const parsed = CreateInstallerSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => `${i.path.join('.') || 'field'}: ${i.message}`).join(", ");
      return { success: false, error: errorMsg };
    }
    const validated = parsed.data;

    const hasBankDetails = Boolean(validated.bank_account && validated.bank_ifsc);

    const rawInstallerData = {
      ...validated,
      pan_number: validated.pan_number || null,
      gst_number: validated.gst_number || null,
      email: validated.email || null,
      company_name: validated.company_name || null,
      years_experience: validated.years_experience ?? null,
      city: validated.city || null,
      alternate_phone: validated.alternate_phone || null,
      aadhaar_number: validated.aadhaar_number || null,
      bank_account: validated.bank_account || null,
      bank_ifsc: validated.bank_ifsc || null,
      kyc_status: validated.kyc_status || ("pending" as const),
      bank_account_verified: hasBankDetails,
      bank_verified_name: hasBankDetails ? (validated.bank_verified_name || validated.name) : null,
      is_active: true,
      sla_score: 100,
      avg_rating: 5.0,
      jobs_completed: 0,
      sla_breaches: 0,
      wallet_balance: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Strip out any undefined properties so Firestore never throws a serialization error
    const installerData = Object.fromEntries(
      Object.entries(rawInstallerData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection("installers").add(installerData);
    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true, id: docRef.id };
  } catch (err: any) {
    console.error("createInstaller error:", err);
    return { success: false, error: err.message || "Failed to create installer" };
  }
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
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    await requireAdmin();

    const sanitized = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const updateData = {
      ...sanitized,
      updated_at: new Date(),
    };

    await adminDb.collection("installers").doc(id).update(updateData);
    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true, id };
  } catch (err: any) {
    console.error("updateInstaller error:", err);
    return { success: false, error: err.message || "Failed to update installer" };
  }
}

/**
 * Toggles an installer's active status
 */
export async function toggleInstallerActive(id: string, is_active: boolean): Promise<{ success: boolean; id?: string; is_active?: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb.collection("installers").doc(id).update({
      is_active,
      updated_at: new Date(),
    });
    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true, id, is_active };
  } catch (err: any) {
    console.error("toggleInstallerActive error:", err);
    return { success: false, error: err.message || "Failed to toggle status" };
  }
}

/**
 * Updates an installer's KYC status
 */
export async function updateInstallerKyc(
  id: string,
  kyc_status: "pending" | "verified" | "suspended"
): Promise<{ success: boolean; id?: string; kyc_status?: string; error?: string }> {
  try {
    await requireAdmin();

    await adminDb.collection("installers").doc(id).update({
      kyc_status,
      updated_at: new Date(),
    });
    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true, id, kyc_status };
  } catch (err: any) {
    console.error("updateInstallerKyc error:", err);
    return { success: false, error: err.message || "Failed to update KYC status" };
  }
}

/**
 * Approves an inbound installer application and creates a verified installer profile
 */
export async function approveInstallerApplication(applicationId: string): Promise<{ success: boolean; installerId?: string; error?: string }> {
  try {
    await requireAdmin();

    const appRef = adminDb.collection("installer_applications").doc(applicationId);
    const appSnap = await appRef.get();

    if (!appSnap.exists) {
      return { success: false, error: "Application not found" };
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
      const rawDoc = {
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
      };
      const cleanDoc = Object.fromEntries(
        Object.entries(rawDoc).filter(([_, v]) => v !== undefined)
      );
      const newDoc = await adminDb.collection("installers").add(cleanDoc);
      installerId = newDoc.id;
    }

    // Mark application as approved
    await appRef.update({
      status: "approved",
      approved_at: new Date(),
      installer_id: installerId,
      updated_at: new Date(),
    });

    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true, installerId };
  } catch (err: any) {
    console.error("approveInstallerApplication error:", err);
    return { success: false, error: err.message || "Failed to approve application" };
  }
}

/**
 * Rejects an inbound installer application
 */
export async function rejectInstallerApplication(applicationId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await adminDb.collection("installer_applications").doc(applicationId).update({
      status: "rejected",
      rejection_reason: reason || "Does not meet current requirements",
      rejected_at: new Date(),
      updated_at: new Date(),
    });

    try {
      revalidatePath("/admin/installers");
    } catch {}
    return { success: true };
  } catch (err: any) {
    console.error("rejectInstallerApplication error:", err);
    return { success: false, error: err.message || "Failed to reject application" };
  }
}
