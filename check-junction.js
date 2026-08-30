require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
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
db.collection('products').where('category', '==', 'accessories').get().then(snap => {
  console.log('Accessories in products:');
  snap.forEach(d => console.log(' ', d.id, d.data().display_name, 'Cost:', d.data().base_cost, 'Price:', d.data().unit_price));
});
db.collection('addons').get().then(snap => {
  console.log('Addons:');
  snap.forEach(d => console.log(' ', d.id, d.data().display_name, 'Price:', d.data().price || d.data().unit_price));
});
