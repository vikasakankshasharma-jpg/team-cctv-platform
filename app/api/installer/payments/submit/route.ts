import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyInstallerSession } from "@/lib/auth-installer";

export async function POST(req: Request) {
  try {
    const session = await verifyInstallerSession();
    if (!session.isAuthenticated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { leadId, quoteId, amount, method, utrNumber } = body;

    const installerRef = adminDb.collection("installers").doc(session.installerId as string);
    const leadRef = adminDb.collection("leads").doc(leadId);

    const [installerSnap, leadSnap] = await Promise.all([installerRef.get(), leadRef.get()]);

    const isTrusted = installerSnap.data()?.is_trusted_payment_collector === true;
    const isJobTrusted = leadSnap.data()?.job_level_cash_authority === true;

    const autoApprove = isTrusted || isJobTrusted;

    const verification = {
      lead_id: leadId,
      quote_id: quoteId,
      installer_id: session.installerId,
      installer_name: session.installerName,
      amount,
      method,
      utr_number: utrNumber || null,
      status: autoApprove ? "approved" : "pending",
      created_at: new Date().toISOString(),
    };

    await adminDb.collection("offline_verifications").add(verification);

    if (autoApprove) {
       await leadRef.update({ status: "won" });
       // Also log to ledger
       await adminDb.collection("ledger_transactions").add({
          user_id: session.installerId,
          user_type: "installer",
          amount: amount,
          type: "cash_collected",
          description: "Direct " + method.toUpperCase() + " collection for Job " + quoteId.slice(-6),
          job_id: quoteId,
          created_at: new Date().toISOString()
       });
    }

    return NextResponse.json({ success: true, status: verification.status });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
