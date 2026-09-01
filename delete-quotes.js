const fs = require('fs');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

initializeApp({ 
  credential: cert({ 
    projectId: env['FIREBASE_PROJECT_ID'], 
    clientEmail: env['FIREBASE_CLIENT_EMAIL'], 
    privateKey: env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n') 
  }), 
  storageBucket: env['FIREBASE_STORAGE_BUCKET'] 
});
const db = getFirestore();

async function run() {
  console.log('Cleaning up quotes...');
  const quotesRef = db.collection('quotes');
  const toDelete = ['QT-2026-76800', 'QT-2026-89538'];
  for (const id of toDelete) {
    await quotesRef.doc(id).delete();
    console.log('Deleted ' + id);
  }
  
  // Also delete any quotes made by the test mobile
  const mobiles = ['9999999999', '1111111111', '2222222222', '3333333333'];
  for (const mobile of mobiles) {
    const snap = await quotesRef.where('customer_mobile', '==', mobile).get();
    for (const doc of snap.docs) { await doc.ref.delete(); console.log('Deleted ' + doc.id); }
  }
  
  // Also delete actual leads just in case
  const leadsRef = db.collection('leads');
  for (const mobile of mobiles) {
    const snap = await leadsRef.where('customer_mobile', '==', mobile).get();
    for (const doc of snap.docs) { await doc.ref.delete(); console.log('Deleted lead ' + doc.id); }
    const snap2 = await leadsRef.where('mobile_number', '==', mobile).get();
    for (const doc of snap2.docs) { await doc.ref.delete(); console.log('Deleted lead ' + doc.id); }
  }

  console.log('Done!');
}
run();
