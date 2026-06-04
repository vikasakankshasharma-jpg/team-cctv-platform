import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { StagedProduct } from "@/types";

export async function GET(request: Request) {
  try {
    const db = adminDb;
    const snapshot = await db.collection("staged_products").where("status", "==", "pending").get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("Error fetching staged products:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, updatedProduct } = body;
    const db = adminDb;

    if (action === "approve") {
       // Move to live products
       if (!updatedProduct) throw new Error("Missing product data to approve");
       
       const display_name = updatedProduct.raw_title;
       if (!display_name) throw new Error("Missing product title");

       const technical_name = display_name.toLowerCase().replace(/[^a-z0-9]/g, "_");

       const liveProductData = {
           display_name,
           technical_name,
           category: updatedProduct.category,
           brand: updatedProduct.brand || null,
           technologies: updatedProduct.technologies || [],
           features: updatedProduct.features || [],
           base_cost: updatedProduct.base_cost,
           unit_price: Math.ceil(updatedProduct.base_cost * 1.3), // 30% default margin
           image_url: updatedProduct.image_url || "",
           resolution_mp: updatedProduct.resolution_mp || null,
           channels: updatedProduct.channels || null,
           vendor_product_id: updatedProduct.vendor_product_id || null,
           is_active: true,
           is_deleted: false,
           updated_at: new Date().toISOString()
       };

       const liveRef = db.collection("products").doc();
       await liveRef.set(liveProductData);

       // Mark staged as approved
       await db.collection("staged_products").doc(id).update({ status: "approved" });

       return NextResponse.json({ success: true, liveId: liveRef.id });

    } else if (action === "reject") {
       await db.collection("staged_products").doc(id).update({ status: "rejected" });
       return NextResponse.json({ success: true });
    } else if (action === "bulk_reject") {
       const { ids } = body;
       if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: false, error: "No IDs provided" });
       const batches = [];
       let batch = db.batch();
       let count = 0;
       for (const i of ids) {
           batch.update(db.collection("staged_products").doc(i), { status: "rejected" });
           count++;
           if (count === 500) {
               batches.push(batch.commit());
               batch = db.batch();
               count = 0;
           }
       }
       if (count > 0) batches.push(batch.commit());
       await Promise.all(batches);
       return NextResponse.json({ success: true });
    } else if (action === "clear_all") {
       const snapshot = await db.collection("staged_products").get();
       const deleteBatches = [];
       let deleteBatch = db.batch();
       let deleteCount = 0;
       snapshot.docs.forEach((doc) => {
           deleteBatch.delete(doc.ref);
           deleteCount++;
           if (deleteCount === 500) {
               deleteBatches.push(deleteBatch.commit());
               deleteBatch = db.batch();
               deleteCount = 0;
           }
       });
       if (deleteCount > 0) deleteBatches.push(deleteBatch.commit());
       await Promise.all(deleteBatches);
       return NextResponse.json({ success: true });
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error updating staged product:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
