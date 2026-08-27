import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "SALES"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const doc = await adminDb.collection("amc_plans").doc(id).get();
    
    if (!doc.exists) {
       return NextResponse.json({ success: false, message: "AMC Plan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    await adminDb.collection("amc_plans").doc(id).update({
       ...body,
       updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, message: "AMC Plan updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
