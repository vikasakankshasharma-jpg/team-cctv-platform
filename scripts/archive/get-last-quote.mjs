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
  const leads = await db.collection("leads").orderBy("created_at", "desc").limit(1).get();
  for (const l of leads.docs) {
     console.log("Lead:", l.id, l.data().customer_name, l.data().mobile_number);
     const quotes = await l.ref.collection("quotes").get();
     quotes.docs.forEach(q => console.log(" Quote:", q.id, q.data().total_payable));
  }
}
check();
