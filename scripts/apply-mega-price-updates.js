/**
 * @file secure-easy/scripts/apply-mega-price-updates.js
 * @description Applies verified Mega Compu World customer price updates to Firestore products.
 */

const fs = require('fs');
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

// Load the verified updates from our definitive audit
const auditData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../scratch/definitive_audit.json'), 'utf8'));
const updates = auditData.updates_to_apply;

console.log(`Preparing to update ${updates.length} products in Firestore...`);

async function applyUpdates() {
  const batch = db.batch();
  let count = 0;

  for (const item of updates) {
    const docRef = db.collection('products').doc(item.id);
    
    batch.update(docRef, {
      unit_price: item.new_unit_price,
      base_cost: item.new_base_cost,
      margin_percentage: item.margin_percentage,
      vendor_pid: item.mega_pid,
      vendor_product_id: item.mega_pid,
      item_code: item.mega_item_code,
      vendor_title: item.mega_title,
      vendor_stock_status: item.mega_stock,
      vendor_id: 'mega-jaipur',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;
  }

  await batch.commit();
  console.log(`✅ Successfully updated ${count} products in Firestore with latest Mega Compu World customer prices!`);
}

applyUpdates()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Update failed:', err);
    process.exit(1);
  });
