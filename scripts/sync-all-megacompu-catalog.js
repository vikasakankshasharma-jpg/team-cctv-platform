/**
 * @file scripts/sync-all-megacompu-catalog.js
 * @description CommonJS sync script for all 58 verified products from Mega Compu World:
 *              - CP Plus (8 HD + 6 Wireless)
 *              - Hikvision (15 HD)
 *              - Prama (3 HD)
 *              - A+ Products (7 HD Budget)
 *              - Secureye (5 HD)
 *              - Trueview (1 HD)
 *              - DVRs (18 units across all 5 brands)
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  });
} else {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp();

// Import the product catalog dictionary
const { ALL_MEGA_PRODUCTS } = require('./catalog-data-megacompu');

async function syncAll() {
  console.log(`Starting sync of ${Object.keys(ALL_MEGA_PRODUCTS).length} products to Firestore...`);
  let count = 0;

  for (const [id, prodData] of Object.entries(ALL_MEGA_PRODUCTS)) {
    const docRef = db.collection('products').doc(id);
    const existing = await docRef.get();

    await docRef.set(
      {
        ...prodData,
        id,
        created_at: existing.exists ? existing.data()?.created_at || ts : ts,
        updated_at: ts,
      },
      { merge: true }
    );
    count++;
    console.log(`[${count}/${Object.keys(ALL_MEGA_PRODUCTS).length}] ✅ Seeded: [${prodData.brand}] [${id}] ${prodData.display_name} -> ₹${prodData.unit_price}`);
  }

  console.log(`\n🎉 Successfully synced all ${count} products into Firestore!`);
  process.exit(0);
}

syncAll().catch(err => {
  console.error('❌ Error syncing catalog:', err);
  process.exit(1);
});
