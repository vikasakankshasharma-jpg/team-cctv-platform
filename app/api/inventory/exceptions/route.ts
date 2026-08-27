import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("inventory_exceptions")
      .where("status", "==", "PENDING_AUDIT")
      .get();
      
    const exceptions = snapshot.docs.map(doc => doc.data());
    
    return NextResponse.json({ success: true, data: exceptions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

