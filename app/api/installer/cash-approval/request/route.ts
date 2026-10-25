import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifyInstallerSession } from "@/lib/auth-installer";

export async function POST(req: Request) {
  try {
    const session = await verifyInstallerSession();
    const { leadId, quoteId, amount, reason } = await req.json();

    if (!session.isAuthenticated && !quoteId && !leadId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedLeadId = leadId || quoteId;
    let leadRef = adminDb.collection("leads").doc(resolvedLeadId);
    let leadSnap = await leadRef.get();

    if (!leadSnap.exists && quoteId) {
      const qSnap = await adminDb.collection("quotes").doc(quoteId).get();
      if (qSnap.exists) {
        const qData = qSnap.data();
        if (qData?.lead_id) {
          leadRef = adminDb.collection("leads").doc(qData.lead_id);
          leadSnap = await leadRef.get();
        }
      }
    }

    if (!leadSnap.exists && !quoteId) {
      return NextResponse.json({ error: "Lead or Quote not found" }, { status: 404 });
    }

    const requestPayload = {
      cash_approval_requested: true,
      cash_approval_status: "pending",
      cash_requested_amount: Number(amount) || 0,
      cash_requested_reason: reason || "Customer prefers cash on site",
      cash_requested_by_installer_id: session.installerId || "field_staff",
      cash_requested_by_installer_name: session.installerName || "Field Delivery / Installer Staff",
      cash_requested_at: new Date().toISOString(),
      updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
    };

    if (leadSnap.exists) {
      await leadRef.update(requestPayload);
    }

    if (quoteId) {
      try {
        await adminDb.collection("quotes").doc(quoteId).update({
          cash_approval_requested: true,
          cash_approval_status: "pending",
          cash_requested_amount: Number(amount) || 0,
        });
      } catch {}
    }

    // Log in audit logs for Admin Visibility
    await adminDb.collection("audit_logs").add({
      entity_type: "cash_approval_request",
      entity_id: leadId,
      actor: "installer",
      actor_id: session.installerId,
      actor_name: session.installerName,
      details: {
        lead_id: leadId,
        quote_id: quoteId,
        amount: Number(amount) || 0,
        reason: reason || "Customer prefers cash on site",
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Cash collection request submitted for Admin approval.",
    });
  } catch (error: any) {
    console.error("[Cash Approval Request Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
