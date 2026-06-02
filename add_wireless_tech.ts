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

async function addWireless() {
  const stepsSnapshot = await db.collection("wizard_steps").get();
  
  for (const doc of stepsSnapshot.docs) {
    const data = doc.data();
    if (data.title === "Camera Technology") {
      const qSnap = await doc.ref.collection("questions").get();
      for (const qDoc of qSnap.docs) {
        if (qDoc.id === "q_tech") {
           await qDoc.ref.collection("options").doc("opt_wireless").set({
             label: "Wireless Cameras (4G/Solar/WiFi)",
             value: "WiFi",
             position: 2
           });
           console.log("Added opt_wireless to q_tech successfully");
        }
      }
    }
  }
}

addWireless().then(() => process.exit(0)).catch(console.error);
