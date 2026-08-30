import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { calculatePricing } from './lib/pricing-engine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

async function run() {
  const db = admin.firestore();
  const productsSnap = await db.collection('products').get();
  const addonsSnap = await db.collection('addons').get();
  const settingsSnap = await db.collection('settings').doc('app_config').get();

  const products = productsSnap.docs.map(d => {
    const data = d.data();
    if (!Array.isArray(data.technologies)) {
      data.technologies = data.technology ? [data.technology] : ["Common"];
    }
    return { id: d.id, ...data };
  });

  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const settings = settingsSnap.data();

  const selection = {
    plan_type: "premium",
    technology: "HD",
    camera_count: 10,
    recording_days: 30,
    picture_quality: "very_clear",
    resolution_preference: "5MP"
  };

  const pricing = calculatePricing({
    selection: selection,
    products: products,
    addons: addons,
    settings: settings,
    cablingDone: false
  });

  console.log("Total:", pricing.total_payable);
  console.log("Items:");
  console.dir(pricing.items, { depth: null });
}

run().catch(console.error);
