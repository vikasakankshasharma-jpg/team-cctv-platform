import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const adminSession = await requireRoleApi(["admin", "super_admin"]);
    
    const { id, type, source_collection, utr_number, amount, recipient_id } = await req.json();

    if (!id || !source_collection || !utr_number) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await adminDb.runTransaction(async (t) => {
      const docRef = adminDb.collection(source_collection).doc(id);
      const docSnap = await t.get(docRef);
      
      if (!docSnap.exists) {
        throw new Error("Payout record not found");
      }

      // Mark as paid
      t.update(docRef, {
        status: "paid",
        utr_number: utr_number,
        paid_at: serverTimestamp(),
        paid_by: adminSession.user?.uid || "SYSTEM"
      });

      // Create a unified transaction record for ledger
      const txRef = adminDb.collection("transactions").doc(`PAYOUT_${id}`);
      t.set(txRef, {
        type: "payout",
        recipient_type: type,
        recipient_id,
        amount,
        status: "SUCCESS",
        utr_reference: utr_number,
        payment_mode: "MANUAL",
        created_at: serverTimestamp(),
        processed_by: adminSession.user?.uid || "SYSTEM"
      });
    });

    return NextResponse.json({ success: true, message: "Payout settled successfully" });
  } catch (error: any) {
    console.error("[Settle Payout Error]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
