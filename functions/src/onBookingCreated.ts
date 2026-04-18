import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Ensure admin app is initialized once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Triggered when a new document is added to /site_visit_bookings collection.
 * Transition the original Lead status and generate audit intelligence.
 */
export const onBookingCreated = functions.firestore
  .document("site_visit_bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const bookingId = context.params.bookingId;
    const leadId = data.lead_id;

    console.log(`[Elite Intelligence] Operational Alert: New Site Visit booked for ${data.customer_name}. ID: ${bookingId}`);
    
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

          console.log(`[Elite Sync] Lead ${leadId} shifted to 'site_visit' status.`);
        } else {
          console.log(`[Audit] Lead ${leadId} is in terminal state '${currentStatus}'. Bypassing status shift.`);
        }
      });
    } catch (error: any) {
      console.error(`[CRITICAL FAULT] Booking Orchestration Failed for Lead ${leadId}: ${error.message}`);
    }

    return null;
  });
