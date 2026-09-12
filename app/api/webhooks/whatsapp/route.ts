import { NextResponse } from "next/server";

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
    if (!message || message.type !== "text") {
      return NextResponse.json({ success: true });
    }

    const from = message.from; // Customer's phone number
    const textBody = message.text.body as string;

    // Extract Quote ID
    // Look for "Quote ID: {quoteId}" pattern from the wa.me pre-filled text
    const quoteIdMatch = textBody.match(/Quote ID:\s*([A-Za-z0-9_-]+)/i);
    
    if (quoteIdMatch && quoteIdMatch[1]) {
      const quoteId = quoteIdMatch[1];
      console.log(`[WhatsApp Webhook] Detected Quote ID request: ${quoteId} from ${from}`);

      const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
      const whatsappToken = process.env.WHATSAPP_TOKEN;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";

      if (whatsappPhoneId && whatsappToken) {
        // Send the PDF Document using Meta's Graph API
        const pdfLink = `${baseUrl}/api/quote/${quoteId}/download`;
        
        await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: from,
            type: "document",
            document: {
              link: pdfLink,
              filename: `TEAM_CCTV_Quotation_${quoteId}.pdf`,
              caption: `Here is your official PDF for Quote ID: ${quoteId}.\n\nPlease let us know if you have any questions or would like to schedule a site visit!`,
            },
          }),
        });

        console.log(`✅ Sent PDF for quote ${quoteId} to ${from}`);
      } else {
        console.warn("⚠️ WhatsApp credentials missing. Cannot dispatch PDF document.");
      }
    }

    // Always return 200 OK to Meta to acknowledge receipt and prevent retries
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 WhatsApp Webhook Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
