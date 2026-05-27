import * as dotenv from "dotenv";
dotenv.config({ path: ".env.production" });
dotenv.config({ path: ".env.local" });

import * as admin from "firebase-admin";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
privateKey = privateKey.replace(/\\n/g, "\n");
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.substring(1, privateKey.length - 1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function main() {
  console.log("Fetching latest lead...");
  const snapshot = await db.collection("leads").orderBy("created_at", "desc").limit(1).get();
  if (snapshot.empty) {
    console.log("No leads found.");
  } else {
    const doc = snapshot.docs[0];
    console.log("Lead ID:", doc.id);
    console.dir(doc.data(), { depth: null });
  }
}

main().catch(console.error);
