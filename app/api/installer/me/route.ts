import { NextResponse } from "next/server";
import { verifyInstallerSession } from "@/lib/auth-installer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { Installer } from "@/types";

export async function GET() {
  try {
    const session = await verifyInstallerSession();
    if (!session.isAuthenticated) throw new Error("INSTALLER_UNAUTHORIZED");

    const docSnap = await adminDb.collection(COLLECTIONS.INSTALLERS).doc(session.installerId!).get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Installer profile not found." }, { status: 404 });
    }

    const data = docSnap.data() as Installer;
    
    const profile = {
      id: docSnap.id,
      name: data.name,
      mobile_number: data.mobile_number,
      email: data.email,
      kyc_status: data.kyc_status,
      is_active: data.is_active,
      sla_score: data.sla_score,
      avg_rating: data.avg_rating,
      jobs_completed: data.jobs_completed,
      wallet_balance: data.wallet_balance,
      bank_account: data.bank_account,
      bank_ifsc: data.bank_ifsc,
      bank_account_verified: data.bank_account_verified,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof Error && error.message === "INSTALLER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Installer Me GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await verifyInstallerSession();
    if (!session.isAuthenticated) throw new Error("INSTALLER_UNAUTHORIZED");
    const body = await req.json();

    const allowedUpdates: Partial<Installer> = {};
    if (typeof body.name === "string") allowedUpdates.name = body.name;
    if (typeof body.email === "string") allowedUpdates.email = body.email;
    if (typeof body.mobile_number === "string") allowedUpdates.mobile_number = body.mobile_number;
    
    // Bank Details updates
    let bankDetailsChanged = false;
    if (typeof body.bank_account === "string" && body.bank_account !== undefined) {
      allowedUpdates.bank_account = body.bank_account;
      bankDetailsChanged = true;
    }
    if (typeof body.bank_ifsc === "string" && body.bank_ifsc !== undefined) {
      allowedUpdates.bank_ifsc = body.bank_ifsc;
      bankDetailsChanged = true;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update." }, { status: 400 });
    }

    // Reset verification if bank details change
    if (bankDetailsChanged) {
      allowedUpdates.bank_account_verified = false;
    }

    allowedUpdates.updated_at = new Date();

    await adminDb.collection(COLLECTIONS.INSTALLERS).doc(session.installerId!).update(allowedUpdates as any);

    return NextResponse.json({ success: true, updatedFields: allowedUpdates });
  } catch (error) {
    if (error instanceof Error && error.message === "INSTALLER_UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Installer Me PATCH] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
