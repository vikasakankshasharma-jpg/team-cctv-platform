"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBookingCreated = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const NotificationService_1 = require("./services/NotificationService");
// Ensure admin app is initialized once
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Triggered when a new document is added to /site_visit_bookings collection.
 * Transition the original Lead status and generate audit intelligence.
 */
exports.onBookingCreated = functions.firestore
    .document("site_visit_bookings/{bookingId}")
    .onCreate(async (snap, context) => {
    const data = snap.data();
    const bookingId = context.params.bookingId;
    const leadId = data.lead_id;
    // 1. Dispatch Admin Notification
    const title = "📅 New Site Visit Scheduled";
    const message = `Customer: ${data.customer_name}\nDate: ${data.preferred_date}\nTime: ${data.preferred_time}\nAddress: ${data.address?.full_address || "N/A"}`;
    await NotificationService_1.NotificationService.notifyAdmin(title, message, {
        bookingId,
        leadId,
        pincode: data.address?.pincode
    });
    if (!leadId) {
        console.warn(`[Audit] Booking ${bookingId} created without lead reference. Status shift bypassed.`);
        return null;
    }
    try {
        const leadRef = admin.firestore().collection("leads").doc(leadId);
        await admin.firestore().runTransaction(async (transaction) => {
            const leadDoc = await transaction.get(leadRef);
            if (!leadDoc.exists) {
                console.warn(`[Audit] Lead ${leadId} not found for booking ${bookingId}.`);
                return;
            }
            const currentStatus = leadDoc.data()?.status;
            const terminalStatuses = ["won", "lost"];
            // Only shift status if not in a terminal state
            if (!terminalStatuses.includes(currentStatus)) {
                const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
                const auditEntry = `[${timestamp}] Site visit scheduled for ${data.preferred_date} @ ${data.preferred_time}.`;
                transaction.update(leadRef, {
                    status: "site_visit",
                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    follow_up_notes: admin.firestore.FieldValue.arrayUnion(auditEntry)
                });
            }
        });
    }
    catch (error) {
        console.error(`[CRITICAL FAULT] Booking Orchestration Failed for Lead ${leadId}: ${error.message}`);
    }
    return null;
});
//# sourceMappingURL=onBookingCreated.js.map