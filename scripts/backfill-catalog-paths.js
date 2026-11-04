const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
} else {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

const db = admin.firestore();

function deriveCatalogPath(p) {
  if (p.catalog_path) return p.catalog_path;
  const t = (p.technology || (p.technologies && p.technologies[0]) || '').toLowerCase();
  const name = (p.display_name || p.technical_name || '').toLowerCase();
  const cat = p.category;

  if (cat === 'cctv_camera') {
    if (t === 'wireless' || t === 'wifi' || p.has_wifi || p.has_4g_sim) return 'cctv_camera/wifi/WiFi Camera';
    if (t === 'ip') return 'cctv_camera/ip/IP Camera';
    return 'cctv_camera/hd/HD Camera';
  }
  if (cat === 'recorder') {
    if (t === 'ip' || name.includes('nvr')) return 'recorder/ip/IP NVR';
    return 'recorder/hd/HD DVR';
  }
  if (cat === 'storage') {
    if (t === 'wireless' || (p.storage_type && p.storage_type.toLowerCase().includes('micro')) || name.includes('microsd') || name.includes('sd card')) {
      return 'storage/microsd/MicroSD Card';
    }
    return 'storage/hdd/Surveillance HDD';
  }
  if (cat === 'power_device') {
    if (name.includes('poe')) return 'power_device/poe/PoE Switch';
    if (name.includes('gigabit') || name.includes('switch')) return 'power_device/network/Network Switch';
    return 'power_device/smps/SMPS Power Supply';
  }
  if (cat === 'cable') {
    if (name.includes('cat6') || name.includes('lan') || name.includes('ethernet') || t === 'ip') return 'cable/cat6/CAT6 Network Cable';
    return 'cable/coaxial/3+1 Coaxial Cable';
  }
  if (cat === 'connector') {
    if (name.includes('bnc')) return 'connector/bnc/BNC Video Connector';
    if (name.includes('dc')) return 'connector/dc/DC Power Connector';
    if (name.includes('rj45')) return 'connector/rj45/RJ45 Connector';
    return 'connector/accessories/Connectors and Pins';
  }
  if (cat === 'rack') return 'rack/cctv_rack/Wall-Mount CCTV Rack';
  if (cat === 'hdmi_cable') return 'hdmi_cable/display/HDMI Display Cable';
  if (cat === 'network') {
    if (name.includes('4g') || name.includes('sim') || name.includes('router')) return 'network/router/4G Wireless Router';
    return 'network/general/Network Devices';
  }
  if (cat === 'accessories') {
    if (name.includes('junction') || name.includes('box')) return 'accessories/junction/Waterproof Junction Box';
    return 'accessories/general/Installation Accessories';
  }
  if (cat === 'display') return 'display/monitor/Surveillance Monitor';
  return 'general/accessories/General';
}

async function backfillCatalogPaths() {
  console.log('Backfilling catalog_path across all products in Firestore...');
  const snap = await db.collection('products').get();
  const batch = db.batch();
  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const desiredPath = deriveCatalogPath(data);
    if (data.catalog_path !== desiredPath) {
      batch.update(doc.ref, { catalog_path: desiredPath, updated_at: admin.firestore.FieldValue.serverTimestamp() });
      count++;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`Successfully backfilled catalog_path on ${count} products.`);
  } else {
    console.log('All products already have correct catalog_path.');
  }

  process.exit(0);
}

backfillCatalogPaths().catch(err => {
  console.error(err);
  process.exit(1);
});
