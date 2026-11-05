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

const UPDATES = {
  'CAM-HIK-HD-2CE70KF0T-PFS': {
    vendor_pid: 'P2922',
    unit_price: 3048,
    margin_percentage: 15
  },
  'poe_switch_4port_securelink': {
    vendor_pid: 'P5316',
    unit_price: 2056,
    margin_percentage: 15
  },
  'poe_switch_8port_securelink': {
    vendor_pid: 'P2180',
    unit_price: 2170,
    margin_percentage: 15
  },
  'psu_4ch_cpplus': {
    vendor_pid: 'P1856',
    unit_price: 522,
    margin_percentage: 20
  },
  'psu_8ch_cpplus': {
    vendor_pid: 'P2097',
    unit_price: 731,
    margin_percentage: 20
  },
  'psu_16ch_cpplus': {
    vendor_pid: 'P2324',
    unit_price: 1124,
    margin_percentage: 20
  }
};

async function run() {
  const batch = db.batch();
  for (const [id, up] of Object.entries(UPDATES)) {
    const docRef = db.collection('products').doc(id);
    const base_cost = Math.round(up.unit_price / (1 + up.margin_percentage / 100));
    batch.update(docRef, {
      ...up,
      base_cost,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Updated ${id}: unit_price = ₹${up.unit_price}, base_cost = ₹${base_cost}`);
  }
  await batch.commit();
  console.log('Batch commit finished!');
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
