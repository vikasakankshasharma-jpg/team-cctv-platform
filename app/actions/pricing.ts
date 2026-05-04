"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-server";

export async function updateProductPrices(changes: { id: string, unit_price: number }[]) {
  const session = await requireAdmin();
  const adminEmail = session.user?.email || "unknown_admin";

  const batch = adminDb.batch();
  const logCollection = adminDb.collection("price_change_log");

  for (const change of changes) {
    const productRef = adminDb.collection("products").doc(change.id);
    const productDoc = await productRef.get();
    const oldData = productDoc.data();

    if (oldData && oldData.unit_price !== change.unit_price) {
      // Update product
      batch.update(productRef, { 
        unit_price: change.unit_price,
        updated_at: new Date()
      });

      // Log change
      const logRef = logCollection.doc();
      batch.set(logRef, {
        product_id: change.id,
        product_display_name: oldData.display_name,
        old_price: oldData.unit_price,
        new_price: change.unit_price,
        changed_by: adminEmail,
        created_at: new Date()
      });
    }
  }

  await batch.commit();
  revalidatePath("/admin/pricing");
  return { success: true };
}
