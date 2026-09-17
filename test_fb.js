const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function getQuote() {
  const snapshot = await db.collection('leads').limit(5).get();
  for (const doc of snapshot.docs) {
    const qSnap = await db.collection('leads').doc(doc.id).collection('quotes').limit(1).get();
    if (!qSnap.empty) {
      console.log('Lead ID:', doc.id);
      console.log('Quote ID:', qSnap.docs[0].id);
      return;
    }
  }
}

getQuote().catch(console.error);
