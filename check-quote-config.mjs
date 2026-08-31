import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

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
  const leadId = 'GYrrFN4qQQMwwm8OlbLb';
  const quoteId = 'x17ujtjpmxt6Gpf6hLIe';
  const qDoc = await db.collection(`leads/${leadId}/quotes`).doc(quoteId).get();
  console.log("CONFIGURATION:", JSON.stringify(qDoc.data().configuration, null, 2));
}
run().catch(console.error);
