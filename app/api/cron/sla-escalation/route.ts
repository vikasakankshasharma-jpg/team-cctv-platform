import { NextRequest, NextResponse } from "next/server";
import { adminDb, arrayUnion } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // 1. Verify Vercel Cron Secret (if set)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Find all "new" leads that have breached SLA and aren't escalated yet
    const now = new Date();
    
    // We cannot use inequality on multiple fields in Firestore easily without composite indexes,
    // so we query for: status == 'new', is_escalated == false, 
    // and sla_breach_at <= now
    const leadsSnap = await adminDb
      .collection(COLLECTIONS.LEADS)
      .where("status", "==", "new")
      .where("is_escalated", "==", false)
      .where("sla_breach_at", "<=", now)
      .get();

    if (leadsSnap.empty) {
      return NextResponse.json({ success: true, message: "No leads to escalate", escalatedCount: 0 });
    }

    // 3. Process Escalate in Batch
    const batch = adminDb.batch();
    let count = 0;

    leadsSnap.docs.forEach((doc) => {
      const leadRef = doc.ref;
      batch.update(leadRef, {
        is_escalated: true,
        follow_up_notes: arrayUnion(`[SYSTEM] SLA Breached at ${now.toISOString()}. Escalated to Admin queue.`)
      });
      count++;
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Escalated ${count} leads.`,
      escalatedCount: count 
    });

  } catch (error: any) {
    console.error("SLA Escalation Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
