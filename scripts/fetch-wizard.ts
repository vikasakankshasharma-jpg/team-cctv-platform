import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

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

async function fetchSteps() {
  const snapshot = await db.collection("wizard_steps").get();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    console.log(`Step ID: ${doc.id}`);
    console.log(`Title: ${data.title}`);
    console.log(`Position: ${data.position}`);
    
    const qSnap = await db.collection("wizard_steps").doc(doc.id).collection("questions").get();
    for (const qDoc of qSnap.docs) {
      console.log(`  Q: ${qDoc.data().question_text}`);
      const oSnap = await qDoc.ref.collection("options").get();
      for (const oDoc of oSnap.docs) {
         console.log(`    Opt: ${oDoc.data().label}`);
      }
    }
    console.log("---");
  }
}

fetchSteps().then(() => process.exit(0));
