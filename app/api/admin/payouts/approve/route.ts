import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession();
    if (!session.isAuthenticated || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payoutId, utrNumber } = await req.json();
    if (!payoutId) {
      return NextResponse.json({ error: "Payout ID is required" }, { status: 400 });
    }

    const payoutRef = adminDb.collection("payout_requests").doc(payoutId);
    
    // Run in a transaction to ensure data integrity
    await adminDb.runTransaction(async (transaction) => {
      const payoutDoc = await transaction.get(payoutRef);

      if (!payoutDoc.exists) {
        throw new Error("Payout request not found");
      }

      const payoutData = payoutDoc.data() as any;

      if (payoutData.status !== "pending") {
        throw new Error("Payout request is not pending");
      }

      const userId = payoutData.user_id;
      const userType = payoutData.user_type; // 'installer' or 'promoter'
      const userRef = adminDb.collection(userType + "s").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      // Update the payout request
      transaction.update(payoutRef, {
        status: "success", // Marked as paid offline
        payment_method: "offline_bank_transfer",
        utr_number: utrNumber || null,
        updated_at: new Date().toISOString(),
        approved_by: session.user?.uid || "admin",
        approved_at: new Date().toISOString(),
      });

      // Deduct from wallet balance
      transaction.update(userRef, {
        wallet_balance: FieldValue.increment(-payoutData.gross_amount),
        updated_at: new Date().toISOString(),
      });

      // Create ledger entry
      const ledgerRef = adminDb.collection("ledger_transactions").doc();
      transaction.set(ledgerRef, {
        user_id: userId,
        user_type: userType,
        amount: -payoutData.gross_amount,
        type: "payout",
        description: `Payout processed manually (Net: ₹${payoutData.net_amount}, TDS: ₹${payoutData.tds_amount}) ${utrNumber ? `[UTR: ${utrNumber}]` : ''}`,
        created_at: FieldValue.serverTimestamp(),
        payout_id: payoutId,
      });
    });

    return NextResponse.json({ message: "Payout marked as paid successfully" });
  } catch (error: any) {
    console.error("Payout approval error:", error);
    return NextResponse.json({ error: error.message || "Failed to approve payout" }, { status: 500 });
  }
}
