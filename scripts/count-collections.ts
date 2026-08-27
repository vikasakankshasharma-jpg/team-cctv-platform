require('dotenv').config({ path: '.env.local.backup' }); // Use Production
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});
const db = getFirestore(app);

async function run() {
  const collections = ['inventory', 'users', 'deals', 'invoices', 'tickets', 'customers', 'serial_assets'];
  console.log("=== PRODUCTION COUNTS ===");
  for (const coll of collections) {
    const snap = await db.collection(coll).count().get();
    console.log(coll + ': ' + snap.data().count);
  }
}
run().catch(console.error);
