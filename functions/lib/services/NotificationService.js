"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const admin = require("firebase-admin");
/**
 * Console Logger Provider (Fallback & Audit)
 */
class ConsoleNotificationProvider {
    constructor() {
        this.name = "ConsoleLog";
    }
    async sendAdminAlert(title, message, data) {
        console.log(`\n===========================================`);
        console.log(`🔔 [ADMIN ALERT] ${title}`);
        console.log(`===========================================`);
        console.log(`${message}`);
        if (data) {
            console.log(`[Data Context]:`, JSON.stringify(data, null, 2));
        }
        console.log(`===========================================\n`);
        return true;
    }
}
/**
 * Placeholder for Future WhatsApp API Provider
 * (e.g., Twilio, Meta Cloud API, UltraMsg)
 */
class WhatsAppNotificationProvider {
    constructor() {
        this.name = "WhatsAppAPI";
    }
    async sendAdminAlert(title, message, data) {
        // 1. Fetch admin phone number from settings
        const db = admin.firestore();
        const settingsSnap = await db.collection("settings").doc("app_config").get();
        let adminPhone = settingsSnap.data()?.admin_notification_phone || "919772699395";
        // Ensure phone number has no '+' prefix for WhatsApp API
        if (adminPhone.startsWith('+')) {
            adminPhone = adminPhone.substring(1);
        }
        // 2. Format message
        const formattedMessage = `*${title}*\n\n${message}`;
        // 3. Make HTTP call to Meta Cloud API
        const token = process.env.WHATSAPP_API_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        if (!token || !phoneId || token.includes("YOUR_")) {
            console.log(`[WhatsAppService] Missing valid API credentials. Simulated message dispatched to ${adminPhone}: ${formattedMessage.substring(0, 50)}...`);
            return true;
        }
        try {
            const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: adminPhone,
                    type: "text",
                    text: { preview_url: false, body: formattedMessage }
                }),
            });
            const responseData = await response.json();
            if (!response.ok) {
                console.error("[WhatsAppService] API Error:", responseData);
                return false;
            }
            console.log(`[WhatsAppService] Successfully sent alert to ${adminPhone}`);
            return true;
        }
        catch (error) {
            console.error("[WhatsAppService] Request Failed:", error);
            return false;
        }
    }
}
/**
 * Notification Orchestrator
 * Dispatches alerts through registered providers.
 */
class NotificationServiceClass {
    constructor() {
        this.providers = [];
        // By default, always register the console logger for audit trails
        this.registerProvider(new ConsoleNotificationProvider());
        // In production, we register the active communication channels
        // For now, we simulate WhatsApp as it's the requested primary channel
        this.registerProvider(new WhatsAppNotificationProvider());
    }
    registerProvider(provider) {
        this.providers.push(provider);
    }
    /**
     * Broadcast an alert to all registered providers.
     */
    async notifyAdmin(title, message, data) {
        const promises = this.providers.map(async (provider) => {
            try {
                await provider.sendAdminAlert(title, message, data);
            }
            catch (error) {
                console.error(`[NotificationService] Provider '${provider.name}' failed to send alert:`, error);
            }
        });
        await Promise.allSettled(promises);
    }
}
// Export a singleton instance
exports.NotificationService = new NotificationServiceClass();
//# sourceMappingURL=NotificationService.js.map