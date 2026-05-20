import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Cloud Function: updatePriorityScore
 * Trigger: onDocumentWritten for "leads/{leadId}"
 * Purpose: Maintains accurate waitlist and confirmed counts per city in "service_areas"
 *          and recalculates the Priority Score.
 */
export const updatePriorityScore = functions.firestore
  .document("leads/{leadId}")
  .onWrite(async (change, context) => {
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    // We only care about leads that have a detected_city
    const cityData = afterData?.detected_city || beforeData?.detected_city;
    if (!cityData) return;

    const citySlug = cityData.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!citySlug) return;

    // Recalculate leads for this city (aggregate query for accuracy)
    // In a massive scale app, use increments, but for <10k leads per city, aggregate is fine and self-healing.
    const cityLeadsSnapshot = await db.collection("leads")
      .where("detected_city", "==", cityData)
      .get();

    let waitlistCount = 0;
    let confirmedCount = 0;

    cityLeadsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Only count leads that are NOT marked as 'won' or 'lost' maybe?
      // Or just count all leads that came through the wizard.
      if (data.status !== "won" && data.status !== "lost") {
        waitlistCount++;
        if (data.waitlist_confirmed === true) {
          confirmedCount++;
        }
      }
    });

    // Fetch impressions
    const impressionsDoc = await db.collection("city_impressions").doc(citySlug).get();
    const impressionsData = impressionsDoc.data();
    const looks = impressionsData?.total_lookups || 0;

    // Calculate priority score: (Looks × 0.2) + (Leads × 0.5) + (Confirmed × 0.3)
    const priorityScore = (looks * 0.2) + (waitlistCount * 0.5) + (confirmedCount * 0.3);

    // Update the service_areas document
    await db.collection("service_areas").doc(citySlug).set({
      city: cityData,
      state: afterData?.state || beforeData?.state || "",
      waitlist_count: waitlistCount,
      confirmed_count: confirmedCount,
      priority_score: parseFloat(priorityScore.toFixed(2)),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Updated priority score for ${citySlug}: ${priorityScore}`);
  });
