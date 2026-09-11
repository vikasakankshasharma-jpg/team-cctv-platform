import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function cleanup() {
  const { adminDb } = await import('../lib/firebase-admin');

  console.log("Removing Hikvision and Dahua from products...");
  const productsRef = adminDb.collection('products');
  const hikSnap = await productsRef.where('brand', '==', 'Hikvision').get();
  const dahSnap = await productsRef.where('brand', '==', 'Dahua').get();
  
  let pCount = 0;
  const pBatch = adminDb.batch();
  hikSnap.forEach(doc => { pBatch.delete(doc.ref); pCount++; });
  dahSnap.forEach(doc => { pBatch.delete(doc.ref); pCount++; });
  
  if (pCount > 0) {
    await pBatch.commit();
    console.log(`Deleted ${pCount} dummy products.`);
  }

  console.log("Checking leads...");
  const leadsRef = adminDb.collection('leads');
  const leadsSnap = await leadsRef.get();
  let lCount = 0;
  const lBatch = adminDb.batch();
  
  leadsSnap.forEach(doc => {
    const data = doc.data();
    const name = (data.customer_name || '').toLowerCase();
    
    // We remove our mock leads but keep anything that might be their real testing
    if (
      name.includes('e2e test user') || 
      name.includes('demo customer') ||
      doc.id === 'mock-e2e-lead'
    ) {
      lBatch.delete(doc.ref);
      lCount++;
      console.log('Deleting lead:', doc.id, name);
    }
  });

  if (lCount > 0) {
    await lBatch.commit();
    console.log(`Deleted ${lCount} dummy leads.`);
  }
}
cleanup().catch(console.dir);
