import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import { getCanonicalBrandName } from "../lib/brand-utils";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

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

const db = admin.firestore();

async function main() {
  console.log("Checking products in Firestore for non-canonical brands...");
  const snap = await db.collection("products").get();
  let updatedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.brand) {
      const canonical = getCanonicalBrandName(data.brand);
      if (canonical && canonical !== data.brand) {
        console.log(`Updating product [${doc.id}] brand: "${data.brand}" -> "${canonical}"`);
        await doc.ref.update({
          brand: canonical,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedCount++;
      }
    }
  }

  console.log(`Finished. Updated ${updatedCount} product(s) in Firestore.`);

  console.log("\nChecking quotes in Firestore for non-canonical brand_preference...");
  const quotesSnap = await db.collection("quotes").get();
  let updatedQuotes = 0;
  for (const doc of quotesSnap.docs) {
    const data = doc.data();
    if (data.brand_preference && typeof data.brand_preference === "string") {
      const canonical = getCanonicalBrandName(data.brand_preference);
      if (canonical && canonical !== data.brand_preference && data.brand_preference.toLowerCase() !== "all") {
        console.log(`Updating quote [${doc.id}] brand_preference: "${data.brand_preference}" -> "${canonical}"`);
        await doc.ref.update({
          brand_preference: canonical,
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedQuotes++;
      }
    }
  }
  console.log(`Finished. Updated ${updatedQuotes} quote(s) in Firestore.`);
}

main().catch(console.error);
