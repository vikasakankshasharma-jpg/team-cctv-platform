import { NextResponse, after } from "next/server";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";
import { isDuplicateMessage, buildDedupeKey, acquireDistributedLock, normalizePhoneNumber } from "@/lib/whatsapp/deduplication";
import { WhatsAppIncomingType } from "@/types/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "TEAM_CCTV_WEBHOOK_SECRET";

  if (mode === "subscribe" && token === verifyToken) {
    console.log("✅ WhatsApp Webhook verified successfully!");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate the event structure & ignore status receipts (sent, delivered, read)
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Ignore delivery status callbacks to prevent ghost triggers
    if (value?.statuses && Array.isArray(value.statuses)) {
      return NextResponse.json({ success: true, message: "Ignored delivery status callback" });
    }

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];
    
    // Check if it's a valid incoming message
    if (!message) {
      return NextResponse.json({ success: true });
    }

    const from = normalizePhoneNumber(message.from); // Customer's verified mobile number in canonical 9198XXXXXXXX format
    const messageId = message.id; // Unique Meta message ID (e.g. wamid.HBgL...)

    const profileName = contact?.profile?.name || "WhatsApp Customer";
    const referral = message.referral; // CTWA referral object

    const context = {
      profileName,
      referral,
      locationCoords: message.location ? {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
      } : undefined,
      mediaId: message.image?.id || message.document?.id || message.audio?.id || message.video?.id,
    };

    let incomingType: WhatsAppIncomingType = "text";
    let content: any = "";

    if (message.type === "text") {
      incomingType = "text";
      content = message.text?.body as string;
    } else if (message.type === "interactive") {
      const interactive = message.interactive;
      if (interactive.type === "nfm_reply") {
        incomingType = "nfm_reply";
        content = interactive.nfm_reply?.response_json;
      } else {
        incomingType = "interactive";
        content = interactive.button_reply?.id || interactive.list_reply?.id || interactive.button_reply?.title || interactive.list_reply?.title || "";
      }
    } else if (message.type === "location") {
      incomingType = "location";
      content = message.location;
    } else if (message.type === "image") {
      incomingType = "image";
      content = message.image;
    } else if (message.type === "document") {
      incomingType = "document";
      content = message.document;
    } else if (message.type === "audio" || message.type === "voice") {
      incomingType = "audio";
      content = message.audio || { type: "audio" };
    } else if (message.type === "video") {
      incomingType = "video";
      content = message.video || { type: "video" };
    } else if (message.type === "sticker") {
      incomingType = "sticker";
      content = message.sticker || { type: "sticker" };
    }

    // 2. Distributed deduplication check using unique Meta message ID or payload fingerprint
    const dedupeKey = buildDedupeKey(from, messageId, incomingType, content);
    const isLockAcquired = await acquireDistributedLock(dedupeKey, from, content);
    if (!isLockAcquired) {
      console.warn(`[Meta WhatsApp Webhook] Duplicate inbound message detected and suppressed: ${dedupeKey}`);
      return NextResponse.json({ success: true, message: "Ignored duplicate message" });
    }

    // 3. Process asynchronously via Next.js after() to immediately return HTTP 200 within <15ms
    after(async () => {
      try {
        console.log(`[Meta WhatsApp Webhook] Processing background message from ${from}: ${incomingType}`);
        await processIncomingMessage(from, incomingType, content, context);
      } catch (error) {
        console.error("🔥 Error in background processIncomingMessage:", error);
      }
    });

    return NextResponse.json({ success: true, status: "queued" });
  } catch (error) {
    console.error("🔥 WhatsApp Webhook Processing Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
