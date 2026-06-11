import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function run() {
  const snapshot = await db.collection('products').where('is_active', '==', true).get();
  
  const cameras = [];
  const recorders = [];
  const techCounts = {};
  const categoryCounts = {};
  
  snapshot.docs.forEach(doc => {
    const d = doc.data();
    const cat = d.category || 'unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    
    const techs = d.technologies || d.technology || 'MISSING';
    const techStr = Array.isArray(techs) ? techs.join(', ') : String(techs);
    techCounts[techStr] = (techCounts[techStr] || 0) + 1;
    
    if (cat === 'cctv_camera') {
      cameras.push({ id: doc.id, name: d.display_name, tech: techStr, unit_price: d.unit_price });
    }
    if (cat === 'recorder') {
      recorders.push({ id: doc.id, name: d.display_name, tech: techStr, channels: d.channels || d.max_cameras, unit_price: d.unit_price });
    }
  });
  
  console.log('\n=== CATEGORY DISTRIBUTION ===');
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
  
  console.log('\n=== TECHNOLOGY DISTRIBUTION ===');
  Object.entries(techCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  "${k}": ${v}`));
  
  console.log(`\n=== CAMERAS (${cameras.length}) ===`);
  cameras.slice(0, 10).forEach(c => console.log(`  [${c.tech}] ${c.name} — ₹${c.unit_price}`));
  if (cameras.length > 10) console.log(`  ... and ${cameras.length - 10} more`);
  
  console.log(`\n=== RECORDERS (${recorders.length}) ===`);
  recorders.slice(0, 10).forEach(r => console.log(`  [${r.tech}] ${r.name} — ${r.channels}ch — ₹${r.unit_price}`));
  
  // Check how many cameras would match the pricing engine filter
  const ipCams = cameras.filter(c => c.tech.includes('IP'));
  const hdCams = cameras.filter(c => c.tech.includes('HD'));
  console.log(`\n=== PRICING ENGINE MATCH ===`);
  console.log(`  Cameras matching tech="IP": ${ipCams.length}`);
  console.log(`  Cameras matching tech="HD": ${hdCams.length}`);
  
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
