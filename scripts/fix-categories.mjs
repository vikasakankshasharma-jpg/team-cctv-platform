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
  console.log('Fetching all products...');
  const snapshot = await db.collection('products').get();
  console.log(`Found ${snapshot.size} products.\n`);

  let categoryFixed = 0;
  let channelsFixed = 0;

  const BATCH_SIZE = 400;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    let batchHasWrites = false;

    for (const doc of chunk) {
      const data = doc.data();
      const updates = {};

      // Fix 1: Normalize "camera" -> "cctv_camera" and "accessory" -> "accessories"
      if (data.category === 'camera') {
        updates.category = 'cctv_camera';
        categoryFixed++;
        console.log(`  [CATEGORY] ${doc.id}: "${data.display_name}" — camera → cctv_camera`);
      }
      if (data.category === 'accessory') {
        updates.category = 'accessories';
        categoryFixed++;
        console.log(`  [CATEGORY] ${doc.id}: "${data.display_name}" — accessory → accessories`);
      }

      // Fix 2: Parse channels from recorder display names if missing
      if ((data.category === 'recorder') && !data.channels && !data.max_cameras) {
        const name = (data.display_name || '').toLowerCase() + ' ' + (data.technical_name || '').toLowerCase();
        const match = name.match(/(\d+)\s*(?:ch|channel)/);
        if (match) {
          const ch = parseInt(match[1]);
          updates.channels = ch;
          updates.max_cameras = ch;
          channelsFixed++;
          console.log(`  [CHANNELS] ${doc.id}: "${data.display_name}" — extracted ${ch}ch`);
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        batch.update(doc.ref, updates);
        batchHasWrites = true;
      }
    }

    if (batchHasWrites) {
      await batch.commit();
      console.log(`  Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
    }
  }

  console.log('\n✅ Migration complete!');
  console.log(`   Categories normalized: ${categoryFixed}`);
  console.log(`   Recorder channels parsed: ${channelsFixed}`);
  console.log(`   Total documents scanned: ${docs.length}`);

  process.exit(0);
}

run().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
