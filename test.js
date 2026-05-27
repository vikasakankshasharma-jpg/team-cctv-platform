const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
async function run() {
  try {
    const snap = await db.collection('products').where('is_active', '==', true).where('is_deleted', '==', false).get();
    console.log('Products count:', snap.size);
  } catch (e) {
    console.log('Error:', e.message);
  }
}
run();
