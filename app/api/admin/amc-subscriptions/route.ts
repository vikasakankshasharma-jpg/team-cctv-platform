import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  try {
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "SALES"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const snapshot = await adminDb.collection("amc_subscriptions")
      .orderBy("createdAt", "desc")
      .get();
      
    const subscriptions = snapshot.docs.map(doc => doc.data());
    
    return NextResponse.json({ success: true, data: subscriptions });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
