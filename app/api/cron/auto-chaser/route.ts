import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Msg91WhatsAppProvider } from "@/lib/whatsapp/msg91-provider";
import { addLeadActivity } from "@/app/actions/leads"; 

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const msg91 = new Msg91WhatsAppProvider();
    const today = new Date().toISOString().split("T")[0];

    const leadsRef = adminDb.collection("leads");
    const preSaleQuery = await leadsRef
      .where("status", "in", ["contacted", "negotiating"])
      .where("next_followup_date", "==", today)
      .where("do_not_disturb", "!=", true) // Respect opt-outs!
      .get();

    let followedUpCount = 0;
    let staledCount = 0;

    for (const doc of preSaleQuery.docs) {
      const lead = doc.data();
      const leadId = doc.id;
      
      if (!lead.phone) continue;

      // Check the 3-Strike Limit
      const currentCount = lead.followup_count || 0;
      if (currentCount >= 3) {
        // Customer ghosted us after 3 automated attempts. Mark as stale/lost.
        await doc.ref.update({
          status: "lost", // or 'stale'
          next_followup_date: null,
          updated_at: new Date()
        });
        await addLeadActivity(leadId, "system", "System stopped follow-ups (Customer ghosted after 3 attempts). Status marked as LOST.");
        staledCount++;
        continue; 
      }

      // STAGE-BASED ROUTING
      let templateSent = false;
      let activityLog = "";

      if (lead.status === "contacted") {
        // Stage 1: Just got the quote
        
        let quoteAmount = lead.total_payable || "your custom price";
        if (!lead.total_payable) {
           // Try to find the latest quote
           const qs = await adminDb.collection("quotes").where("lead_id", "==", leadId).orderBy("created_at", "desc").limit(1).get();
           if (!qs.empty) {
             quoteAmount = qs.docs[0].data().total_payable || quoteAmount;
           }
        }

        const res = await msg91.sendQuoteFollowup({
          phone: lead.phone,
          customerName: lead.name || "Customer",
          amount: quoteAmount
        });

        templateSent = res.success;
        activityLog = "System automatically sent Stage 1 Follow-up (Quote Review).";

      } else if (lead.status === "negotiating") {
        let quoteAmount = lead.total_payable || "your custom price";
        if (!lead.total_payable) {
           const qs = await adminDb.collection("quotes").where("lead_id", "==", leadId).orderBy("created_at", "desc").limit(1).get();
           if (!qs.empty) {
             quoteAmount = qs.docs[0].data().total_payable || quoteAmount;
           }
        }

        const res = await msg91.sendNegotiationNudge({
          phone: lead.phone,
          customerName: lead.name || "Customer",
          amount: quoteAmount
        });

        templateSent = res.success;
        activityLog = "System automatically sent Stage 2 Follow-up (Negotiation Nudge).";
      }

      if (templateSent) {
        followedUpCount++;
        await addLeadActivity(leadId, "system", activityLog);
        
        // Increment the strike counter and clear today's date
        await doc.ref.update({
          followup_count: currentCount + 1,
          next_followup_date: null,
          updated_at: new Date()
        });
      }
    }

    
    // ==============================================================================
    // POST-SALE FEEDBACK REQUEST (REVIEW GATING)
    // ==============================================================================
    const completedQuery = await leadsRef
      .where("status", "==", "completed")
      .where("feedback_requested", "==", false)
      .get();

    let feedbackSentCount = 0;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    for (const doc of completedQuery.docs) {
      const lead = doc.data();
      
      // Only send if it's been at least 24 hours since completion (updated_at)
      // If we don't have updated_at, we might just send it immediately, but let's be safe.
      const completedTime = lead.updated_at ? new Date(lead.updated_at.toDate ? lead.updated_at.toDate() : lead.updated_at).getTime() : now - ONE_DAY_MS;
      
      if (now - completedTime >= ONE_DAY_MS) {
        if (lead.phone) {
          const res = await msg91.sendFeedbackRequest({
            phone: lead.phone,
            customerName: lead.name || "Customer",
            leadId: doc.id
          });

          if (res.success) {
            feedbackSentCount++;
            await addLeadActivity(doc.id, "system", "System automatically sent 24-hour Post-Sale Feedback/Review Request via WhatsApp.");
            await doc.ref.update({
              feedback_requested: true,
              updated_at: new Date()
            });
          }
        }
      }
    }


    return NextResponse.json({ 
      success: true, 
      message: `Auto-Chaser complete. Sent ${followedUpCount} messages. Staled ${staledCount} ghosted leads.` 
    });

  } catch (error: any) {
    console.error("Auto-Chaser Cron Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
