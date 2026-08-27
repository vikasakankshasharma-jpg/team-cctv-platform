import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("inventory").get();
    
    // Auto-seed logic if inventory is empty
    if (snapshot.empty) {
      const catalogSnapshot = await adminDb.collection("catalog").get();
      if (!catalogSnapshot.empty) {
        const batch = adminDb.batch();
        const newInventory = [];
        
        for (const doc of catalogSnapshot.docs) {
          const product = doc.data();
          const item = {
            id: product.id || doc.id,
            displayName: product.display_name,
            category: product.category,
            brand: product.brand,
            availableQty: 0,
            reservedQty: 0,
            minStockLevel: 5, // Default safety stock
            costPrice: product.base_cost || 0
          };
          
          batch.set(adminDb.collection("inventory").doc(item.id), item);
          newInventory.push(item);
        }
        
        await batch.commit();
        return NextResponse.json({ success: true, data: newInventory, seeded: true });
      }
    }
    
    const inventory = snapshot.docs.map(doc => doc.data());
    return NextResponse.json({ success: true, data: inventory });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
