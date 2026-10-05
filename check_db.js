require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const db = admin.firestore();

async function run() {
  const products = [];
  const snap = await db.collection('products').get();
  snap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));
  
  const addons = [];
  const addonSnap = await db.collection('addons').get();
  addonSnap.forEach(doc => addons.push({ id: doc.id, ...doc.data() }));
  
  const fs = require('fs');
  fs.writeFileSync('db_dump.json', JSON.stringify({ products, addons }, null, 2));
  console.log('Done');
}
run();
