import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    // Both Admin/Sales should see this. In a real app, the Customer themselves could see it too.
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { customerId } = await params;

    // Fetch all serial assets installed for this customer
    const snapshot = await adminDb.collection("serial_assets")
      .where("customerId", "==", customerId)
      .where("status", "in", ["INSTALLED", "RMA", "RETIRED"]) // Exclude IN_STOCK / RESERVED
      .get();
      
    const assets = snapshot.docs.map(doc => doc.data());
    
    // Sort by installation date descending
    assets.sort((a, b) => {
       const dateA = a.installedAt ? new Date(a.installedAt).getTime() : 0;
       const dateB = b.installedAt ? new Date(b.installedAt).getTime() : 0;
       return dateB - dateA;
    });

    return NextResponse.json({ success: true, data: assets });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
