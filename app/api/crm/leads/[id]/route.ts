import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";
import { resolvePincodeHierarchy } from "@/lib/geo/pincode-resolver";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireRoleApi(["sales_staff", "super_admin"]);

    const params = await context.params;
    const leadId = params.id;
    const leadDoc = await adminDb.collection("leads").doc(leadId).get();

    if (!leadDoc.exists) {
      return NextResponse.json({ success: false, message: "Lead not found" }, { status: 404 });
    }

    const lead: any = { id: leadDoc.id, ...leadDoc.data() };

    // Auto-heal and sanitize legacy "Unknown" in address
    const rawPin = lead.address?.pincode || lead.pincode || lead.detected_pincode || "";
    if (rawPin) {
      const geo = resolvePincodeHierarchy(rawPin);
      if (typeof lead.address === "object" && lead.address !== null) {
        if (!lead.address.city || lead.address.city.toLowerCase() === "unknown") {
          lead.address.city = geo.city;
        }
        if (!lead.address.district || lead.address.district.toLowerCase() === "unknown") {
          lead.address.district = geo.district;
        }
        if (!lead.address.state || lead.address.state.toLowerCase() === "unknown") {
          lead.address.state = geo.state;
        }
        if (typeof lead.address.full_address === "string" && lead.address.full_address.toLowerCase().includes("unknown")) {
          lead.address.full_address = [lead.address.street, lead.address.area, geo.city, geo.state, rawPin].filter(Boolean).filter(s => s.toLowerCase() !== "unknown").join(", ");
        }
      }
    }

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
