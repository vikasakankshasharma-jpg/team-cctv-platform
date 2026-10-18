import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function run() {
  console.log('Auditing product specifications in Firestore...');
  const snap = await db.collection('products').get();
  console.log(`Total products in catalog: ${snap.docs.length}`);

  const updates: Record<string, any> = {};

  snap.docs.forEach(doc => {
    const p = doc.data();
    const id = doc.id;
    const cat = p.category;

    if (cat === 'cctv_camera') {
      const form = (p.form_factor || '').toLowerCase();
      const ip = (p.ip_rating || '').toUpperCase();
      const name = (p.display_name || '').toLowerCase();
      const tech = (p.technology || '').toLowerCase();

      let neededIp = p.ip_rating;
      let neededForm = p.form_factor;
      let neededBody = p.body_material;

      // 1. IP Rating specification audit
      if (!neededIp) {
        if (form === 'indoor_pt' || form === 'indoor' || form === 'dome' || name.includes('indoor') || name.includes('dome')) {
          neededIp = 'Indoor';
        } else if (form === 'bullet' || form === 'outdoor_pt' || form === 'ptz' || name.includes('bullet') || name.includes('outdoor')) {
          neededIp = 'IP66';
        }
      }

      // 2. Form factor specification audit
      if (!neededForm) {
        if (name.includes('bullet')) neededForm = 'bullet';
        else if (name.includes('dome')) neededForm = 'dome';
        else if (name.includes('ptz')) neededForm = 'ptz';
        else if (name.includes('pt')) neededForm = neededIp === 'Indoor' ? 'indoor_pt' : 'outdoor_pt';
      }

      // 3. Body Material specification audit
      if (!neededBody) {
        if (neededIp === 'Indoor' || form === 'indoor_pt') {
          neededBody = 'plastic';
        } else {
          neededBody = 'metal';
        }
      }

      // 4. Resolution specification audit
      let resMp = p.resolution_mp;
      if (!resMp) {
        const m = name.match(/(\d+)mp/i);
        if (m) resMp = parseInt(m[1], 10);
      }

      // Check if update is needed
      const itemUpdate: any = {};
      if (neededIp && p.ip_rating !== neededIp) itemUpdate.ip_rating = neededIp;
      if (neededForm && p.form_factor !== neededForm) itemUpdate.form_factor = neededForm;
      if (neededBody && p.body_material !== neededBody) itemUpdate.body_material = neededBody;
      if (resMp && p.resolution_mp !== resMp) itemUpdate.resolution_mp = resMp;

      if (Object.keys(itemUpdate).length > 0) {
        updates[id] = itemUpdate;
      }
    } else if (cat === 'recorder') {
      const name = (p.display_name || '').toLowerCase();
      const tech = (p.technology || (p.technologies && p.technologies[0]) || '').toLowerCase();
      
      const itemUpdate: any = {};
      
      // 1. Recorder Type (DVR vs NVR)
      if (!p.recorder_type) {
        if (tech.includes('ip') || name.includes('nvr')) {
          itemUpdate.recorder_type = 'NVR';
        } else {
          itemUpdate.recorder_type = 'DVR';
        }
      }
      
      // 2. Max Supported MP
      if (!p.max_supported_mp) {
        if (itemUpdate.recorder_type === 'NVR' || p.recorder_type === 'NVR' || tech.includes('ip') || name.includes('nvr')) {
          itemUpdate.max_supported_mp = 8;
        } else if (name.includes('5mp')) {
          itemUpdate.max_supported_mp = 5;
        } else {
          itemUpdate.max_supported_mp = 2;
        }
      }
      
      // 3. Channel count
      if (!p.channels && p.max_cameras) {
        itemUpdate.channels = p.max_cameras;
      }

      if (Object.keys(itemUpdate).length > 0) {
        updates[id] = itemUpdate;
      }
    }
  });

  console.log(`\nProducts needing specification sync: ${Object.keys(updates).length}`);
  for (const [id, fields] of Object.entries(updates)) {
    console.log(` - [${id}] updates:`, fields);
  }

  if (Object.keys(updates).length > 0) {
    const batch = db.batch();
    for (const [id, fields] of Object.entries(updates)) {
      batch.update(db.collection('products').doc(id), fields);
    }
    await batch.commit();
    console.log(`\n✅ Successfully synced specifications for ${Object.keys(updates).length} products in Firestore!`);
  } else {
    console.log('\nAll product specifications are already in sync!');
  }

  process.exit(0);
}

run().catch(console.error);
