import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { logPricingChange } from "@/lib/pricing-audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const body = await request.json();
    
    const docRef = adminDb.collection("products").doc(productId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    
    const oldData = doc.data()!;
    
    // Check if price/markup changed for audit logging
    if (body.markup_override !== oldData.markup_override || body.base_cost !== oldData.base_cost) {
      await logPricingChange({
        targetType: "PRODUCT",
        targetId: productId,
        field: "pricing_update",
        oldValue: oldData.unit_price,
        newValue: body.unit_price,
        adminId: "Admin User", // In real app, extract from session
        reason: "Inline Catalog Edit"
      });
    }
    
    await docRef.update({
      base_cost: body.base_cost,
      markup_override: body.markup_override === undefined ? null : body.markup_override,
      markup_percent: body.markup_percent,
      pricing_rule_ref: body.pricing_rule_ref,
      unit_price: body.unit_price,
      is_active: body.is_active,
      is_quotation_eligible: body.is_quotation_eligible,
      is_configurator_visible: body.is_configurator_visible,
      price_updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
