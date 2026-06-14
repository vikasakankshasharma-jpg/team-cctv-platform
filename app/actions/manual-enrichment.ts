"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { FieldValue } from "firebase-admin/firestore";

export async function manualSpecUpdate(productsToUpdate: any[]) {
  await requireAdmin();

  if (!productsToUpdate || productsToUpdate.length === 0) {
    throw new Error("No products provided for update.");
  }

  const batch = adminDb.batch();

  productsToUpdate.forEach((product) => {
    if (!product.id) return;
    
    const docRef = adminDb.collection("products").doc(product.id);
    
    const updateData: any = {
      updated_at: new Date(),
      ai_enrichment_status: "manual",
    };

    const applyField = (key: string, value: any, isNumber: boolean = false) => {
      if (value === undefined) return;
      if (value === "" || value === null) {
        updateData[key] = FieldValue.delete();
      } else {
        updateData[key] = isNumber ? Number(value) : String(value);
      }
    };

    applyField("resolution_mp", product.resolution_mp, true);
    applyField("night_vision_type", product.night_vision_type);
    applyField("form_factor", product.form_factor);
    applyField("ip_rating", product.ip_rating);
    
    applyField("channels", product.channels, true);
    applyField("hdd_slots", product.hdd_slots, true);
    applyField("max_resolution_rec", product.max_resolution_rec);

    batch.update(docRef, updateData);
  });

  await batch.commit();

  return { success: true, count: productsToUpdate.length };
}
