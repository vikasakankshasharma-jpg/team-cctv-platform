import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import admin from "firebase-admin";

const projectId = (process.env.FIREBASE_PROJECT_ID || "").replace(/^["']|["']$/g, "");
const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").replace(/^["']|["']$/g, "");
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/^["']|["']$/g, "");
privateKey = privateKey.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    })
  });
}
const db = admin.firestore();

async function run() {
  await db.collection("whatsapp_sessions").doc("919587980007").set({
    phone_number: "919587980007",
    customer_name: "Vikas Sharma",
    state: "IDLE",
    wizard_answers: {},
    last_message_at: new Date(),
    created_at: new Date(),
  });
  console.log("✅ User 919587980007 session reset to IDLE successfully!");
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
