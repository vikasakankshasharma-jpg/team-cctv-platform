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

async function migrate() {
  const allProds = await db.collection("products").where("is_active", "==", true).get();
  console.log(`Migrating ${allProds.docs.length} products to have is_quotation_eligible = true`);
  
  const batch = db.batch();
  let count = 0;
  for (const doc of allProds.docs) {
    batch.update(doc.ref, { is_quotation_eligible: true });
    count++;
    if (count % 400 === 0) {
        await batch.commit();
        console.log(`Committed ${count}`);
    }
  }
  
  if (count % 400 !== 0) {
      await batch.commit();
  }
  console.log(`Successfully migrated ${count} products.`);
}
migrate().catch(console.error);
