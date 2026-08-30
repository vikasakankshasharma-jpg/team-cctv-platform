import { WhatsAppProvider, WhatsAppMessagePayload } from "./provider";
import twilio from "twilio";

export class TwilioWhatsAppProvider implements WhatsAppProvider {
  async sendQuote(payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    console.log(`[Twilio WhatsApp] Sending quote ${payload.quoteId} to ${payload.phone}`);
    
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const contentSid = process.env.TWILIO_TEMPLATE_SID; // Must be HX...

    if (!accountSid || !authToken || !fromNumber || !contentSid) {
      return { success: false, error: "Missing Twilio Credentials or Content SID in Environment" };
    }

    const client = twilio(accountSid, authToken);

    let formattedPhone = payload.phone.replace(/[^0-9]/g, '');
    if (formattedPhone.length === 10) formattedPhone = `91${formattedPhone}`;
    const toNumber = `whatsapp:+${formattedPhone}`;

    try {
      // Sending Pre-approved Order Notification Template via Twilio Content API
      // Template: "Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}"
      const message = await client.messages.create({
        from: fromNumber,
        to: toNumber,
        contentSid: contentSid,
        contentVariables: JSON.stringify({
          "1": "CCTV Quotation",
          "2": payload.quoteId,
          "3": "approval",
          "4": `Total: ₹${payload.totalAmount}, Download: ${payload.pdfUrl || 'N/A'}`
        })
      });

      return { success: true, messageId: message.sid };
    } catch (error: any) {
      console.error("[Twilio Exception]", error);
      return { success: false, error: error.message };
    }
  }
}
