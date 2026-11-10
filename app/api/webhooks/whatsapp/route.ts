import { NextResponse, after } from "next/server";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";
import { isDuplicateMessage, buildDedupeKey, acquireDistributedLock } from "@/lib/whatsapp/deduplication";

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

    const from = message.from; // Customer's verified mobile number
    const messageId = message.id; // Unique Meta message ID (e.g. wamid.HBgL...)

    // 2. Distributed deduplication check using unique Meta message ID or payload fingerprint
    const dedupeKey = buildDedupeKey(from, messageId, message.type, message.text?.body || message.interactive);
    const isLockAcquired = await acquireDistributedLock(dedupeKey, from, message.text?.body || message.interactive);
    if (!isLockAcquired) {
      console.warn(`[Meta WhatsApp Webhook] Duplicate inbound message detected and suppressed: ${dedupeKey}`);
      return NextResponse.json({ success: true, message: "Ignored duplicate message" });
    }

    const profileName = contact?.profile?.name || "WhatsApp Customer";
    const referral = message.referral; // CTWA referral object

    const context = {
      profileName,
      referral,
      locationCoords: message.location ? {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
      } : undefined,
      mediaId: message.image?.id || message.document?.id,
    };

    let incomingType: "text" | "interactive" | "nfm_reply" | "location" | "image" | "document" = "text";
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
        if (interactive.type === "button_reply") {
          content = interactive.button_reply?.id;
        } else if (interactive.type === "list_reply") {
          content = interactive.list_reply?.id;
        }
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
    }

    // 3. Process asynchronously via Next.js after() to immediately return HTTP 200 within <15ms
    after(async () => {
      try {
        if (content) {
          await processIncomingMessage(from, incomingType, content, context);
        }
      } catch (err) {
        console.error("🔥 [WhatsApp Webhook Async Execution Error]:", err);
      }
    });

    // Return HTTP 200 immediately so Meta never retries
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 WhatsApp Webhook Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 200 });
  }
}
