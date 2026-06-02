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

async function listSteps() {
  const stepsSnapshot = await db.collection("wizard_steps").get();
  
  for (const doc of stepsSnapshot.docs) {
    const data = doc.data();
    console.log(`Step: ${doc.id} - ${data.title}`);
    const qSnap = await doc.ref.collection("questions").get();
    for (const qDoc of qSnap.docs) {
      console.log(`  Question: ${qDoc.id} - ${qDoc.data().question_text}`);
    }
  }
}

listSteps().then(() => process.exit(0)).catch(console.error);
