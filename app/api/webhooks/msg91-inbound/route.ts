import { NextResponse, after } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { addLeadActivity } from "@/app/actions/leads";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";
import { isDuplicateMessage, buildDedupeKey, acquireDistributedLock, normalizePhoneNumber } from "@/lib/whatsapp/deduplication";
import { WhatsAppIncomingType } from "@/types/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // ──────────────────────────────────────────────────────────────────────────
    // 1. FILTER OUT NON-INBOUND EVENTS (Delivery Receipts, Read Reports, Statuses)
    // ──────────────────────────────────────────────────────────────────────────
    const eventType = String(data.event || data.type || data.status || "").toLowerCase().trim();
    if (
      eventType === "delivered" || 
      eventType === "read" || 
      eventType === "sent" || 
      eventType === "delivery" || 
      eventType === "message_status" ||
      eventType === "delivery_status" ||
      Array.isArray(data.statuses) ||
      Boolean(data.entry?.[0]?.changes?.[0]?.value?.statuses)
    ) {
      return NextResponse.json({ success: true, message: "Ignored delivery/status receipt" });
    }

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

    // If no customer phone found (e.g. synthetic test ping without phone), immediately return success
    if (!customerPhone) {
      return NextResponse.json({ success: true, message: "Ignored: No customer phone found in payload" });
    }

    const cleanPhone = normalizePhoneNumber(customerPhone);

    const messageText = (data.text || data.message || "").toLowerCase().trim();
    const buttonPayload = (data.button_payload || data.payload || data.button_reply?.id || data.list_reply?.id || "").toLowerCase().trim();

    // ──────────────────────────────────────────────────────────────────────────
    // 2. PARSE INCOMING MESSAGE CONTENT & INTERACTIVE SELECTIONS
    // ──────────────────────────────────────────────────────────────────────────
    let rawText = data.text || data.message || "";
    let resolvedInteractiveId = "";
    let resolvedTitle = "";

    // 2A. Inspect top-level interactive / button properties
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

    // 2B. Inspect messages array (MSG91 passes stringified Meta array in data.messages)
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

    // 2C. Determine final content & incomingType
    let incomingType: WhatsAppIncomingType = "text";
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
    } else if (data.contentType === "audio" || data.type === "audio" || data.type === "voice" || data.audio) {
      incomingType = "audio";
      content = data.audio || { url: data.url, type: "audio" };
    } else if (data.contentType === "video" || data.type === "video" || data.video) {
      incomingType = "video";
      content = data.video || { url: data.url, type: "video" };
    } else if (data.contentType === "sticker" || data.type === "sticker" || data.sticker) {
      incomingType = "sticker";
      content = data.sticker || { type: "sticker" };
    } else if (data.type === "nfm_reply" || data.nfm_reply) {
      incomingType = "nfm_reply";
      content = data.nfm_reply?.response_json || data.response_json || data.payload;
    } else {
      incomingType = "text";
      content = rawText;
    }

    // Ignore empty message payloads that carry no text, button, or media
    if (!content && incomingType === "text" && !resolvedInteractiveId) {
      return NextResponse.json({ success: true, message: "Ignored: Empty content" });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 3. ATOMIC DISTRIBUTED DEDUPLICATION & IDEMPOTENCY CHECK
    // ──────────────────────────────────────────────────────────────────────────
    const rawId = data.messageId || data.msgId || data.messages?.[0]?.id || data.id;
    const dedupeKey = buildDedupeKey(cleanPhone, rawId, incomingType, content);

    const isLockAcquired = await acquireDistributedLock(dedupeKey, cleanPhone, content);
    if (!isLockAcquired) {
      console.warn(`[MSG91 Webhook] Dropping duplicate inbound delivery for key: ${dedupeKey}`);
      return NextResponse.json({ success: true, duplicate: true, message: "Duplicate message dropped" });
    }

    // Check if the user clicked the "Not Interested" button OR typed a stop word
    const isStopRequest = 
      buttonPayload.includes("stop") || 
      buttonPayload.includes("not_interested") ||
      messageText === "stop" || 
      messageText === "no" || 
      messageText === "not interested";

    // ──────────────────────────────────────────────────────────────────────────
    // 4. NON-BLOCKING ASYNCHRONOUS EXECUTION VIA after()
    // Returns HTTP 200 to MSG91 in <15ms so MSG91 NEVER triggers timeout retries!
    // ──────────────────────────────────────────────────────────────────────────
    after(async () => {
      try {
        if (isStopRequest) {
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
          await processIncomingMessage(cleanPhone, incomingType, content, {
            profileName: data.customerName || data.name || data.sender_name || "WhatsApp Customer",
            locationCoords: data.location || (data.latitude && data.longitude ? { latitude: data.latitude, longitude: data.longitude } : undefined),
            mediaId: data.image?.id || data.document?.id || data.uuid || data.requestId,
          });
        }
      } catch (err) {
        console.error("[MSG91 Webhook Async Execution Error]:", err);
      }
    });

    // Immediately respond to MSG91 with HTTP 200 within milliseconds (<15ms)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MSG91 Webhook] Error:", error);
    // Always return 200 so MSG91 doesn't retry endlessly on transient errors
    return NextResponse.json({ success: true, error: error.message });
  }
}