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
  const snap = await db.collection('products').where('category', '==', 'cctv_camera').get();
  console.log(`Analyzing specifications of ${snap.docs.length} CCTV cameras in Firestore:\n`);

  snap.docs.forEach(d => {
    const p = d.data();
    console.log({
      id: d.id,
      brand: p.brand,
      display_name: p.display_name,
      ip_rating: p.ip_rating,
      form_factor: p.form_factor,
      body_material: p.body_material,
      resolution_mp: p.resolution_mp,
      resolution: p.resolution,
      night_vision_type: p.night_vision_type,
      has_audio: p.has_audio,
      has_speaker: p.has_speaker,
      has_wifi: p.has_wifi,
      has_4g: p.has_4g,
      is_pt: p.is_pt,
      specifications: p.specifications
    });
  });

  process.exit(0);
}

run().catch(console.error);
