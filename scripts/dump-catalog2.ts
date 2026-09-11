import { adminDb } from "../lib/firebase-admin";
import * as fs from "fs";

async function dumpCatalog() {
  const productsSnap = await adminDb.collection('products').get();
  const addonsSnap = await adminDb.collection('addons').get();
  
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  fs.writeFileSync('catalog_dump.json', JSON.stringify({ products, addons }, null, 2));
  console.log(`Dumped ${products.length} products and ${addons.length} addons.`);
}

dumpCatalog().catch(console.error);
