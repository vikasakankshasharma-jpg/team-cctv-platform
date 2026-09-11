const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function main() {
  const snap = await db.collection('products').where('is_active', '==', true).get();
  const p = snap.docs.map(d => ({id: d.id, ...d.data()}));
  const power = p.filter((x) => x.category === 'power_device' || x.category === 'power' || String(x.display_name).toLowerCase().includes('power') || String(x.display_name).toLowerCase().includes('psu') || String(x.display_name).toLowerCase().includes('poe'));
  console.log('Power Devices:', power.length);
  power.forEach((d) => console.log(d.id, 'cat:', d.category, 'name:', d.display_name, 'tech:', d.technology, d.technologies, 'max:', d.max_cameras, 'ports:', d.ports));
}
main().then(()=>process.exit(0));
