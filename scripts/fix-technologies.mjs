/**
 * One-time migration script to fix technologies in Firestore.
 * Run with: node scripts/fix-technologies.mjs
 */
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
  console.log(`Found ${snapshot.size} products.`);

  let techFixed = 0;
  let deletedFieldFixed = 0;

  const BATCH_SIZE = 400;
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + BATCH_SIZE);
    let batchHasWrites = false;

    for (const doc of chunk) {
      const data = doc.data();
      const updates = {};

      // Fix 1: Replace "Analog" with "HD" in technologies array
      if (Array.isArray(data.technologies)) {
        const hasAnalog = data.technologies.includes('Analog');
        if (hasAnalog) {
          const fixed = data.technologies.map(t => t === 'Analog' ? 'HD' : t);
          updates.technologies = [...new Set(fixed)];
          techFixed++;
          console.log(`  [FIX] ${doc.id}: ${data.display_name} — Analog → HD`);
        }
      }

      // Fix 2: Add is_deleted: false if field is missing
      if (data.is_deleted === undefined || data.is_deleted === null) {
        updates.is_deleted = false;
        deletedFieldFixed++;
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
  console.log(`   Technologies fixed (Analog → HD): ${techFixed}`);
  console.log(`   Missing is_deleted field added: ${deletedFieldFixed}`);
  console.log(`   Total documents scanned: ${docs.length}`);
  
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
