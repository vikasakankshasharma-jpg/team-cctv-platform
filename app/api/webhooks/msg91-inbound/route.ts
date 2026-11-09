import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/app/actions/leads";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // MSG91 Inbound Webhook Payload:
    // customerNumber / mobile / from represents the customer who sent the message.
    // integratedNumber represents our business line (919982549315).
    let customerPhone = data.customerNumber || data.customer_number || data.mobile || data.from;
    
    // Safety check: only fallback to data.sender if it is NOT our own business number
    const myBusinessNumber = (process.env.MSG91_WHATSAPP_NUMBER || "919982549315").replace(/[^0-9]/g, "");
    if (!customerPhone && data.sender) {
      const cleanSender = String(data.sender).replace(/[^0-9]/g, "");
      if (cleanSender !== myBusinessNumber) {
        customerPhone = cleanSender;
      }
    }

    const messageText = (data.text || data.message || "").toLowerCase().trim();
    const buttonPayload = (data.button_payload || data.payload || data.button_reply?.id || data.list_reply?.id || "").toLowerCase().trim();

    if (!customerPhone) {
      return NextResponse.json({ success: true, message: "Ignored: No customer phone found in payload" });
    }

    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "");

    // Check if the user clicked the "Not Interested" button OR typed a stop word
    const isStopRequest = 
      buttonPayload.includes("stop") || 
      buttonPayload.includes("not_interested") ||
      messageText === "stop" || 
      messageText === "no" || 
      messageText === "not interested";

    if (isStopRequest) {
      // Find the lead associated with this phone number (last 10 digits)
      const last10Digits = cleanPhone.slice(-10);
      
      const leadsSnapshot = await adminDb.collection("leads")
        .where("phone", "==", last10Digits)
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
        
        console.log(`[MSG91 Webhook] Opt-out processed for ${last10Digits}`);
      }
    } else {
      // Forward inbound message (e.g. "Hi P102" or interactive selection) to Bot Engine
      const rawText = data.text || data.message || "";
      const interactiveId = 
        data.button || 
        data.interactive || 
        data.button_payload || 
        data.payload || 
        data.button_reply?.id || 
        data.list_reply?.id;

      let incomingType: "text" | "interactive" | "nfm_reply" | "location" | "image" | "document" = "text";
      let content = rawText;

      if (interactiveId) {
        incomingType = "interactive";
        content = typeof interactiveId === "object" ? (interactiveId.id || interactiveId.title || rawText) : interactiveId;
      } else if (data.contentType === "location" || data.type === "location" || data.location || (data.latitude && data.longitude)) {
        incomingType = "location";
        content = data.location || { latitude: data.latitude, longitude: data.longitude };
      } else if (data.contentType === "image" || data.type === "image" || data.image) {
        incomingType = "image";
        content = data.image || { url: data.url, caption: data.caption };
      } else if (data.contentType === "document" || data.type === "document" || data.document || data.filename) {
        incomingType = "document";
        content = data.document || { url: data.url, filename: data.filename, caption: data.caption };
      } else if (data.type === "nfm_reply" || data.nfm_reply) {
        incomingType = "nfm_reply";
        content = data.nfm_reply?.response_json || data.response_json || data.payload;
      }

      await processIncomingMessage(cleanPhone, incomingType, content, {
        profileName: data.customerName || data.name || data.sender_name || "WhatsApp Customer",
        locationCoords: data.location || (data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : undefined),
        mediaId: data.image?.id || data.document?.id || data.uuid || data.requestId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MSG91 Webhook] Error:", error);
    // Always return 200 so MSG91 doesn't retry endlessly on transient errors
    return NextResponse.json({ success: true, error: error.message });
  }
}
