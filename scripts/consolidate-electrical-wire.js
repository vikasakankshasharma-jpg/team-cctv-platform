const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

const db = admin.firestore();

async function run() {
  console.log('1. Consolidating 2-Core Electrical Wire to Single Physical Roll Product...');

  // Ensure CAB-ELEC-2CORE-90M has per_meter_cost: 8
  const rollData = {
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
    per_meter_cost: 8,
    cable_length_m: 90,
    description: '90-meter coil of flexible 2-core pure copper wire for camera power distribution (Loose per-meter price configured at ₹8 cost + 25% margin = ₹10/m).',
    is_active: true,
    is_quotation_eligible: true,
    stock_status: 'in_stock',
    stock_quantity: 25,
    updated_at: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('products').doc('CAB-ELEC-2CORE-90M').set(rollData, { merge: true });
  console.log('✓ Verified CAB-ELEC-2CORE-90M in Firestore with per_meter_cost = 8');

  // Delete duplicate virtual CAB-ELEC-2CORE-PU product
  await db.collection('products').doc('CAB-ELEC-2CORE-PU').delete();
  console.log('✓ Deleted duplicate virtual item CAB-ELEC-2CORE-PU from Firestore');

  // Update pricing-engine.ts
  const enginePath = path.join(__dirname, '../lib/pricing-engine.ts');
  let engineCode = fs.readFileSync(enginePath, 'utf-8');
  const isCRLF = engineCode.includes('\r\n');
  if (isCRLF) engineCode = engineCode.replace(/\r\n/g, '\n');

  // Update CAB-ELEC-2CORE-PU check in cablingDone
  engineCode = engineCode.replace(
    'i.product_id === "CAB-ELEC-2CORE-PU" ||',
    'i.product_id === "CAB-ELEC-2CORE-90M" || i.product_id === "CAB-ELEC-2CORE-PU" ||'
  );

  // Update elecProduct lookup & per-meter cost derivation
  const oldLookup = `    // Look for exact per-meter 2-core wire product (unit_price < 50), never a 90m roll!
    const elecProduct = products.find(p => p.id === "CAB-ELEC-2CORE-PU" || p.sku === "CAB-ELEC-2CORE-PU") ||
      products.find(p => 
        p.category === "cable" && 
        (p.subcategory === "electrical_wire" || (p.display_name || "").toLowerCase().includes("2-core") || (p.display_name || "").toLowerCase().includes("electrical")) &&
        ((p.display_name || "").toLowerCase().includes("per mtr") || (p.unit_price || 0) < 50)
      );

    let baseRatePerMeter = 10;
    let baseCostPerMeter = 6;

    if (elecProduct) {
      if (elecProduct.cable_length_m && elecProduct.cable_length_m > 1) {
        // Roll or coil (e.g. 90m roll) - derive true per-meter rate
        baseRatePerMeter = Math.round((elecProduct.unit_price || 750) / elecProduct.cable_length_m);
        baseCostPerMeter = Math.round((elecProduct.base_cost || 600) / elecProduct.cable_length_m);
      } else if (elecProduct.unit_price && elecProduct.unit_price <= 50) {
        // Dedicated per-meter product rate
        baseRatePerMeter = elecProduct.unit_price;
        baseCostPerMeter = elecProduct.base_cost || Math.round(baseRatePerMeter / 1.25);
      } else if (elecProduct.per_meter_cost && elecProduct.per_meter_cost <= 50) {
        baseCostPerMeter = elecProduct.per_meter_cost;
        baseRatePerMeter = Math.round(baseCostPerMeter * (1 + (elecProduct.margin_percentage || 25) / 100));
      } else {
        baseRatePerMeter = 10;
        baseCostPerMeter = 6;
      }
    }`;

  const newLookup = `    // Look for electrical power wire product (single canonical physical roll with per_meter_cost provision)
    const elecProduct = products.find(p => p.id === "CAB-ELEC-2CORE-90M" || p.id === "CAB-ELEC-2CORE-PU" || p.sku === "CAB-ELEC-2CORE-90M" || p.sku === "CAB-ELEC-2CORE-PU") ||
      products.find(p => 
        p.category === "cable" && 
        (p.subcategory === "electrical_wire" || (p.display_name || "").toLowerCase().includes("2-core") || (p.display_name || "").toLowerCase().includes("electrical"))
      );

    let baseRatePerMeter = 10;
    let baseCostPerMeter = 6;

    if (elecProduct) {
      if (elecProduct.per_meter_cost && elecProduct.per_meter_cost > 0 && elecProduct.per_meter_cost <= 50) {
        // Explicitly configured loose per-meter cost (from Product Pricing Tab option)
        baseCostPerMeter = elecProduct.per_meter_cost;
        baseRatePerMeter = Math.round(baseCostPerMeter * (1 + (elecProduct.margin_percentage || 25) / 100));
      } else if (elecProduct.cable_length_m && elecProduct.cable_length_m > 1) {
        // Auto-derived per-meter rate from roll
        baseCostPerMeter = Math.round((elecProduct.base_cost || 600) / elecProduct.cable_length_m);
        baseRatePerMeter = Math.round((elecProduct.unit_price || 750) / elecProduct.cable_length_m);
      } else if (elecProduct.unit_price && elecProduct.unit_price <= 50) {
        baseRatePerMeter = elecProduct.unit_price;
        baseCostPerMeter = elecProduct.base_cost || Math.round(baseRatePerMeter / 1.25);
      } else {
        baseRatePerMeter = settings.wire_cost_per_meter || 10;
        baseCostPerMeter = settings.wire_cost_per_meter ? Math.round(settings.wire_cost_per_meter * 0.7) : 6;
      }
    }`;

  engineCode = engineCode.replace(oldLookup, newLookup);
  engineCode = engineCode.replace(
    'product_id: elecProduct?.id || "CAB-ELEC-2CORE-PU",',
    'product_id: elecProduct?.id || "CAB-ELEC-2CORE-90M",'
  );

  if (isCRLF) engineCode = engineCode.replace(/\n/g, '\r\n');
  fs.writeFileSync(enginePath, engineCode, 'utf-8');
  console.log('✓ Successfully updated pricing-engine.ts to single-SKU architecture');

  console.log('✅ Consolidation complete.');
}

run().catch(console.error);
