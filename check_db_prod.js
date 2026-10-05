require('dotenv').config({ path: '.env.vercel.production' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.replace(/"/g, ''),
      privateKey: privateKey,
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
