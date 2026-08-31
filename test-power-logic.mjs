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
  const items = await db.collection("products").where("category", "==", "power_device").get();
  const powerItems = items.docs.map(d => ({id: d.id, ...d.data()}));
  
  const config = { technology: "IP", recorder_channels: 8, wired_cameras: 8 };
  
  let valid = powerItems.filter(p => {
      const matchTech = !p.technology || p.technology === config.technology;
      const matchCams = (p.max_cameras || 0) === config.recorder_channels;
      return matchTech && matchCams;
  });
  console.log("Strict match valid:", valid.map(p => p.id));

  if (valid.length === 0) {
      valid = powerItems.filter(p => {
          const matchTech = !p.technology || p.technology === config.technology;
          const matchCams = (p.max_cameras || 0) >= config.recorder_channels;
          return matchTech && matchCams;
      });
  }

  if (valid.length === 0) {
      valid = powerItems.filter(p => !p.technology || p.technology === config.technology);
  }
  
  if (valid.length === 0) valid = powerItems;

  const sorted = [...valid].sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0));
  
  const budget = sorted.find(p => p.brand?.toLowerCase() === 'budget') || sorted[0];
  const premium = sorted.filter(p => p.brand?.toLowerCase() !== 'budget').sort((a, b) => (b.unit_price || 0) - (a.unit_price || 0))[0] || sorted[sorted.length - 1];
  
  console.log("Budget:", budget.id);
  console.log("Premium:", premium.id);
}
check();
