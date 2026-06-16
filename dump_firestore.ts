import * as admin from 'firebase-admin';

// Initialize firebase admin
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (serviceAccountKey) {
  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  } catch (e) {
    console.error("Failed to parse service account key", e);
  }
}

async function run() {
  const db = admin.firestore();
  const snapshot = await db.collection('wizard_steps').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Step ID: ${data.id}`);
    data.options.forEach((opt: any) => {
      console.log(`  ${opt.id}: ${opt.label}`);
    });
  });
}

run().catch(console.error);
