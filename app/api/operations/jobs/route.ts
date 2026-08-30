import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const session = await requireRoleApi(["sales_staff", "installer", "super_admin"]);
    const url = new URL(request.url);
    const filterStatus = url.searchParams.get("status");

    let query: any = adminDb.collection("jobs");

    // 1. RBAC Enforcements
    if (session.role === "installer") {
      // Installer can ONLY see their assigned jobs
      query = query.where("installer_id", "==", session.user?.uid);
    }
    
    // 2. Query Filters
    if (filterStatus) {
      query = query.where("status", "==", filterStatus);
    }
    
    const snap = await query.orderBy("created_at", "desc").limit(50).get();
    
    const jobs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, data: jobs, role: session.role });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    console.error("Operations Jobs Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}