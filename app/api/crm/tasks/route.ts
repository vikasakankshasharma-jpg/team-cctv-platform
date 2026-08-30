import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    // 1. Strict Authorization (Only Sales Staff and Super Admin)
    const session = await requireRoleApi(["sales_staff", "super_admin"]);

    const url = new URL(request.url);
    const filter = url.searchParams.get("filter") || "hot";

    let query = adminDb.collection("followup_tasks")
      .where("status", "not-in", ["sent", "cancelled"]); // Active tasks

    // Role-based data isolation for sales staff (can only see assigned leads unless they are unassigned)
    // For MVP, assuming they can pull all pending leads or we assign them in a round-robin.
    // Let's implement view logic:

    if (filter === "hot") {
      query = adminDb.collection("followup_tasks")
        .where("priority", "in", ["HOT", "WARM"])
        .where("status", "in", ["pending", "retry_pending"])
        .orderBy("due_at", "asc");
    } else if (filter === "manual") {
      query = adminDb.collection("followup_tasks")
        .where("status", "==", "needs_manual_followup")
        .orderBy("updated_at", "desc");
    } else if (filter === "nurture") {
      query = adminDb.collection("followup_tasks")
        .where("priority", "in", ["NURTURE", "COLD"])
        .where("status", "in", ["pending", "retry_pending"])
        .orderBy("due_at", "asc");
    } else {
      return NextResponse.json({ success: false, message: "Invalid filter" }, { status: 400 });
    }

    const snap = await query.limit(50).get();
    
    // We also need lead details. In a NoSQL db, we fetch them via batch get or client-side join.
    // Here we will do a fast server-side aggregation for the dashboard.
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const leadIds = Array.from(new Set(tasks.map((t: any) => t.lead_id)));
    const leadsMap = new Map();

    if (leadIds.length > 0) {
      // Chunking if leadIds > 10 (Firestore limit for 'in')
      const chunks = [];
      for(let i=0; i < leadIds.length; i+=10) {
         chunks.push(leadIds.slice(i, i+10));
      }
      
      for (const chunk of chunks) {
         const leadSnap = await adminDb.collection("leads").where("id", "in", chunk).get();
         leadSnap.docs.forEach(d => leadsMap.set(d.id, d.data()));
      }
    }

    const enrichedTasks = tasks.map((t: any) => ({
      ...t,
      lead: leadsMap.get(t.lead_id) || null
    }));

    return NextResponse.json({ success: true, data: enrichedTasks, role: session.role });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    console.error("CRM Tasks Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
