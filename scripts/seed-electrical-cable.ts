import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function seed() {
  console.log('Seeding 2-core electrical power wire products...');

  const perMeterDoc = {
    id: 'CAB-ELEC-2CORE-PU',
    sku: 'CAB-ELEC-2CORE-PU',
    internal_sku: 'CAB-ELEC-2CORE-PU',
    display_name: '2-Core Copper Electrical Power Wire (Per Mtr)',
    technical_name: '2-Core Copper Flexible Wire 0.5 sq mm / 14-36 (Open)',
    brand: 'Standard Electrical',
    category: 'cable',
    subcategory: 'electrical_wire',
    catalog_path: 'Core CCTV Hardware > Cabling & Conduit > Electrical Wire',
    technologies: ['Wireless', 'WiFi', 'both', 'Common'],
    technology: 'Wireless',
    base_cost: 6,
    unit_price: 10,
    selling_price: 10,
    cable_length_m: 1,
    per_meter_cost: 6,
    description: 'High-grade 2-core copper electrical wire for powering Wi-Fi and 4G CCTV cameras from the nearest AC switchboard or junction box.',
    is_active: true,
    stock_status: 'in_stock',
    stock_quantity: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const rollDoc = {
    id: 'CAB-ELEC-2CORE-90M',
    sku: 'CAB-ELEC-2CORE-90M',
    internal_sku: 'CAB-ELEC-2CORE-90M',
    display_name: '2-Core Copper Electrical Power Wire - 90 MTR Roll',
    technical_name: '2-Core Copper Flexible Wire 0.5 sq mm 90m Coil',
    brand: 'Standard Electrical',
    category: 'cable',
    subcategory: 'electrical_wire',
    catalog_path: 'Core CCTV Hardware > Cabling & Conduit > Electrical Wire',
    technologies: ['Wireless', 'WiFi', 'both', 'Common'],
    technology: 'Wireless',
    base_cost: 450,
    unit_price: 750,
    selling_price: 750,
    cable_length_m: 90,
    per_meter_cost: 5,
    description: '90-meter coil of flexible 2-core copper wire for long-run wireless camera power distribution.',
    is_active: true,
    stock_status: 'in_stock',
    stock_quantity: 25,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await db.collection('products').doc(perMeterDoc.id).set(perMeterDoc, { merge: true });
  console.log(`✓ Added/Updated: ${perMeterDoc.id} (${perMeterDoc.display_name})`);

  await db.collection('products').doc(rollDoc.id).set(rollDoc, { merge: true });
  console.log(`✓ Added/Updated: ${rollDoc.id} (${rollDoc.display_name})`);

  console.log('✅ Electrical cables seeded successfully.');
}

seed().catch(console.error);
