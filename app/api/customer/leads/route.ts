import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    
    if (!session.isAuthenticated || session.role !== "customer") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const uid = session.user?.uid;
    if (!uid) {
      return NextResponse.json({ success: false, message: "Invalid session" }, { status: 403 });
    }

    // Row 8 Customer Data Isolation: Fetch only leads where firebase_uid == user.uid
    const leadsSnap = await adminDb.collection("leads")
      .where("firebase_uid", "==", uid)
      .get();

    const leads = leadsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((l: any) => l.is_deleted === false)
      .sort((a: any, b: any) => {
        const timeA = a.created_at?.toDate?.() || 0;
        const timeB = b.created_at?.toDate?.() || 0;
        return timeB - timeA;
      });

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    console.error("Customer leads error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
