import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRoleApi(["super_admin"]);
    const params = await context.params;
    const productId = params.id;
    
    const { base_cost, stock_status, is_quotation_eligible } = await request.json();

    if (base_cost !== undefined && base_cost <= 0) {
      return NextResponse.json({ success: false, message: "Invalid base cost. Must be greater than 0." }, { status: 400 });
    }

    const productRef = adminDb.collection("products").doc(productId);

    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(productRef);
      if (!doc.exists) throw new Error("Product not found");
      
      const oldData = doc.data() as any;
      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (base_cost !== undefined) updateData.base_cost = base_cost;
      if (stock_status !== undefined) updateData.stock_status = stock_status;
      if (is_quotation_eligible !== undefined) updateData.is_quotation_eligible = is_quotation_eligible;

      transaction.update(productRef, updateData);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "product_pricing",
        entity_id: productId,
        action: "price_or_status_updated",
        actor: "super_admin",
        details: { old_base_cost: oldData.base_cost, new_base_cost: base_cost, stock_status },
        created_at: updateData.updated_at
      });
    });

    return NextResponse.json({ success: true, message: "Product updated" });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
