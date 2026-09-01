const fs = require('fs');
const envContent = fs.readFileSync('C:/Users/hp/Documents/TEAM Website/secure-easy/.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp({ 
  credential: cert({ 
    projectId: env['FIREBASE_PROJECT_ID'], 
    clientEmail: env['FIREBASE_CLIENT_EMAIL'], 
    privateKey: env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n') 
  }), 
  storageBucket: env['FIREBASE_STORAGE_BUCKET'] 
});
const db = getFirestore();

async function test() {
  console.log('Creating Test CRM Lead...');
  const leadRef = db.collection('leads').doc('TEST_LEAD_CRM');
  await leadRef.set({
    customer_name: 'Test CRM User',
    mobile_number: '9999999991',
    status: 'new',
    service_status: 'served',
    detected_city: 'Jaipur',
    detected_pincode: '302001',
    created_at: FieldValue.serverTimestamp()
  });
  console.log('✅ Created CRM Lead');

  console.log('Creating Test Expansion Hub Waitlist...');
  const expRef = db.collection('leads').doc('TEST_LEAD_EXPANSION');
  await expRef.set({
    customer_name: 'Test Expansion User',
    mobile_number: '9999999992',
    status: 'new',
    service_status: 'waitlist',
    detected_city: 'Unserved City',
    detected_pincode: '999999',
    waitlist_confirmed: true,
    created_at: FieldValue.serverTimestamp()
  });
  console.log('✅ Created Expansion Lead');
  process.exit(0);
}
test().catch(console.error);
