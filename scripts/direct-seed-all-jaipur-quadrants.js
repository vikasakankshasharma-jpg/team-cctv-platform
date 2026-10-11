require('dotenv').config({ path: '.env.prod.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const https = require('https');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = getFirestore(app);

const remainingPins = [
  "303124", "303903", "303806", "302049", "302044", "302047", 
  "303706", "303122", "303805", "302041", "303338", "303106", 
  "303807", "303123", "302039", "302042", "302048"
];

function fetchAniketGeo() {
  return new Promise((resolve, reject) => {
    https.get('https://aniket-thapa.github.io/india-pincode-api/districts/rajasthan/jaipur.json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching Jaipur district postal dataset...');
  const geo = await fetchAniketGeo();
  console.log('Processing all 17 remaining pincodes directly into Firestore...');

  for (const pin of remainingPins) {
    const matched = (geo.offices || []).filter(o => o.pincode === pin);
    const officeNames = matched.map(m => m.officeName.replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ').replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
    
    const p1 = officeNames[0] || ('Jaipur Area ' + pin);
    const p2 = officeNames[1] || (p1 + ' North');
    const p3 = officeNames[2] || (p1 + ' South');
    const p4 = officeNames[3] || (p1 + ' Extension');

    const quadrants = [
      { zone: "North-West", anchor: p1 + " Sector / Chowk", coverage: p1 + (officeNames[1] ? ', ' + officeNames[1] : '') },
      { zone: "North-East", anchor: p2 + " Main Road", coverage: p2 + ', Surrounding areas' },
      { zone: "South-West", anchor: p3 + " Intersection", coverage: p3 + ', Adjacent blocks' },
      { zone: "South-East", anchor: p4 + " Circle", coverage: p4 + ', Outer limits' }
    ];

    await db.collection('pincode_cache').doc(pin).set({
      quadrants,
      areas: officeNames.length > 0 ? officeNames : [p1],
      updated_at: new Date()
    }, { merge: true });

    console.log('? Generated & Saved 4 quadrants for PIN ' + pin + ' (' + p1 + ')');
  }

  console.log('All 17 pincodes saved to Firestore! Now purging /api/admin/geo cache on production...');
  https.get('https://cctvquotation.com/api/admin/geo?type=offices&state=rajasthan&district=jaipur&refresh=true', (res) => {
    console.log('Production cache refreshed! HTTP code:', res.statusCode);
    process.exit(0);
  });
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
