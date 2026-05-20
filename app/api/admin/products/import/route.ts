import { verifySession } from "@/lib/auth-server";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createAuditLog, getRequestMetadata } from "@/lib/audit-logs";
import type { Product } from "@/types";

const BATCH_SIZE = 500;

/**
 * POST /api/admin/products/import
 * Body: { products: Partial<Product>[] }
 *
 * Performs a batched Firestore upsert (merge: true) for every product.
 * - If the row has a non-empty `id`, it targets that existing document.
 * - If `id` is empty/missing, a new document is auto-generated.
 */
export async function POST(req: NextRequest) {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ip, ua } = getRequestMetadata(req);

    if (!body.products || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ success: false, error: "No products provided." }, { status: 400 });
    }

    const products: Partial<Product>[] = body.products;
    const now = new Date().toISOString();
    let created = 0;
    let updated = 0;

    // Chunk into batches of 500 (Firestore limit)
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const chunk = products.slice(i, i + BATCH_SIZE);
      const batch = adminDb.batch();

      chunk.forEach((prod) => {
        const isNew = !prod.id || prod.id.trim() === "";
        const docRef = isNew
          ? adminDb.collection("products").doc()
          : adminDb.collection("products").doc(prod.id!.trim());

        const dataToSave: Record<string, unknown> = { ...prod };
        delete dataToSave.id; // id lives in the document reference, not the data

        // Recalculate unit_price if cost + margin are both present
        const cost = Number(dataToSave.base_cost);
        const margin = Number(dataToSave.margin_percentage);
        if (!isNaN(cost) && !isNaN(margin) && cost > 0) {
          dataToSave.unit_price = Math.round(cost + cost * (margin / 100));
        }

        dataToSave.updated_at = now;
        if (isNew) {
          dataToSave.created_at = now;
          dataToSave.is_active = dataToSave.is_active ?? true;
          created++;
        } else {
          updated++;
        }

        batch.set(docRef, dataToSave, { merge: true });
      });

      await batch.commit();
    }

    // Audit trail
    await createAuditLog({
      action: "BULK_PRODUCT_IMPORT",
      actor_id: session.user?.uid || "unknown",
      actor_email: session.user?.email,
      resource_type: "product",
      metadata: {
        total: products.length,
        created,
        updated,
        timestamp: now,
      },
      ip_address: ip,
      user_agent: ua,
    });

    return NextResponse.json({ success: true, created, updated });
  } catch (error: any) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Import failed." },
      { status: 500 }
    );
  }
}
