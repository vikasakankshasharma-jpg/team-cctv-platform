const fs = require('fs');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const env = dotenv.parse(fs.readFileSync('.env.production'));

initializeApp({ 
  credential: cert({ 
    projectId: env.FIREBASE_PROJECT_ID, 
    clientEmail: env.FIREBASE_CLIENT_EMAIL, 
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }), 
  storageBucket: env.FIREBASE_STORAGE_BUCKET
});

const db = getFirestore();

async function run() {
  console.log('Cleaning up mock leads...');
  const leadsRef = db.collection('leads');
  
  // 1. Delete specific Quote IDs from screenshot
  const toDelete = ['QT-2026-76800', 'QT-2026-89538', 'TEST_LEAD_CRM', 'TEST_LEAD_EXPANSION'];
  
  for (const id of toDelete) {
    await leadsRef.doc(id).delete();
    console.log(`Deleted ${id} by ID`);
  }

  // 2. Delete any remaining leads with mobile '9999999999' or '9999999991' or '9999999992'
  const mobiles = ['9999999999', '9999999991', '9999999992'];
  for (const mobile of mobiles) {
    const snap = await leadsRef.where('customer_mobile', '==', mobile).get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
      console.log(`Deleted ${doc.id} by mobile ${mobile}`);
    }
    
    // Sometimes it's stored as mobile_number
    const snap2 = await leadsRef.where('mobile_number', '==', mobile).get();
    for (const doc of snap2.docs) {
      await doc.ref.delete();
      console.log(`Deleted ${doc.id} by mobile_number ${mobile}`);
    }
  }

  console.log('Cleanup complete!');
  process.exit(0);
}
run().catch(console.error);
