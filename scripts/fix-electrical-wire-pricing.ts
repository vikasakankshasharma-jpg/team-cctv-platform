import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

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

async function fix() {
  console.log('Synchronizing Electrical Wire Products in Firestore...');

  // 1. Correct Per-Meter Product (CAB-ELEC-2CORE-PU)
  const puDoc = {
    id: 'CAB-ELEC-2CORE-PU',
    sku: 'CAB-ELEC-2CORE-PU',
    internal_sku: 'CAB-ELEC-2CORE-PU',
    display_name: '2-Core Pure Copper Electrical Power Wire (Per Meter)',
    technical_name: '2-Core Copper Flexible Wire 0.5 sq mm (Open / Per Meter)',
    brand: 'Standard Electrical',
    category: 'cable',
    subcategory: 'electrical_wire',
    catalog_path: 'cable/electrical/Electrical Power Wire',
    technology: 'Common',
    technologies: ['Common', 'Wireless', 'HD', 'IP'],
    base_cost: 8,
    unit_price: 10,
    margin_percentage: 25,
    per_meter_cost: 8,
    cable_length_m: 1,
    description: 'High-grade 2-core copper electrical wire for powering Wi-Fi, 4G, and distant CCTV cameras from the nearest AC switchboard (Billed per meter).',
    is_active: true,
    is_quotation_eligible: true,
    stock_status: 'in_stock',
    stock_quantity: 1000,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };

  // 2. 90-Meter Roll Product (CAB-ELEC-2CORE-90M)
  const rollDoc = {
    id: 'CAB-ELEC-2CORE-90M',
    sku: 'CAB-ELEC-2CORE-90M',
    internal_sku: 'CAB-ELEC-2CORE-90M',
    display_name: '2-Core Pure Copper Electrical Power Wire (90 Meter Coil)',
    technical_name: '2-Core Copper Flexible Wire 0.5 sq mm 90m Coil',
    brand: 'Standard Electrical',
    category: 'cable',
    subcategory: 'electrical_wire',
    catalog_path: 'cable/electrical/Electrical Power Wire',
    technology: 'Common',
    technologies: ['Common', 'Wireless', 'HD', 'IP'],
    base_cost: 600,
    unit_price: 750,
    margin_percentage: 25,
    per_meter_cost: 7,
    cable_length_m: 90,
    description: '90-meter coil of flexible 2-core pure copper wire for camera power distribution.',
    is_active: true,
    is_quotation_eligible: true,
    stock_status: 'in_stock',
    stock_quantity: 25,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('products').doc(puDoc.id).set(puDoc, { merge: true });
  console.log(`✓ Updated Per-Meter SKU: ${puDoc.id} (Unit Price: ₹${puDoc.unit_price}/m, Base Cost: ₹${puDoc.base_cost}/m, Length: 1m)`);

  await db.collection('products').doc(rollDoc.id).set(rollDoc, { merge: true });
  console.log(`✓ Created/Updated 90m Roll SKU: ${rollDoc.id} (Unit Price: ₹${rollDoc.unit_price}/roll, Base Cost: ₹${rollDoc.base_cost}, Length: 90m)`);

  console.log('✅ Electrical wire Firestore records synced successfully.');
}

fix().catch(console.error);
