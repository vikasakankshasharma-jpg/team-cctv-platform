import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth-server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/firebase-client";

export async function POST(req: NextRequest) {
  try {
    await requireAdminApi();
    
    const body = await req.json();
    const { installerId, bank_account, ifsc, name_at_bank } = body;

    if (!installerId || !bank_account || !ifsc) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch Installer Data
    const installerRef = adminDb.collection(COLLECTIONS.INSTALLERS).doc(installerId);
    const installerDoc = await installerRef.get();
    
    if (!installerDoc.exists) {
      return NextResponse.json({ success: false, error: "Installer not found" }, { status: 404 });
    }

    // Manual Verification: Save to Firestore directly without API verification
    const verifiedName = name_at_bank || "Verified Manually";
    
    await installerRef.update({
      bank_account_verified: true,
      bank_account: bank_account,
      bank_ifsc: ifsc,
      bank_verified_name: verifiedName,
      updated_at: serverTimestamp()
    });

    return NextResponse.json({ 
      success: true, 
      verifiedName: verifiedName,
      message: "Bank details saved and manually verified."
    });

  } catch (error: any) {
    console.error("[Manual Verify Bank Error]:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
