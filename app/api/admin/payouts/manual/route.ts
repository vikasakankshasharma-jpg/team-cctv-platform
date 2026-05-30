import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase-client";

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdminApi();
    
    const body = await req.json();
    const { installerId, amount, utr_number } = body;

    if (!installerId || !amount || amount <= 0 || !utr_number) {
      return NextResponse.json({ success: false, error: "Invalid installer, amount, or missing UTR" }, { status: 400 });
    }

    // 1. Fetch Installer Data
    const installerRef = adminDb.collection(COLLECTIONS.INSTALLERS).doc(installerId);
    
    await adminDb.runTransaction(async (t) => {
      const installerDoc = await t.get(installerRef);
      
      if (!installerDoc.exists) {
        throw new Error("Installer not found");
      }

      const installer = installerDoc.data()!;
      
      if (!installer.bank_account_verified) {
        throw new Error("Bank account must be verified before payout");
      }

      if ((installer.wallet_balance || 0) < amount) {
        throw new Error("Insufficient wallet balance");
      }

      // Deduct wallet balance
      t.update(installerRef, {
        wallet_balance: increment(-amount)
      });

      // Create transaction record
      const transferId = `MANUAL_TXN_${Date.now()}`;
      const txRef = adminDb.collection("transactions").doc(transferId);
      
      t.set(txRef, {
        type: "payout",
        installer_id: installerId,
        amount: amount,
        status: "SUCCESS", // Manual payouts are instantly marked success
        utr_reference: utr_number,
        payment_mode: "MANUAL",
        created_at: serverTimestamp(),
        processed_by: adminUser.user?.uid || "SYSTEM"
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: "Manual payout recorded successfully"
    });

  } catch (error: any) {
    console.error("[Manual Payout Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
