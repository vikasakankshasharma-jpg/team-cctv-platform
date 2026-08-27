import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { resolveWaterfallMargin, calculateSellingPrice } from "@/lib/waterfall-pricing";
import { logPricingChange } from "@/lib/pricing-audit";

export async function GET() {
  try {
    const doc = await adminDb.collection("settings").doc("margins").get();
    if (!doc.exists) {
      // Return default structure if it doesn't exist
      return NextResponse.json({
        GLOBAL_DEFAULT: 20,
        CATEGORY: {},
        BRAND: {},
        ITEM: {}
      });
    }
    return NextResponse.json(doc.data());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { rules, auditLog, applyBatchUpdate, preview } = body;
    
    if (preview) {
      const snapshot = await adminDb.collection("products").get();
      const previewData: any[] = [];
      
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.base_cost !== undefined) {
          const { marginPercent, ruleRef } = resolveWaterfallMargin(product, rules);
          const newUnitPrice = calculateSellingPrice(product.base_cost, marginPercent);
          
          if (product.unit_price !== newUnitPrice || product.markup_percent !== marginPercent) {
            previewData.push({
              id: doc.id,
              sku: product.sku,
              display_name: product.display_name,
              old_markup: product.markup_percent,
              new_markup: marginPercent,
              old_price: product.unit_price,
              new_price: newUnitPrice,
              rule_ref: ruleRef
            });
          }
        }
      });
      return NextResponse.json({ success: true, isPreview: true, previewData });
    }
    
    // Save new rules
    await adminDb.collection("settings").doc("margins").set(rules);
    
    // Log the change
    if (auditLog) {
      await logPricingChange({
        ...auditLog,
        adminId: "Admin User", // In real app, extract from session
      });
    }
    
    let updatedCount = 0;
    
    // Auto-update all products
    if (applyBatchUpdate) {
      const snapshot = await adminDb.collection("products").get();
      const batch = adminDb.batch();
      
      snapshot.docs.forEach(doc => {
        const product = doc.data();
        if (product.base_cost !== undefined) {
          const { marginPercent, ruleRef } = resolveWaterfallMargin(product, rules);
          const newUnitPrice = calculateSellingPrice(product.base_cost, marginPercent);
          
          if (product.unit_price !== newUnitPrice || product.markup_percent !== marginPercent) {
            batch.update(doc.ref, {
              markup_percent: marginPercent,
              pricing_rule_ref: ruleRef,
              unit_price: newUnitPrice,
              price_updated_at: new Date().toISOString()
            });
            updatedCount++;
          }
        }
      });
      
      if (updatedCount > 0) {
        await batch.commit();
      }
    }
    
    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    console.error("Error updating pricing rules:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
