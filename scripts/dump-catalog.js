const admin = require('firebase-admin');
const fs = require('fs');

if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json'); // assuming it exists or use default
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function dumpCatalog() {
  const productsSnap = await db.collection('products').get();
  const addonsSnap = await db.collection('addons').get();
  
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  fs.writeFileSync('catalog_dump.json', JSON.stringify({ products, addons }, null, 2));
  console.log(`Dumped ${products.length} products and ${addons.length} addons.`);
}

dumpCatalog().catch(console.error);
