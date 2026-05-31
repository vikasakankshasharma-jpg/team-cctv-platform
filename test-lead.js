const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

const projectId = env['FIREBASE_PROJECT_ID'];
const clientEmail = env['FIREBASE_CLIENT_EMAIL'];
const privateKey = env['FIREBASE_PRIVATE_KEY'] ? env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n') : '';
const storageBucket = env['FIREBASE_STORAGE_BUCKET'];

console.log('Project ID:', projectId);
console.log('Client Email:', clientEmail);

initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
  storageBucket
});

const db = getFirestore();

async function run() {
  try {
    const leadId = 'hkq0Q9uPR0NtchfibYCd';
    const doc = await db.collection('leads').doc(leadId).get();
    if (!doc.exists) {
      console.log(`❌ Lead ${leadId} does NOT exist in Firestore!`);
    } else {
      console.log(`✅ Lead ${leadId} exists!`);
      console.log('Data:', JSON.stringify(doc.data(), null, 2));
    }
  } catch (e) {
    console.error('Error querying Firestore:', e);
  }
}

run();
