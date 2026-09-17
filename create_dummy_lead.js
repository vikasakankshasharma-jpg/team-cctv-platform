const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function createDummyLead() {
  await db.collection('leads').doc('test_lead_id').set({
    customer_name: 'Playwright Test Customer',
    mobile_number: '9999999999',
    property_type: 'home',
    status: 'pending_customer_approval',
    assigned_installer_id: 'test_installer_id', // to ensure auth checks pass
    last_quote_id: 'test_quote_id',
    created_at: new Date()
  }, { merge: true });
  
  await db.collection('leads').doc('test_lead_id').collection('quotes').doc('test_quote_id').set({
    status: 'pending',
    configuration_snapshot: [],
    issuedAt: new Date()
  }, { merge: true });
  
  console.log("Dummy lead created.");
}

createDummyLead().catch(console.error);
