const admin = require('firebase-admin');
const fs = require('fs');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
admin.initializeApp({ projectId: 'demo-secure-easy' });

// Connect to Firestore (will use emulator if FIRESTORE_EMULATOR_HOST is set via env or playwright)
const db = admin.firestore();

async function seed() {
  const data = JSON.parse(fs.readFileSync('./scripts/pricing-master-seed.json', 'utf8'));
  
  // Firestore batch limit is 500 ops. We have ~60 products x 2 (product + inventory) = ~120 ops. Safe.
  const batch = db.batch();
  let count = 0;
  
  for (const item of data) {
    const ref = db.collection('products').doc(item.skuId);
    batch.set(ref, {
      ...item,
      id: item.skuId,
      // Ensure all required Product type fields are present
      unit_price: item.baseCost || 0, // Default selling price = cost (admin will set proper margins)
      base_cost: item.baseCost || 0,
    });
    
    // Also seed inventory document
    const invRef = db.collection('inventory').doc(item.skuId);
    batch.set(invRef, {
      skuId: item.skuId,
      availableQty: (item.stock_status === 'in_stock') ? 100 : 0,
      reservedQty: 0,
      costPrice: item.baseCost || 0,
    });
    
    count++;
  }
  
  await batch.commit();
  console.log(`Successfully seeded ${count} products + ${count} inventory items = ${count * 2} documents.`);
}

module.exports = { seed };

// Run directly if called from CLI
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seed failed:', err.message);
      process.exit(1);
    });
}
