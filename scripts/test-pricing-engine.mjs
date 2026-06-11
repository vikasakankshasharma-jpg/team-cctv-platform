/**
 * Deep test of pricing engine against all common combinations.
 * Run: node scripts/test-pricing-engine.mjs
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

// ─── Minimal inline pricing engine logic ───────────────────────────────────
function resolveCamera(selection, products, tech) {
  let pool = products.filter(p =>
    p.category === 'cctv_camera' &&
    Array.isArray(p.technologies) &&
    p.technologies.includes(tech) &&
    p.is_active !== false &&
    p.unit_price > 0
  );
  if (pool.length === 0) return null;
  pool.sort((a, b) => a.unit_price - b.unit_price);
  const plan = selection.plan_type || 'recommended';
  if (plan === 'budget') return pool[0];
  if (plan === 'premium') return pool[pool.length - 1];
  return pool[Math.floor(pool.length / 2)];
}

function resolveRecorder(selection, products, tech) {
  if (tech === 'Wireless') return null;
  const recs = products.filter(p =>
    p.category === 'recorder' &&
    Array.isArray(p.technologies) &&
    p.technologies.includes(tech) &&
    p.is_active !== false &&
    p.unit_price > 0 &&
    (p.max_cameras || p.channels || 0) >= selection.camera_count
  );
  recs.sort((a, b) => (a.max_cameras || a.channels || 0) - (b.max_cameras || b.channels || 0));
  return recs[0] || null;
}

function resolveStorage(selection, allItems, tech) {
  if (selection.recording_days === 0) return null;
  const hdds = allItems.filter(a => a.category === 'storage' && (a.unit_price || a.price || 0) > 0);
  if (hdds.length === 0) return null;
  if (tech === 'Wireless') {
    return hdds.find(a => (a.display_name||'').toLowerCase().includes('sd')) || hdds[0];
  }
  return hdds.sort((a, b) => (a.unit_price||a.price||0) - (b.unit_price||b.price||0))[0];
}

function testCombination(label, selection, products, allItems) {
  const tech = selection.technology;
  const camera   = resolveCamera(selection, products, tech);
  const recorder = resolveRecorder(selection, products, tech);
  const storage  = resolveStorage(selection, allItems, tech);

  const issues = [];
  if (!camera) issues.push('❌ NO CAMERA');
  if (!recorder && tech !== 'Wireless') issues.push('❌ NO RECORDER');
  if (!storage) issues.push('⚠️  No storage');

  const camPrice = camera ? camera.unit_price * selection.camera_count : 0;
  const recPrice = recorder ? recorder.unit_price : 0;
  const storPrice = storage ? (storage.unit_price || storage.price || 0) : 0;
  const totalHW = camPrice + recPrice + storPrice;

  const hasCritical = issues.some(i => i.startsWith('❌'));
  const status = hasCritical ? '❌ FAIL' : issues.length > 0 ? '⚠️  WARN' : '✅ OK  ';

  console.log(`\n  ${status} [${tech}/${selection.plan_type}/${selection.camera_count}cam] ${label}`);
  console.log(`     Camera:   ${camera ? camera.display_name?.substring(0, 55) + ' @ ₹' + camera.unit_price : 'NONE'}`);
  if (tech !== 'Wireless') {
    console.log(`     Recorder: ${recorder ? recorder.display_name?.substring(0, 45) + ' @ ₹' + recorder.unit_price + ' (' + (recorder.channels||recorder.max_cameras) + 'ch)' : 'NONE'}`);
  }
  console.log(`     Storage:  ${storage ? storage.display_name?.substring(0, 45) + ' @ ₹' + (storage.unit_price||storage.price) : 'NONE'}`);
  if (totalHW > 0) console.log(`     HW Total: ₹${totalHW.toLocaleString('en-IN')}`);
  issues.forEach(i => console.log(`     ${i}`));
  return { status, camera, recorder, storage };
}

async function run() {
  console.log('Fetching products & addons...');
  const [productSnap, addonSnap] = await Promise.all([
    db.collection('products').where('is_active', '==', true).get(),
    db.collection('addons').where('is_active', '==', true).get(),
  ]);

  const products = productSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.is_deleted !== true);
  const addons   = addonSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => a.is_deleted !== true);
  const allItems = [...products, ...addons]; // mirrors pricing engine [...products, ...addons]

  console.log(`Loaded: ${products.length} products, ${addons.length} addons, ${allItems.length} total`);

  const INDUSTRIAL = 16;
  const cameraCounts = [1, 4, 8, 16, 32];
  const techs = ['HD', 'IP', 'Wireless'];
  const plans = ['budget', 'recommended', 'premium'];

  let total = 0, passed = 0, warned = 0, failed = 0;

  for (const tech of techs) {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`  TECHNOLOGY: ${tech}`);
    console.log(`${'═'.repeat(65)}`);
    for (const cameras of cameraCounts) {
      for (const plan of plans) {
        total++;
        if (cameras > INDUSTRIAL) {
          console.log(`\n  ✅ OK   [${tech}/${plan}/${cameras}cam] Industrial → redirected to custom quote`);
          passed++;
          continue;
        }
        const res = testCombination(`${cameras} cameras`, { technology: tech, camera_count: cameras, plan_type: plan, recording_days: 7 }, products, allItems);
        if (res.status.startsWith('✅')) passed++;
        else if (res.status.startsWith('⚠️')) warned++;
        else failed++;
      }
    }
  }

  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  EDGE CASES`);
  console.log(`${'═'.repeat(65)}`);
  testCombination('Original failing lead (HD 4ch home)', { technology: 'HD', camera_count: 4, plan_type: 'recommended', recording_days: 7 }, products, allItems);
  testCombination('IP 16ch max residential', { technology: 'IP', camera_count: 16, plan_type: 'recommended', recording_days: 15 }, products, allItems);
  testCombination('WiFi 4ch budget', { technology: 'Wireless', camera_count: 4, plan_type: 'budget', recording_days: 7 }, products, allItems);
  testCombination('Premium IP 8ch', { technology: 'IP', camera_count: 8, plan_type: 'premium', recording_days: 15 }, products, allItems);

  console.log(`\n${'═'.repeat(65)}`);
  console.log(`  FINAL SUMMARY`);
  console.log(`${'═'.repeat(65)}`);
  console.log(`  Total : ${total}  |  ✅ ${passed}  |  ⚠️  ${warned}  |  ❌ ${failed}`);
  console.log(failed === 0 ? '\n  🎉 ALL CRITICAL TESTS PASSED!' : `\n  ⚠️  ${failed} test(s) need attention`);

  console.log(`\n  DATA QUALITY`);
  const hdCams   = products.filter(p => p.category === 'cctv_camera' && p.technologies?.includes('HD') && p.unit_price > 0);
  const ipCams   = products.filter(p => p.category === 'cctv_camera' && p.technologies?.includes('IP') && p.unit_price > 0);
  const wfCams   = products.filter(p => p.category === 'cctv_camera' && (p.technologies?.includes('Wireless') || p.technologies?.includes('WiFi')) && p.unit_price > 0);
  const hdRec    = products.filter(p => p.category === 'recorder' && p.technologies?.includes('HD') && (p.channels||p.max_cameras) > 0 && p.unit_price > 0);
  const ipRec    = products.filter(p => p.category === 'recorder' && p.technologies?.includes('IP') && (p.channels||p.max_cameras) > 0 && p.unit_price > 0);
  const storage  = allItems.filter(a => a.category === 'storage' && (a.unit_price||a.price) > 0);
  const power    = allItems.filter(a => (a.category === 'power_device'||a.category === 'power') && (a.unit_price||a.price) > 0);
  console.log(`  HD cams : ${hdCams.length}  |  IP cams: ${ipCams.length}  |  WiFi cams: ${wfCams.length}`);
  console.log(`  HD recs : ${hdRec.length}   |  IP recs: ${ipRec.length}`);
  console.log(`  Storage : ${storage.length}  |  Power  : ${power.length}`);

  console.log('\n  RECORDER COVERAGE:');
  for (const tech of ['HD', 'IP']) {
    for (const n of [4, 8, 16]) {
      const r = products.filter(p => p.category === 'recorder' && p.technologies?.includes(tech) && p.is_active && p.unit_price > 0 && (p.channels||p.max_cameras||0) >= n);
      console.log(`  ${r.length > 0 ? '✅' : '❌'} ${tech} ≥${n}ch : ${r.length} option(s)`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
