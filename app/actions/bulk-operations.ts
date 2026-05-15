"use server";
import { createAuditLog } from "@/lib/audit-logs";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";

export async function bulkUpdateProducts(products: Partial<Product>[]) {
  const session = await requireAdmin();

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new Error("No valid products provided for bulk update.");
  }

  // Firestore allows up to 500 writes per batch.
  const BATCH_SIZE = 500;
  
  try {
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const chunk = products.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();

      chunk.forEach(prod => {
        let docRef;
        if (prod.id && prod.id.trim() !== "") {
          docRef = adminDb.collection("products").doc(prod.id);
        } else {
          docRef = adminDb.collection("products").doc();
        }

        const dataToSave = { ...prod };
        delete dataToSave.id;

        dataToSave.updated_at = new Date().toISOString();
        if (!prod.id) {
            dataToSave.created_at = new Date().toISOString();
        }

        batch.set(docRef, dataToSave, { merge: true });
      });

      await batch.commit();
    }

    // Audit log
    await createAuditLog({
      action: "BULK_PRODUCT_IMPORT",
      actor_id: session.user?.uid || "unknown",
      actor_email: session.user?.email,
      resource_type: "product",
      metadata: {
        total_count: products.length,
        timestamp: new Date().toISOString()
      }
    });

    return { success: true, count: products.length };
  } catch (error: any) {
    console.error("Bulk update failed:", error);
    throw new Error(error.message || "Failed to process bulk update.");
  }
}
