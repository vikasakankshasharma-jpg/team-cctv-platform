const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  }
}

const db = admin.firestore();

async function check() {
  const prods = await db.collection('products').get();
  const byCat = {};
  prods.docs.forEach(d => {
    const data = d.data();
    if (!byCat[data.category]) byCat[data.category] = [];
    byCat[data.category].push({ id: d.id, ...data });
  });

  for (const [cat, items] of Object.entries(byCat)) {
    console.log(`\n=== CATEGORY: ${cat} (${items.length} items) ===`);
    items.forEach(it => {
      console.log(`[${it.id}] ${it.display_name} -> unit_price: ${it.unit_price}, base_cost: ${it.base_cost}, margin: ${it.margin_percentage}%`);
    });
  }
}
check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
