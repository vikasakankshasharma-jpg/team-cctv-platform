import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FollowUpCampaign, Lead } from "@/types";
import { sendCustomerWhatsApp, sendAdminNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds

export async function GET(req: Request) {
  // Validate Cron Secret to protect the endpoint
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const now = new Date();
    
    // 1. Fetch active campaigns
    const campaignsSnapshot = await adminDb
      .collection("followup_campaigns")
      .where("is_active", "==", true)
      .get();
      
    if (campaignsSnapshot.empty) {
      return NextResponse.json({ message: "No active campaigns found" });
    }

    const campaigns = campaignsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as FollowUpCampaign));
    let processedCount = 0;
    
    // 2. Process campaigns sequentially to avoid overwhelming limits
    for (const campaign of campaigns) {
      // Calculate the cutoff time (must be older than delay_hours)
      const cutoffTime = new Date(now.getTime() - (campaign.delay_hours * 60 * 60 * 1000));
      
      // Query leads matching the trigger status and older than cutoff
      // Note: Firestore inequalities require an index if combined with other conditions.
      // We will query by status and filter in memory if needed, or query by updated_at if indexed.
      // For simplicity and to avoid index errors, we'll query by status and filter date in memory.
      const leadsSnapshot = await adminDb
        .collection("leads")
        .where("status", "==", campaign.trigger_status)
        .get();
        
      const eligibleLeads = leadsSnapshot.docs.filter(doc => {
        const lead = doc.data() as Lead;
        
        // Ensure updated_at exists and is older than cutoff
        const updatedAt = (lead.updated_at as any)?.toDate?.() || new Date(lead.created_at as string);
        if (updatedAt > cutoffTime) return false;
        
        // Ensure we haven't sent this campaign already
        if (lead.followups_sent?.includes(campaign.id!)) return false;
        
        return true;
      });

      for (const doc of eligibleLeads) {
        const lead = doc.data() as Lead;
        const leadId = doc.id;
        
        // 3. Apply the offer and append campaign to sent list
        const updateData: Partial<Lead> = {
          followups_sent: [...(lead.followups_sent || []), campaign.id!],
        };
        
        if (campaign.offer_type !== "none") {
          updateData.active_offer = {
            type: campaign.offer_type as "discount_percent" | "free_amc",
            value: campaign.offer_value,
            campaign_id: campaign.id!
          };
        }
        
        await adminDb.collection("leads").doc(leadId).update(updateData);
        
        // 4. Send Message
        const quoteLink = `${process.env.NEXT_PUBLIC_BASE_URL || "https://teamcctv.com"}/quote/${leadId}`;
        const offerText = campaign.offer_type === 'discount_percent' 
          ? `${campaign.offer_value}% Discount` 
          : campaign.offer_type === 'free_amc' ? "Free 1-Year AMC" : "";
          
        let message = campaign.message_template
          .replace(/{{name}}/g, lead.customer_name)
          .replace(/{{quote_link}}/g, quoteLink)
          .replace(/{{offer}}/g, offerText);
          
        if (campaign.action_channel === "whatsapp") {
          await sendCustomerWhatsApp(lead.mobile_number, message);
        } else {
          // Email fallback or integration here
          console.log(`[Email Mock] To: ${lead.mobile_number}, MSG: ${message}`);
        }
        
        processedCount++;
      }
    }

    if (processedCount > 0) {
      await sendAdminNotification(`🚀 Engine triggered ${processedCount} follow-up sequences.`);
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount 
    });
    
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
