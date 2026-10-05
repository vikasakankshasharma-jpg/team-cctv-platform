require('dotenv').config({ path: '.env.vercel.production' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1);
  }
  privateKey = privateKey.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.replace(/"/g, ''),
      privateKey: privateKey,
    }),
  });
}

const db = admin.firestore();

async function run() {
  const updates = [
    { id: 'HDD-BUD-1TB', cost: 5200 },
    { id: 'HDD-BUD-2TB', cost: 8000 },
    { id: 'HDD-BUD-4TB', cost: 15000 },
    { id: 'NVR-CPP-4CH', cost: 4700 },
    { id: 'NVR-CPP-8CH', cost: 5200 }
  ];

  for (const u of updates) {
    await db.collection('products').doc(u.id).update({
      base_cost: u.cost
    });
    console.log(Updated  to );
  }
  console.log('Done');
}
run();
