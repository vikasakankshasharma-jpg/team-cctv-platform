"use server";

import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { CreateProductSchema, UpdateProductSchema } from "@/lib/validators";
import type { Product } from "@/types";

/**
 * Creates a new Product in Firestore
 */
export async function createProduct(data: Omit<Product, "id">) {
  await requireAdmin();
  
  // Enforce schema validation
  const validatedData = CreateProductSchema.parse(data);
  
  const productData = {
    ...validatedData,
    is_deleted: false,
    created_at: new Date()
  };

  const docRef = await adminDb.collection("products").add(productData);
  revalidatePath("/admin/products");
  return { id: docRef.id, ...productData };
}

/**
 * Updates an existing Product
 */
export async function updateProduct(id: string, data: Partial<Product>) {
  await requireAdmin();

  // Enforce schema validation
  const validatedData = UpdateProductSchema.parse({ id, ...data });
  const { id: _removedId, ...safeData } = validatedData;

  const updateData = {
    ...safeData,
    updated_at: new Date()
  };

  await adminDb.collection("products").doc(id).update(updateData);
  revalidatePath("/admin/products");
  return { id, ...data };
}

/**
 * Soft deletes a Product by setting is_deleted: true
 */
export async function deleteProduct(id: string) {
  await requireAdmin();

  await adminDb.collection("products").doc(id).update({
    is_deleted: true,
    deleted_at: new Date()
  });
  revalidatePath("/admin/products");
  return { success: true };
}
