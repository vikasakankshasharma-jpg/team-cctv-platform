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

async function run() {
  const snapshot = await db.collection('products').get();
  console.log(`Total products in Firestore: ${snapshot.docs.length}`);
  
  const allProds = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  const wifi4gPtPtz = allProds.filter(p => {
    const text = (
      (p.display_name || '') + ' ' + 
      (p.technical_name || '') + ' ' + 
      (p.category || '') + ' ' + 
      (p.sub_category || '') + ' ' + 
      ((p.technologies || []).join(' ')) + ' ' +
      (p.form_factor || '') + ' ' +
      (p.smart_features ? p.smart_features.join(' ') : '')
    ).toLowerCase();
    
    return text.includes('wifi') || 
           text.includes('wi-fi') || 
           text.includes('wireless') || 
           text.includes('4g') || 
           text.includes('ptz') || 
           text.includes('pan-tilt') ||
           text.includes('pt ') ||
           p.form_factor === 'pt' ||
           p.form_factor === 'ptz' ||
           (p.technologies && (p.technologies.includes('Wireless') || p.technologies.includes('4G')));
  });

  console.log(`Total Wi-Fi / 4G / PT / PTZ products in Firestore: ${wifi4gPtPtz.length}\n`);
  wifi4gPtPtz.forEach(p => {
    console.log(`[${p.id}] ${p.display_name} | Cat: ${p.category} | Form: ${p.form_factor} | Tech: ${(p.technologies || []).join(', ')} | Brand: ${p.brand} | Cost: ₹${p.base_cost} | Price: ₹${p.unit_price}`);
  });
}

run().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
