const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
} else {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

const db = admin.firestore();

async function checkProjectModels() {
  const snap = await db.collection('products').get();
  console.log('Total products in DB:', snap.docs.length);

  const zeroPrices = snap.docs.filter(d => !d.data().unit_price || d.data().unit_price <= 0);
  console.log('Products with price <= 0:', zeroPrices.length);
  zeroPrices.forEach(d => console.log('  [ZERO PRICE]', d.id, d.data().display_name));

  const projectBrands = snap.docs.filter(d => {
    const b = (d.data().brand || '').toLowerCase();
    const n = (d.data().display_name || '').toLowerCase();
    const t = (d.data().technical_name || '').toLowerCase();
    return b.includes('project') || n.includes('project') || t.includes('project');
  });
  console.log('Products with "project" in brand, name or tech_name:', projectBrands.length);
  projectBrands.forEach(d => console.log('  [PROJECT BRAND]', d.id, d.data().display_name));

  process.exit(0);
}

checkProjectModels().catch(console.error);
