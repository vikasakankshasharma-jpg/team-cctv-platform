import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    await requireRoleApi(["super_admin", "sales_staff", "admin"]);
    
    // Fetch last 50 audit logs
    const snapshot = await adminDb.collection("audit_logs")
      .orderBy("created_at", "desc")
      .limit(50)
      .get();
      
    const logs = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
