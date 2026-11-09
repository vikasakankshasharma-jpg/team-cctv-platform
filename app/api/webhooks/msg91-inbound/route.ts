import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/app/actions/leads";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";

export const dynamic = "force-dynamic";

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

    // If no customer phone found (e.g. synthetic test ping without phone), immediately return success
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
      try {
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
      } catch (e) {
        console.error("[MSG91 Webhook Opt-Out Error]:", e);
      }
    } else {
      // Forward inbound message (e.g. "Hi P102" or interactive selection) to Bot Engine
      let rawText = data.text || data.message || "";
      let resolvedInteractiveId = "";
      let resolvedTitle = "";

      // 1. Inspect top-level interactive / button properties
      let rawButton = data.button || data.button_payload || data.button_reply;
      if (typeof rawButton === "string" && (rawButton.startsWith("{") || rawButton.startsWith("["))) {
        try { rawButton = JSON.parse(rawButton); } catch {}
      }
      if (typeof rawButton === "object" && rawButton !== null) {
        resolvedInteractiveId = rawButton.payload || rawButton.id || rawButton.button_reply?.id || "";
        resolvedTitle = rawButton.text || rawButton.title || "";
      } else if (typeof rawButton === "string" && rawButton.trim()) {
        resolvedInteractiveId = rawButton.trim();
      }

      let rawInteractive = data.interactive || data.list_reply;
      if (typeof rawInteractive === "string" && (rawInteractive.startsWith("{") || rawInteractive.startsWith("["))) {
        try { rawInteractive = JSON.parse(rawInteractive); } catch {}
      }
      if (typeof rawInteractive === "object" && rawInteractive !== null) {
        resolvedInteractiveId = 
          rawInteractive.button_reply?.id || 
          rawInteractive.list_reply?.id || 
          rawInteractive.payload || 
          rawInteractive.id || 
          resolvedInteractiveId;
        resolvedTitle = 
          rawInteractive.button_reply?.title || 
          rawInteractive.list_reply?.title || 
          rawInteractive.text || 
          rawInteractive.title || 
          resolvedTitle;
      } else if (typeof rawInteractive === "string" && rawInteractive.trim()) {
        resolvedInteractiveId = rawInteractive.trim();
      }

      // 2. Inspect messages array (MSG91 passes stringified Meta array in data.messages)
      let messagesArr: any[] = [];
      if (Array.isArray(data.messages)) {
        messagesArr = data.messages;
      } else if (typeof data.messages === "string" && data.messages.trim().startsWith("[")) {
        try { messagesArr = JSON.parse(data.messages); } catch {}
      }
      if (messagesArr.length > 0) {
        const firstMsg = messagesArr[0];
        if (firstMsg) {
          if (firstMsg.type === "interactive" && firstMsg.interactive) {
            const inter = firstMsg.interactive;
            resolvedInteractiveId = inter.button_reply?.id || inter.list_reply?.id || resolvedInteractiveId;
            resolvedTitle = inter.button_reply?.title || inter.list_reply?.title || resolvedTitle;
          } else if (firstMsg.type === "button" && firstMsg.button) {
            resolvedInteractiveId = firstMsg.button.payload || firstMsg.button.text || resolvedInteractiveId;
            resolvedTitle = firstMsg.button.text || resolvedTitle;
          } else if (firstMsg.type === "text" && firstMsg.text?.body) {
            if (!rawText) rawText = firstMsg.text.body;
          } else if (firstMsg.type === "location" && firstMsg.location) {
            data.location = firstMsg.location;
          } else if (firstMsg.type === "image" && firstMsg.image) {
            data.image = firstMsg.image;
          } else if (firstMsg.type === "document" && firstMsg.document) {
            data.document = firstMsg.document;
          }
        }
      }

      // 3. Determine final content & incomingType
      let incomingType: "text" | "interactive" | "nfm_reply" | "location" | "image" | "document" = "text";
      let content: any = rawText;

      if (resolvedInteractiveId) {
        incomingType = "interactive";
        content = resolvedInteractiveId;
      } else if (resolvedTitle && !rawText) {
        incomingType = "interactive";
        content = resolvedTitle;
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
      } else {
        incomingType = "text";
        content = rawText;
      }

      // Directly await processing so serverless function keeps execution alive until dispatch completes
      try {
        await processIncomingMessage(cleanPhone, incomingType, content, {
          profileName: data.customerName || data.name || data.sender_name || "WhatsApp Customer",
          locationCoords: data.location || (data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : undefined),
          mediaId: data.image?.id || data.document?.id || data.uuid || data.requestId,
        });
      } catch (err) {
        console.error("[MSG91 Webhook Processing Error]:", err);
      }
    }

    // Immediately respond to MSG91 with HTTP 200 within milliseconds
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MSG91 Webhook] Error:", error);
    // Always return 200 so MSG91 doesn't retry endlessly on transient errors
    return NextResponse.json({ success: true, error: error.message });
  }
}
