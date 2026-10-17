/**
 * @file scripts/sync-camera-sd-speaker-caps.ts
 * @description Ensures all cameras with an SD slot or two-way talk have
 *              has_speaker and max_sd_capacity_gb set consistently.
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getDb() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey,
      }),
    });
  }
  return admin.firestore();
}

async function syncCapabilities() {
  const db = getDb();
  console.log("Checking all cameras in Firestore for SD Slot and Speaker consistency...");

  const snap = await db.collection("products").where("category", "==", "cctv_camera").get();
  console.log(`Found ${snap.size} CCTV camera products.`);

  let updatedCount = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates: Record<string, any> = {};

    // Check SD slot
    const nameLower = (data.display_name || "").toLowerCase() + " " + (data.technical_name || "").toLowerCase();
    const features = (data.features || []).map((f: string) => f.toLowerCase());
    const isSd = !!data.has_sd_slot || features.includes("sd_slot") || nameLower.includes("sd card") || nameLower.includes("microsd");

    if (isSd && !data.has_sd_slot) {
      updates.has_sd_slot = true;
    }

    if ((isSd || data.has_sd_slot) && !data.max_sd_capacity_gb) {
      // Default to 128GB unless 256GB is explicitly mentioned
      if (nameLower.includes("256gb") || nameLower.includes("256 gb")) {
        updates.max_sd_capacity_gb = 256;
      } else {
        updates.max_sd_capacity_gb = 128;
      }
    }

    // Check Speaker / 2-way talk
    const hasSpeakerOr2Way = !!data.has_speaker || 
      !!data.has_2way_audio || 
      features.includes("speaker") || 
      features.includes("2-way") || 
      nameLower.includes("two way") || 
      nameLower.includes("2-way") || 
      nameLower.includes("two-way") || 
      nameLower.includes("talk") || 
      nameLower.includes("speaker");

    if (hasSpeakerOr2Way && !data.has_speaker) {
      updates.has_speaker = true;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update({
        ...updates,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(` ✅ Updated [${doc.id}] ${data.display_name}:`, updates);
      updatedCount++;
    }
  }

  console.log(`\n🎉 Completed sync! Updated ${updatedCount} cameras.`);
}

syncCapabilities().catch((err) => {
  console.error("❌ Error syncing capabilities:", err);
  process.exit(1);
});
