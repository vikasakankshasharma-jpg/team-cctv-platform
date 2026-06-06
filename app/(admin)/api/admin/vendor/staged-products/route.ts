// Force rebuild
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { StagedProduct } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

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
       const stagedRef = db.collection("staged_products").doc(id);
       const stagedDoc = await stagedRef.get();
       
       if (!stagedDoc.exists) {
           return NextResponse.json({ success: false, error: "Product no longer exists in staging area. Please refresh your page." });
       }
       if (stagedDoc.data()?.status === "approved") {
           return NextResponse.json({ success: false, error: "Product was already approved!" });
       }

       // Move to live products
       if (!updatedProduct) throw new Error("Missing product data to approve");
       
       const display_name = updatedProduct.raw_title;
       if (!display_name) throw new Error("Missing product title");

       const technical_name = display_name.toLowerCase().replace(/[^a-z0-9]/g, "_");

           if (updatedProduct.vendor_product_id) {
               const existingLiveDocsByVendorId = await db.collection("products")
                    .where("vendor_product_id", "==", updatedProduct.vendor_product_id)
                    .where("is_deleted", "==", false)
                    .get();
               if (!existingLiveDocsByVendorId.empty) {
                   return NextResponse.json({ 
                       success: false, 
                       error: "Strict Block: A product with this exact Vendor Product ID already exists in the live catalog. Duplicates are not allowed."
                   });
               }
           }

           if (!body.forceApprove) {
               const existingLiveDocsByName = await db.collection("products")
                    .where("technical_name", "==", technical_name)
                    .where("is_deleted", "==", false)
                    .get();
                    
               if (!existingLiveDocsByName.empty) {
                   return NextResponse.json({ 
                       success: false, 
                       error: "A product with an identical name already exists in your live catalog.",
                       isDuplicateWarning: true
                   });
               }
           }

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
           rack_u_height: updatedProduct.rack_u_height || null,
           cable_length_m: updatedProduct.cable_length_m || null,
           power_voltage_v: updatedProduct.power_voltage_v || null,
           power_amperage_a: updatedProduct.power_amperage_a || null,
           power_wattage_w: updatedProduct.power_wattage_w || null,
           vendor_product_id: updatedProduct.vendor_product_id || null,
           vendor_id: updatedProduct.vendor_id || null,
           internal_sku: updatedProduct.internal_sku || null,
           is_active: updatedProduct.in_stock !== false,
           is_deleted: false,
           updated_at: new Date().toISOString()
       };

       const liveRef = db.collection("products").doc();
       await liveRef.set(liveProductData);

       // ── AI LEARNING: Save specifications to Knowledge Base ──
       if (Array.isArray(updatedProduct.technologies) && updatedProduct.technologies.length > 0) {
           const batch = db.batch();
           for (const tech of updatedProduct.technologies) {
               const techId = tech.toLowerCase().replace(/[^a-z0-9]/g, '_');
               if (techId) {
                   const kbRef = db.collection("specification_knowledge").doc(techId);
                   batch.set(kbRef, {
                       spec_name: tech,
                       categories: FieldValue.arrayUnion(updatedProduct.category),
                       updated_at: new Date().toISOString()
                   }, { merge: true });
               }
           }
           await batch.commit();
       }

       // Mark staged as approved
       await db.collection("staged_products").doc(id).update({ status: "approved" });

       return NextResponse.json({ success: true, liveId: liveRef.id });
    } else if (action === "reject") {
       const stagedRef = db.collection("staged_products").doc(id);
       const stagedDoc = await stagedRef.get();
       if (!stagedDoc.exists) {
           return NextResponse.json({ success: false, error: "Product no longer exists in staging area." });
       }
       await stagedRef.update({ status: "rejected" });
       return NextResponse.json({ success: true });
    } else if (action === "bulk_reject") {
       const { ids } = body;
       if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ success: false, error: "No IDs provided" });
       const batches = [];
       let batch = db.batch();
       let count = 0;
       for (const i of ids) {
           batch.set(db.collection("staged_products").doc(i), { status: "rejected" }, { merge: true });
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
