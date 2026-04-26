"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onLeadCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const NotificationService_1 = require("./services/NotificationService");
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Triggered when a new lead is created.
 * Dispatches a notification to the admin via registered providers.
 */
exports.onLeadCreated = functions.firestore
    .document("leads/{leadId}")
    .onCreate(async (snap, context) => {
    const leadId = context.params.leadId;
    const data = snap.data();
    const title = "🚀 New Hot Lead Captured";
    const message = `Name: ${data.customer_name}\nMobile: ${data.mobile_number}\nProperty: ${data.property_type}\nTechnology: ${data.technology_choice}`;
    await NotificationService_1.NotificationService.notifyAdmin(title, message, {
        leadId,
        referral_code: data.referral_code_used,
        cabling_done: data.cabling_done
    });
    return null;
});
//# sourceMappingURL=onLeadCreated.js.map