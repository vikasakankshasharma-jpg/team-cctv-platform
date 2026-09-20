import { NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/whatsapp/bot-engine";

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

    // Validate the event structure
    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json({ success: true }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];
    
    // Check if it's a valid incoming message
    if (!message) {
      return NextResponse.json({ success: true });
    }

    const from = message.from; // Customer's phone number
    const referral = message.referral; // CTWA referral object

    if (message.type === "text") {
      const textBody = message.text.body as string;
      
      // Legacy check for "Quote ID: {quoteId}"
      const quoteIdMatch = textBody.match(/Quote ID:\s*([A-Za-z0-9_-]+)/i);
      if (quoteIdMatch && quoteIdMatch[1]) {
         // Keep legacy functionality (removed here for brevity, handled by bot-engine now, but if we need we could keep it).
         // Actually, let's keep it clean and just route to bot.
      }
      
      // Route to bot engine
      await processIncomingMessage(from, "text", textBody, referral);

    } else if (message.type === "interactive") {
      // Interactive message (Button reply, List reply, or Flow reply)
      const interactive = message.interactive;
      
      if (interactive.type === "nfm_reply") {
         // WhatsApp Flow Submission
         const responseJson = interactive.nfm_reply.response_json;
         await processIncomingMessage(from, "nfm_reply", responseJson, referral);
      } else {
        let replyContent = "";
        if (interactive.type === "button_reply") {
          replyContent = interactive.button_reply.id;
        } else if (interactive.type === "list_reply") {
          replyContent = interactive.list_reply.id;
        }
        
        if (replyContent) {
          await processIncomingMessage(from, "interactive", replyContent, referral);
        }
      }
    }

    // Always return 200 OK to Meta to acknowledge receipt and prevent retries
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 WhatsApp Webhook Error:", error);
    // Still return 200 to Meta to avoid retry loops, but log it
    return NextResponse.json({ success: false, message: error.message }, { status: 200 });
  }
}
