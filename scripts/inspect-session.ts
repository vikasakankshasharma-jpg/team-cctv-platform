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
  const doc = await db.collection("whatsapp_sessions").doc("919587980007").get();
  console.log("=== SESSION STATE ===");
  console.log("State:", doc.data()?.state);
  console.log("Wizard Answers:", JSON.stringify(doc.data()?.wizard_answers, null, 2));

  console.log("\n=== AUDIT LOGS ===");
  const logs = await db.collection("whatsapp_audit_logs")
    .where("phone", "==", "919587980007")
    .limit(50)
    .get();
  console.log("Found logs:", logs.size);
  const items: any[] = [];
  logs.forEach(l => items.push(l.data()));
  items.sort((a, b) => {
    const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : (new Date(a.timestamp)).getTime();
    const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : (new Date(b.timestamp)).getTime();
    return ta - tb;
  });
  items.forEach(d => {
    const time = d.timestamp?.toDate ? d.timestamp.toDate().toISOString() : d.timestamp;
    console.log(`[${time}] ${d.direction}: state=${d.state} content=${JSON.stringify(d.content || d.payload || d.text || d.message)}`);
  });
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
