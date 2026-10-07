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

async function check() {
  const qs = await db.collection("quotes").orderBy("_serverCreatedAt", "desc").limit(3).get();
  for (const q of qs.docs) {
     console.log("Quote:", q.id, "Mobile:", q.data().customer_mobile, "Plan:", q.data().selectedPlan);
  }
}
check();
