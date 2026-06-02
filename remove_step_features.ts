import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function removeFeaturesStep() {
  const stepRef = db.collection("wizard_steps").doc("step_features");
  
  // Also delete questions subcollection
  const questionsSnap = await stepRef.collection("questions").get();
  for (const qDoc of questionsSnap.docs) {
    const optionsSnap = await qDoc.ref.collection("options").get();
    for (const optDoc of optionsSnap.docs) {
      await optDoc.ref.delete();
    }
    await qDoc.ref.delete();
  }
  
  await stepRef.delete();
  console.log("Successfully deleted step_features from the database.");
}

removeFeaturesStep().then(() => process.exit(0)).catch(console.error);
