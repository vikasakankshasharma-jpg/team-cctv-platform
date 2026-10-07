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
  console.log('Fetching latest leads...');
  const leadsRef = db.collection('leads');
  const snapshot = await leadsRef.orderBy('created_at', 'desc').limit(3).get();
  
  if (snapshot.empty) {
    console.log('No leads found.');
    return;
  }

  for (const doc of snapshot.docs) {
    const leadData = doc.data();
    console.log('\n--- LEAD:', doc.id, '---');
    console.log('Name:', leadData.customer_name);
    console.log('Phone:', leadData.mobile_number);
    console.log('Property:', leadData.property_type);
    
    // Fetch quotes for this lead
    const quotesRef = db.collection(`leads/${doc.id}/quotes`);
    const quotesSnap = await quotesRef.orderBy('created_at', 'desc').get();
    
    if (quotesSnap.empty) {
      console.log('  No quotes found for this lead.');
      continue;
    }
    
    for (const qDoc of quotesSnap.docs) {
      const qData = qDoc.data();
      console.log('  -> QUOTE:', qDoc.id);
      console.log('     Total Price:', qData.total_price);
      console.log('     Config:', JSON.stringify(qData.configuration));
      console.log('     Camera Setup:', JSON.stringify(qData.pricing_breakdown?.cameras));
      console.log('     Storage:', JSON.stringify(qData.pricing_breakdown?.storage));
      console.log('     Cabling:', JSON.stringify(qData.pricing_breakdown?.cabling));
      console.log('     Accessories:', JSON.stringify(qData.pricing_breakdown?.accessories));
      console.log('     Labor:', JSON.stringify(qData.pricing_breakdown?.labor));
      console.log('     Summary:', JSON.stringify(qData.pricing_breakdown?.summary));
    }
  }
}

run().catch(console.error);
