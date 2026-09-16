import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function POST(req: Request) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { verificationId, action, notes } = body; // action is "approve" or "reject"

    const vRef = adminDb.collection("offline_verifications").doc(verificationId);
    const vSnap = await vRef.get();
    
    if (!vSnap.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const vData = vSnap.data();

    await vRef.update({
      status: action === "approve" ? "approved" : "rejected",
      resolved_at: new Date().toISOString(),
      resolved_by: session.user?.uid,
      admin_notes: notes || null
    });

    if (action === "approve") {
      const leadRef = adminDb.collection("leads").doc(vData?.lead_id);
      await leadRef.update({ status: "won" });

      // Add to Ledger
      await adminDb.collection("ledger_transactions").add({
        user_id: vData?.installer_id,
        user_type: "installer",
        amount: vData?.amount,
        type: "cash_collected",
        description: "Verified " + vData?.method?.toUpperCase() + " collection for Job " + vData?.quote_id?.slice(-6),
        job_id: vData?.quote_id,
        created_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
