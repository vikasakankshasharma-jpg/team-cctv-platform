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
    const now = new Date();
    const batch = adminDb.batch();
    const { sendAdminNotification } = await import("@/lib/notification-service");
    
    // We track SLAs for leads sitting in these queues too long
    const statusesToTrack = ["new", "site_visit", "dispatched"];
    let escalatedCount = 0;
    const notificationPromises: Promise<any>[] = [];

    for (const status of statusesToTrack) {
      const leadsSnap = await adminDb
        .collection(COLLECTIONS.LEADS)
        .where("status", "==", status)
        .where("is_escalated", "==", false)
        .where("sla_breach_at", "<=", now)
        .get();

      leadsSnap.docs.forEach((doc: any) => {
        const lead = doc.data();
        const leadRef = doc.ref;
        
        batch.update(leadRef, {
          is_escalated: true,
          follow_up_notes: arrayUnion(`[SYSTEM] SLA Breached at ${now.toISOString()} while in '${status}' status. Escalated to Admin queue.`)
        });
        
        escalatedCount++;
        
        // Push notification promise
        const leadName = lead.customer_name || "Unknown Customer";
        const msg = `🚨 *SLA BREACH ALERT*\nLead: ${leadName}\nStatus: ${status}\nThis lead has breached its SLA timeout and requires immediate attention!`;
        notificationPromises.push(sendAdminNotification(msg).catch(() => {}));
      });
    }

    if (escalatedCount === 0) {
      return NextResponse.json({ success: true, message: "No leads to escalate", escalatedCount: 0 });
    }

    // Commit DB updates
    await batch.commit();
    
    // Send notifications in parallel
    await Promise.all(notificationPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Escalated ${escalatedCount} leads.`,
      escalatedCount 
    });

  } catch (error: any) {
    console.error("SLA Escalation Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
