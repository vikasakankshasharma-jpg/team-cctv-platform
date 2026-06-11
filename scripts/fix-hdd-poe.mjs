import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function run() {
  // Fix HDDs that were categorized as "accessories" — they should be "storage"
  const hddIds = ['hdd_1tb_wd_purple', 'hdd_2tb_wd_purple', 'hdd_4tb_seagate_skyhawk', 'hdd_6tb_seagate_skyhawk'];
  
  // Fix PoE switches that were categorized as "accessories" — they should be "power_device"
  const poeIds = ['poe_4port_cpplus', 'poe_8port_cpplus', 'poe_16port_cpplus'];
  
  // Fix SMPS that were categorized as "accessories" — they should be "power_device"
  const smpsIds = ['psu_4ch_smps', 'psu_8ch_smps', 'psu_16ch_smps'];

  const batch = db.batch();
  let count = 0;
  
  for (const id of hddIds) {
    const ref = db.collection('products').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      batch.update(ref, { category: 'storage', updated_at: new Date().toISOString() });
      console.log(`  [FIX] ${id}: accessories → storage`);
      count++;
    }
  }
  
  for (const id of [...poeIds, ...smpsIds]) {
    const ref = db.collection('products').doc(id);
    const snap = await ref.get();
    if (snap.exists) {
      batch.update(ref, { category: 'power_device', updated_at: new Date().toISOString() });
      console.log(`  [FIX] ${id}: accessories → power_device`);
      count++;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`\n✅ Fixed ${count} products.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
