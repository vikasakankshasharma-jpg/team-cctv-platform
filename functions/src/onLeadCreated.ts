import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { NotificationService } from "./services/NotificationService";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Triggered when a new lead is created.
 * Dispatches a notification to the admin via registered providers.
 */
export const onLeadCreated = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snap, context) => {
    const leadId = context.params.leadId;
    const data = snap.data();

    const title = "🚀 New Hot Lead Captured";
    const message = `Name: ${data.customer_name}\nMobile: ${data.mobile_number}\nProperty: ${data.property_type}\nTechnology: ${data.technology_choice}`;

    await NotificationService.notifyAdmin(title, message, {
      leadId,
      referral_code: data.referral_code_used,
      cabling_done: data.cabling_done
    });

    return null;
  });
