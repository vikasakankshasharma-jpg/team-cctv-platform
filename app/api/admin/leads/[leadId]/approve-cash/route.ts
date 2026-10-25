import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const session = await verifySession("admin");
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leadId } = await params;
    const { approved = true, reason = "Approved by Admin" } = await req.json();

    const leadRef = adminDb.collection("leads").doc(leadId);
    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updatePayload: any = {
      cash_collection_approved: approved,
      cash_approved_by: session.user?.name || session.user?.email || "Admin Staff",
      cash_approved_at: new Date().toISOString(),
      cash_approval_status: approved ? "approved" : "rejected",
      cash_approval_reason: reason,
      updated_at: serverTimestamp ? serverTimestamp() : new Date().toISOString(),
    };

    await leadRef.update(updatePayload);

    // Also update current active quote if attached
    const leadData = leadSnap.data();
    const quoteId = leadData?.last_quote_id || leadData?.won_quote_id;
    if (quoteId) {
      try {
        await adminDb.collection("quotes").doc(quoteId).update({
          cash_collection_approved: approved,
          cash_approved_by: session.user?.name || "Admin Staff",
          cash_approved_at: new Date().toISOString(),
        });
      } catch {}
    }

    // Audit log
    await adminDb.collection("audit_logs").add({
      entity_type: "lead",
      entity_id: leadId,
      actor: "admin",
      actor_id: session.uid || "admin",
      action: approved ? "cash_collection_approved" : "cash_collection_revoked",
      details: {
        approved,
        reason,
        admin_user: session.user?.name || session.user?.email,
      },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, approved });
  } catch (error: any) {
    console.error("[Admin Cash Approval Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
