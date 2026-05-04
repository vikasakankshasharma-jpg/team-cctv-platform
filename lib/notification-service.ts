/**
 * Notification Service
 * Used to dispatch critical alerts (e.g., new leads, error thresholds) to admins.
 */
export async function sendAdminNotification(message: string) {
  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
    const whatsappToken = process.env.WHATSAPP_TOKEN;

    // 1. WhatsApp Priority
    if (whatsappPhoneId && whatsappToken) {
      await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: process.env.ADMIN_WHATSAPP_NUMBER || "919772699395", // Default to Master Admin
          type: "text",
          text: { body: message },
        }),
      });
      console.log("✅ WhatsApp Notification dispatched.");
      return;
    }

    // 2. Slack Fallback
    if (slackWebhookUrl) {
      await fetch(slackWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      console.log("✅ Slack Notification dispatched.");
      return;
    }

    // 3. Graceful Simulation
    console.warn("⚠️ [Notification Simulated] API Keys missing. Message:", message);

  } catch (error) {
    console.error("🔥 Notification Dispatch Error:", error);
  }
}

export async function sendCustomerWhatsApp(phone: string, message: string) {
  try {
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
    const whatsappToken = process.env.WHATSAPP_TOKEN;

    if (whatsappPhoneId && whatsappToken) {
      // Format phone number to E.164 without '+' if needed by Meta API
      const formattedPhone = phone.replace(/\D/g, "");
      const finalPhone = formattedPhone.startsWith("91") ? formattedPhone : `91${formattedPhone}`;

      await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: finalPhone,
          type: "text",
          text: { body: message },
        }),
      });
      console.log(`✅ Customer WhatsApp sent to ${finalPhone}`);
      return true;
    }
    console.warn("⚠️ [WhatsApp Simulated] Keys missing. Target:", phone, "Message:", message);
    return false;
  } catch (error) {
    console.error("🔥 Customer WhatsApp Error:", error);
    return false;
  }
}
