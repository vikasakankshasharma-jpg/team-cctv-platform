import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";
import { Job, InvoiceItemSnapshot } from "@/types";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await requireRoleApi(["installer", "super_admin", "operations_manager"]);
    const params = await context.params;
    const jobId = params.jobId;

    const jobDoc = await adminDb.collection("jobs").doc(jobId).get();
    if (!jobDoc.exists) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }

    const jobData = jobDoc.data() as Job;

    // RBAC
    if (session.role === "installer" && jobData.installer_id !== session.user?.uid) {
      return NextResponse.json({ success: false, message: "Unauthorized to view unassigned job" }, { status: 403 });
    }

    // Extract materials from quotes or invoices linked
    // Usually a job is generated from a quote. 
    let materials: InvoiceItemSnapshot[] = [];
    if (jobData.quote_id) {
      const quoteDoc = await adminDb.collection("quotes").doc(jobData.quote_id).get();
      if (quoteDoc.exists) {
        materials = quoteDoc.data()?.items || [];
      }
    }

    // If change orders exist, aggregate those items too
    if (jobData.change_order_ids && jobData.change_order_ids.length > 0) {
      for (const coId of jobData.change_order_ids) {
        const coDoc = await adminDb.collection("change_orders").doc(coId).get();
        if (coDoc.exists && coDoc.data()?.status === "paid") {
           materials = [...materials, ...(coDoc.data()?.items || [])];
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        job: jobData,
        materials
      }
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
