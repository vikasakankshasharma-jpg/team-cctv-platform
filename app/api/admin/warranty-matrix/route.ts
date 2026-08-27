import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("products").get();
    
    const matrix = snapshot.docs.map(doc => {
       const p = doc.data();
       const policy = p.warrantyPolicy || {};
       
       return {
          id: doc.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          isSerialized: p.isSerialized || false,
          supplierWarrantyMonths: policy.supplierWarrantyMonths || 0,
          customerWarrantyMonths: policy.customerWarrantyMonths || p.warrantyMonths || 0,
          installationWarrantyDays: policy.installationWarrantyDays || 0,
          customerWarrantyType: policy.customerWarrantyType || "NONE",
          warrantyStartsFrom: policy.warrantyStartsFrom || "INSTALLATION_DATE"
       };
    });
    
    // Sort by Category then Name
    matrix.sort((a, b) => {
       if (a.category !== b.category) return a.category.localeCompare(b.category);
       return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ success: true, data: matrix });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
