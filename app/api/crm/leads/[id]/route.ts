import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi(["sales_staff", "super_admin"]);

    const params = await context.params;
    const leadId = params.id;
    const leadDoc = await adminDb.collection("leads").doc(leadId).get();

    if (!leadDoc.exists) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    const lead = { id: leadDoc.id, ...leadDoc.data() };

    // Fetch related Quotes
    const quotesSnap = await adminDb.collection("quotes").where("lead_id", "==", leadId).get();
    const quotes = quotesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Follow-up Tasks
    const tasksSnap = await adminDb.collection("followup_tasks").where("lead_id", "==", leadId).get();
    const tasks = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Jobs directly tied to lead (assuming Job maps to lead_id)
    const jobsSnap = await adminDb.collection("jobs").where("lead_id", "==", leadId).get();
    const jobs = jobsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Invoices (if quotes exist, we can fetch invoices by quote_id)
    const quoteIds = quotes.map(q => q.id);
    let invoices: any[] = [];
    if (quoteIds.length > 0) {
      // Chunking for Firestore limits
      const chunks = [];
      for(let i=0; i < quoteIds.length; i+=10) {
         chunks.push(quoteIds.slice(i, i+10));
      }
      for (const chunk of chunks) {
         const invSnap = await adminDb.collection("invoices").where("quote_id", "in", chunk).get();
         invoices.push(...invSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lead,
        quotes,
        tasks,
        jobs,
        invoices
      }
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    console.error("CRM Lead Detail Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
