const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}
const db = admin.firestore();

async function inspectAllServices() {
  const addonsSnap = await db.collection('addons').get();
  console.log(`Total addons in Firestore: ${addonsSnap.docs.length}`);
  addonsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`Addon [${d.id}]: name=${data.name || data.display_name}, price=₹${data.price}, cost=₹${data.cost || data.base_cost}, type=${data.type || data.category}`);
  });

  const settingsSnap = await db.collection('settings').get();
  console.log(`\nTotal settings docs in Firestore: ${settingsSnap.docs.length}`);
  settingsSnap.docs.forEach(d => {
    console.log(`Settings [${d.id}]:`, JSON.stringify(d.data(), null, 2));
  });
}

inspectAllServices().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
