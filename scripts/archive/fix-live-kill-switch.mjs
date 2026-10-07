import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { resolve } from "path";
import dotenv from "dotenv";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

async function run() {
  const docRef = db.collection("settings").doc("app_config");
  const snap = await docRef.get();
  console.log("Current Live app_config:", snap.data());
  
  await docRef.set({
    system_mode: "LIVE",
    payments_enabled: true
  }, { merge: true });
  
  const snapAfter = await docRef.get();
  console.log("Updated Live app_config:", snapAfter.data());
}

run().catch(console.error);
