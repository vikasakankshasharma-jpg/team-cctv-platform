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
        const adminPhone = settingsSnap.data()?.admin_notification_phone || "919772699395";
        // 2. Format message
        const formattedMessage = `*${title}*\n\n${message}`;
        // 3. TODO: Implement actual HTTP call to WhatsApp provider here
        console.log(`[WhatsAppService] Simulated message dispatched to ${adminPhone}: ${formattedMessage.substring(0, 50)}...`);
        return true;
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