import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = getFirestore();

async function check() {
  const cams = await db.collection("products").where("category", "in", ["CAMERA_HD", "CAMERA_IP", "cctv_camera"]).limit(5).get();
  for (const c of cams.docs) {
     console.log(c.id, "--> tech:", c.data().technology, "type:", c.data().type, "cat:", c.data().category);
  }
}
check();
