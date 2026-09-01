const fs = require('fs');
const dotenv = require('dotenv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const env = dotenv.parse(fs.readFileSync('.env.test.firebase3', 'utf8'));

let formattedKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

console.log('Project ID:', env.FIREBASE_PROJECT_ID);
console.log('Email:', env.FIREBASE_CLIENT_EMAIL);
console.log('Key length:', formattedKey.length);
console.log('Key first 30:', formattedKey.substring(0, 30));

try {
  initializeApp({ 
    credential: cert({ 
      projectId: env.FIREBASE_PROJECT_ID, 
      clientEmail: env.FIREBASE_CLIENT_EMAIL, 
      privateKey: formattedKey 
    })
  });
  const db = getFirestore();
  db.collection('leads').limit(1).get().then(snap => {
    console.log('SUCCESS! Found docs:', snap.size);
    process.exit(0);
  }).catch(e => {
    console.log('FIRESTORE ERROR:', e.message);
    process.exit(1);
  });
} catch(e) {
  console.log('INIT ERROR:', e.message);
  process.exit(1);
}
