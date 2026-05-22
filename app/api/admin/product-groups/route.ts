import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { ProductGroup } from "@/types";

export async function GET() {
  try {
    await requireAdmin();
    const snapshot = await adminDb.collection("product_groups")
      .where("is_active", "==", true)
      .get();
      
    const groups: ProductGroup[] = [];
    snapshot.forEach(doc => {
      groups.push({ id: doc.id, ...doc.data() } as ProductGroup);
    });

    // Sort alphabetically by full_path
    groups.sort((a, b) => a.full_path.localeCompare(b.full_path));

    return NextResponse.json({ success: true, groups });
  } catch (error: any) {
    console.error("GET /api/admin/product-groups Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: "Missing group name" }, { status: 400 });
    }

    let fullPath = body.name;
    
    // Resolve full path if there's a parent
    if (body.parent_id) {
      const parentDoc = await adminDb.collection("product_groups").doc(body.parent_id).get();
      if (parentDoc.exists) {
        fullPath = `${parentDoc.data()?.full_path} / ${body.name}`;
      } else {
        return NextResponse.json({ success: false, error: "Parent group not found" }, { status: 404 });
      }
    }

    const newGroupRef = adminDb.collection("product_groups").doc();
    const newGroupData = {
      name: body.name,
      parent_id: body.parent_id || null,
      full_path: fullPath,
      is_active: true,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    await newGroupRef.set(newGroupData);
    
    return NextResponse.json({ 
      success: true, 
      group: { id: newGroupRef.id, ...newGroupData } 
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/product-groups Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) return NextResponse.json({ success: false, error: "Missing group ID" }, { status: 400 });

    const groupRef = adminDb.collection("product_groups").doc(id);
    const groupDoc = await groupRef.get();
    
    if (!groupDoc.exists) {
      return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
    }

    // Note: Updating parent_id or name means full_path changes.
    // If full_path changes, we'd theoretically need to update all children's full_path.
    // For simplicity in this sprint, we update the single group's full path.
    // In a production scenario with deep editing, we'd recursively update children or compute path on the fly.

    if (updateData.name || updateData.parent_id !== undefined) {
      const newName = updateData.name || groupDoc.data()?.name;
      const newParentId = updateData.parent_id !== undefined ? updateData.parent_id : groupDoc.data()?.parent_id;
      
      let newFullPath = newName;
      if (newParentId) {
         const parentDoc = await adminDb.collection("product_groups").doc(newParentId).get();
         if (parentDoc.exists) {
           newFullPath = `${parentDoc.data()?.full_path} / ${newName}`;
         }
      }
      updateData.full_path = newFullPath;
    }

    updateData.updated_at = serverTimestamp();
    await groupRef.update(updateData);
    
    return NextResponse.json({ success: true, message: "Group updated" });
  } catch (error: any) {
    console.error("PATCH /api/admin/product-groups Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
