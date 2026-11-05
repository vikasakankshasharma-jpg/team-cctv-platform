import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { calculatePricing } from '../lib/pricing-engine';
import type { ConfiguratorSelection, Product, Addon, AppSettings } from '../types';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function runTest() {
  console.log('========================================================================');
  console.log('🧪 CUSTOMER QUOTATION TEST: 2-CORE ELECTRICAL WIRE VERIFICATION');
  console.log('========================================================================\n');

  const [productsSnap, addonsSnap, settingsDoc] = await Promise.all([
    db.collection('products').where('is_active', '==', true).get(),
    db.collection('addons').where('is_active', '==', true).get(),
    db.collection('settings').doc('pricing').get()
  ]);

  const products: Product[] = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  const addons: Addon[] = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Addon));
  const settings: AppSettings = (settingsDoc.data() || {}) as AppSettings;

  console.log(`📦 Loaded ${products.length} products, ${addons.length} addons from Firestore.`);

  // 1. Inspect Electrical Wire product in catalog
  const elecDoc = products.find(p => p.id === 'CAB-ELEC-2CORE-PU');
  console.log('\n--- Catalog Inspection: CAB-ELEC-2CORE-PU ---');
  if (elecDoc) {
    console.log(`  SKU: ${elecDoc.sku}`);
    console.log(`  Name: ${elecDoc.display_name}`);
    console.log(`  Unit Price (Firestore): ₹${elecDoc.unit_price}`);
    console.log(`  Base Cost (Firestore): ₹${elecDoc.base_cost}`);
    console.log(`  Per Meter Cost (Firestore): ₹${elecDoc.per_meter_cost}`);
    console.log(`  Cable Length (m): ${elecDoc.cable_length_m}`);
  } else {
    console.log('  ⚠️ CAB-ELEC-2CORE-PU NOT FOUND in active products!');
  }

  // TEST CASE 1: 2 Wireless Wi-Fi Cameras with 2-Core Electrical Wire (Open Wiring, 15m/cam = 30m total)
  console.log('\n========================================================================');
  console.log('TEST 1: 2 Wireless Wi-Fi Cameras + 30m 2-Core Electrical Wire (Open)');
  console.log('========================================================================');

  const sel1: ConfiguratorSelection = {
    camera_count: 2,
    picture_quality: 'good',
    recording_days: 7,
    technology: 'Wireless',
    plan_type: 'recommended',
    power_wiring_option: 'wire_needed',
    power_cable_meters: 15, // 15m per camera -> 30m total
    wiring_type: 'open',
    selected_addons: []
  };

  const quote1 = calculatePricing({
    selection: sel1,
    products,
    addons,
    settings,
    cablingDone: false
  });

  console.log(`Total Payable: ₹${quote1.total_payable.toLocaleString('en-IN')}`);
  console.log(`Hardware Total: ₹${quote1.hardware_total?.toLocaleString('en-IN')}`);
  console.log(`Installation Total: ₹${quote1.installation_total?.toLocaleString('en-IN')}`);
  console.log('\nLine Items:');
  for (const item of quote1.items) {
    console.log(`  • ${item.display_name}`);
    console.log(`    Qty: ${item.qty} | Rate: ₹${item.unit_price} | Line Total: ₹${item.line_total.toLocaleString('en-IN')}`);
  }

  // TEST CASE 2: 2 Wireless Wi-Fi Cameras + 30m 2-Core Electrical Wire (PVC Conduit)
  console.log('\n========================================================================');
  console.log('TEST 2: 2 Wireless Wi-Fi Cameras + 30m 2-Core Electrical Wire (PVC Conduit)');
  console.log('========================================================================');

  const sel2: ConfiguratorSelection = {
    ...sel1,
    wiring_type: 'conduit'
  };

  const quote2 = calculatePricing({
    selection: sel2,
    products,
    addons,
    settings,
    cablingDone: false
  });

  console.log(`Total Payable: ₹${quote2.total_payable.toLocaleString('en-IN')}`);
  console.log('\nLine Items:');
  for (const item of quote2.items) {
    console.log(`  • ${item.display_name}`);
    console.log(`    Qty: ${item.qty} | Rate: ₹${item.unit_price} | Line Total: ₹${item.line_total.toLocaleString('en-IN')}`);
  }

  // TEST CASE 3: 2 Wireless Wi-Fi Cameras with "Socket Available" (0 Wire Control)
  console.log('\n========================================================================');
  console.log('TEST 3: 2 Wireless Wi-Fi Cameras with "Socket Available" (Control Test)');
  console.log('========================================================================');

  const sel3: ConfiguratorSelection = {
    camera_count: 2,
    picture_quality: 'good',
    recording_days: 7,
    technology: 'Wireless',
    plan_type: 'recommended',
    power_wiring_option: 'socket_available',
    power_cable_meters: 0,
    wiring_type: 'open',
    selected_addons: []
  };

  const quote3 = calculatePricing({
    selection: sel3,
    products,
    addons,
    settings,
    cablingDone: false
  });

  console.log(`Total Payable: ₹${quote3.total_payable.toLocaleString('en-IN')}`);
  console.log('\nLine Items:');
  for (const item of quote3.items) {
    console.log(`  • ${item.display_name}`);
    console.log(`    Qty: ${item.qty} | Rate: ₹${item.unit_price} | Line Total: ₹${item.line_total.toLocaleString('en-IN')}`);
  }

  // Summary Comparison
  console.log('\n========================================================================');
  console.log('📊 COMPARISON SUMMARY:');
  console.log('========================================================================');
  console.log(`1. Wireless with Socket Available (0m wire): ₹${quote3.total_payable.toLocaleString('en-IN')}`);
  console.log(`2. Wireless with 30m Electrical Wire (Open): ₹${quote1.total_payable.toLocaleString('en-IN')} (Diff: +₹${(quote1.total_payable - quote3.total_payable).toLocaleString('en-IN')})`);
  console.log(`3. Wireless with 30m Electrical Wire (Conduit): ₹${quote2.total_payable.toLocaleString('en-IN')} (Diff: +₹${(quote2.total_payable - quote3.total_payable).toLocaleString('en-IN')})`);

  const elecItem1 = quote1.items.find(i => i.display_name.includes('Electrical Power Wire'));
  const elecItem2 = quote2.items.find(i => i.display_name.includes('Electrical Power Wire'));

  console.log('\n🔍 Electrical Wire Rate Audit:');
  if (elecItem1) {
    console.log(`  Open Wiring Rate: ₹${elecItem1.unit_price}/m | Total for 30m: ₹${elecItem1.line_total}`);
  }
  if (elecItem2) {
    console.log(`  Conduit Wiring Rate: ₹${elecItem2.unit_price}/m | Total for 30m: ₹${elecItem2.line_total}`);
  }
}

runTest().catch(console.error);
