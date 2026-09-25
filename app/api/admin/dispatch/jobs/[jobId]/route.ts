import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

// Strict State Machine Map
const VALID_TRANSITIONS: Record<string, string[]> = {
  "pending_dispatch": ["assigned", "cancelled"],
  "assigned": ["en_route", "cancelled", "pending_dispatch"],
  "en_route": ["in_progress", "assigned"],
  "in_progress": ["pending_customer_approval", "assigned"],
  "pending_customer_approval": ["completed", "in_progress"],
  "completed": ["audited"],
  "audited": [],
  "cancelled": []
};

export async function PATCH(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    await requireAdmin();
    const { status, installer_id, hub_id } = await req.json();
    const resolvedParams = await params;
    
    if (!status && !installer_id && !hub_id) {
      return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
    }

    const jobRef = adminDb.collection("jobs").doc(resolvedParams.jobId);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const currentStatus = jobDoc.data()?.status;

    // Validate state transition if status is being updated
    if (status && currentStatus !== status) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json({ 
          error: `Invalid state transition from ${currentStatus} to ${status}` 
        }, { status: 400 });
      }
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (status) updates.status = status;
    if (installer_id) updates.installer_id = installer_id;
    if (hub_id) updates.hub_id = hub_id;

    await jobRef.update(updates);

    // Sync back to Quote and Lead
    const jobData = jobDoc.data() || {};
    const quoteId = jobData.quote_id;
    const leadId = jobData.lead_id;

    if (quoteId) {
      const qUpdates: any = { job_status: status || currentStatus };
      if (status === "assigned" || status === "en_route") qUpdates.delivery_status = "DISPATCHED";
      if (status === "completed") qUpdates.delivery_status = "DELIVERED";
      if (installer_id) qUpdates.assigned_installer_id = installer_id;
      await adminDb.collection("quotes").doc(quoteId).update(qUpdates).catch(() => {});
    }

    if (leadId) {
      const lUpdates: any = {};
      if (installer_id) lUpdates.assigned_to_installer_id = installer_id;
      if (status) lUpdates.job_status = status;
      await adminDb.collection("leads").doc(leadId).update(lUpdates).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
