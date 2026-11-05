const fs = require('fs');
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

async function check() {
  for (const id of ['CAM-CP-4G-PT-CAM', 'CAM-CP-WIFI-E25A']) {
    const doc = await db.collection('products').doc(id).get();
    console.log(id, JSON.stringify(doc.data(), null, 2));
  }
}

check().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
