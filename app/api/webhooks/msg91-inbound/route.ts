import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/app/actions/leads";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // MSG91 Inbound Webhook Payload typically looks something like this:
    // { "sender": "919999999999", "text": "Not Interested", "type": "button_reply" }
    // Structure depends exactly on how MSG91 forwards the Meta payload.
    
    const senderPhone = data.sender || data.from;
    const messageText = (data.text || data.message || "").toLowerCase();
    const buttonPayload = (data.button_payload || data.payload || "").toLowerCase();

    if (!senderPhone) {
      return NextResponse.json({ success: true, message: "Ignored: No sender phone" });
    }

    // Check if the user clicked the "Not Interested" button OR typed a stop word
    const isStopRequest = 
      buttonPayload.includes("stop") || 
      buttonPayload.includes("not_interested") ||
      messageText === "stop" || 
      messageText === "no" || 
      messageText === "not interested";

    if (isStopRequest) {
      // Find the lead associated with this phone number
      const cleanPhone = senderPhone.replace(/[^0-9]/g, "").slice(-10); // get last 10 digits
      
      const leadsSnapshot = await adminDb.collection("leads")
        .where("phone", "==", cleanPhone)
        .limit(1)
        .get();

      if (!leadsSnapshot.empty) {
        const leadDoc = leadsSnapshot.docs[0];
        
        await leadDoc.ref.update({
          status: "lost",
          do_not_disturb: true,
          updated_at: new Date()
        });

        await addLeadActivity(
          leadDoc.id, 
          "system", 
          "Customer opted out via WhatsApp Quick Reply. Status automatically changed to LOST."
        );
        
        console.log(`[MSG91 Webhook] Opt-out processed for ${cleanPhone}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MSG91 Webhook] Error:", error);
    // Always return 200 to webhooks so they don't retry infinitely
    return NextResponse.json({ success: true, error: error.message });
  }
}
