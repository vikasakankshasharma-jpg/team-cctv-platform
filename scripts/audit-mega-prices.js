const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

const retail = JSON.parse(fs.readFileSync(path.join(__dirname, '../clean_retail_megacompu.json'), 'utf8'));

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

async function run() {
  const snap = await db.collection('products').get();
  console.log('Total products in firestore:', snap.size);
  
  const discrepancies = [];
  const matched = [];
  const notFound = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const pid = data.vendor_pid || data.pid || doc.id;
    // find in retail by PID or exact title or url or technical_name
    let match = retail.find(r => r.pid === pid || r.key === pid);
    if (!match && data.internal_sku) {
      match = retail.find(r => r.pid === data.internal_sku || r.key === data.internal_sku);
    }
    if (!match && data.sku) {
      match = retail.find(r => r.pid === data.sku || r.item_code === data.sku || r.title.toLowerCase().includes(data.sku.toLowerCase()));
    }
    if (!match && data.technical_name) {
      match = retail.find(r => r.title.toLowerCase().includes(data.technical_name.toLowerCase()) || (data.model && r.title.toLowerCase().includes(data.model.toLowerCase())));
    }
    if (!match && data.display_name) {
      const cleanName = data.display_name.toLowerCase().replace(/[^a-z0-9]/g, '');
      match = retail.find(r => r.title.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanName) || cleanName.includes(r.title.toLowerCase().replace(/[^a-z0-9]/g, '')));
    }

    if (match) {
      matched.push({ id: doc.id, name: data.display_name, fsPrice: data.unit_price, retailPrice: match.price, pid: match.pid, matchTitle: match.title });
      if (data.unit_price !== match.price) {
        discrepancies.push({ id: doc.id, name: data.display_name, fsPrice: data.unit_price, retailPrice: match.price, pid: match.pid, matchTitle: match.title });
      }
    } else {
      notFound.push({ id: doc.id, name: data.display_name, fsPrice: data.unit_price, category: data.category, brand: data.brand });
    }
  }

  console.log('Matched count:', matched.length);
  console.log('Discrepancies count:', discrepancies.length);
  console.log('Not found in retail count:', notFound.length);
  
  console.log('\n--- ALL DISCREPANCIES ---');
  discrepancies.forEach(d => {
    console.log(`${d.id} [PID: ${d.pid}]`);
    console.log(`  Firestore unit_price: ₹${d.fsPrice} vs Mega Compu: ₹${d.retailPrice}`);
    console.log(`  Title: ${d.name} <==> ${d.matchTitle}`);
  });

  console.log('\n--- NOT FOUND IN RETAIL ---');
  notFound.forEach(n => {
    console.log(`${n.id} | Cat: ${n.category} | Brand: ${n.brand} | ₹${n.fsPrice} | ${n.name}`);
  });
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
