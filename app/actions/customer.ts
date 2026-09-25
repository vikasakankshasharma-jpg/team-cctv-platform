"use server";

import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function updateCustomerProfile(data: { name: string; email: string }) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || !session.uid) {
      return { success: false, error: "Unauthorized" };
    }

    const { name, email } = data;
    const uid = session.uid;

    // 1. Update Firebase Auth User
    await adminAuth.updateUser(uid, {
      displayName: name,
      ...(email ? { email } : {})
    }).catch(e => console.warn("Failed to update auth user:", e));

    // 2. Update all leads linked to this uid
    const leadsSnap = await adminDb.collection("leads").where("firebase_uid", "==", uid).get();
    
    if (!leadsSnap.empty) {
      const batch = adminDb.batch();
      leadsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
          customer_name: name,
          ...(email ? { customer_email: email } : {})
        });
      });
      await batch.commit();
    }

    revalidatePath("/customer/dashboard");
    revalidatePath("/customer/profile");

    return { success: true };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}
