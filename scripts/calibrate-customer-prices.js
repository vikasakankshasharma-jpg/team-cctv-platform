/**
 * @file scripts/calibrate-customer-prices.js
 * @description Calibrates all 107 products in Firestore so that:
 * 1. unit_price matches the public customer price from Mega Compu World before login (inclusive of margin).
 * 2. base_cost is calculated backwards using industry-standard margin rules (base_cost = unit_price / (1 + margin/100)).
 * 3. margin_percentage is explicitly set on each product.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  }
}

const db = admin.firestore();

function getMarginForProduct(p) {
  const cat = p.category;
  const brand = (p.brand || '').toLowerCase();
  const path = (p.catalog_path || '').toLowerCase();
  const name = (p.display_name || '').toLowerCase();

  // Storage
  if (cat === 'storage') {
    if (path.includes('microsd') || name.includes('sd card') || name.includes('micro sd')) {
      return 15; // 15% on MicroSD cards
    }
    return 8; // 8% on Surveillance Hard Drives (standard wholesale IT margin)
  }

  // CCTV Camera
  if (cat === 'cctv_camera') {
    if (brand.includes('a+') || brand.includes('generic')) {
      return 20; // 20% on budget / value brands
    }
    return 15; // 15% on tier-1 brands (Prama, CP Plus, Hikvision, Secureye, Hi-Focus)
  }

  // Recorders (DVR / NVR)
  if (cat === 'recorder') {
    return 15; // 15% on standard recorders
  }

  // Power Devices
  if (cat === 'power_device') {
    if (path.includes('poe') || name.includes('poe')) {
      return 15; // 15% on PoE Switches
    }
    return 20; // 20% on SMPS & Adapters
  }

  // Cables
  if (cat === 'cable') {
    return 20; // 20% on 3+1 and CAT6 copper cables
  }

  // Racks
  if (cat === 'rack') {
    return 25; // 25% on Wall-Mount server racks
  }

  // Networking
  if (cat === 'network') {
    return 15; // 15% on 4G SIM Routers & P2P Bridges
  }

  // HDMI Cables
  if (cat === 'hdmi_cable') {
    return 25; // 25% on display HDMI cables
  }

  // Display Monitor
  if (cat === 'display') {
    return 15; // 15% on Surveillance Monitors
  }

  // Connectors
  if (cat === 'connector') {
    return 30; // 30% on BNC, DC Pins, RJ45 modular plugs
  }

  // Camera Mounts / Junction Boxes
  if (cat === 'camera_mount') {
    return 25; // 25% on PVC Weatherproof Junction Boxes
  }

  return 15;
}

async function calibrate() {
  console.log("==> Fetching all products from Firestore...");
  const snap = await db.collection('products').get();
  console.log(`Found ${snap.docs.length} products.`);

  const batch = db.batch();
  let updatedCount = 0;
  const summaryByCat = {};

  snap.docs.forEach(doc => {
    const p = doc.data();
    const custPrice = p.unit_price;
    const margin = getMarginForProduct(p);
    const baseCost = Math.round(custPrice / (1 + margin / 100));

    batch.update(doc.ref, {
      unit_price: custPrice,
      base_cost: baseCost,
      margin_percentage: margin,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    updatedCount++;
    if (!summaryByCat[p.category]) {
      summaryByCat[p.category] = { count: 0, sample: [] };
    }
    summaryByCat[p.category].count++;
    if (summaryByCat[p.category].sample.length < 2) {
      summaryByCat[p.category].sample.push({
        name: p.display_name.slice(0, 42),
        custPrice,
        baseCost,
        margin: `+${margin}%`,
        profit: custPrice - baseCost
      });
    }
  });

  await batch.commit();
  console.log(`==> Successfully calibrated ${updatedCount} products in Firestore!\n`);

  console.log("=== Category-Wise Pricing Calibration Summary ===");
  for (const [cat, data] of Object.entries(summaryByCat)) {
    console.log(`\n[${cat.toUpperCase()}] (${data.count} items):`);
    data.sample.forEach(s => {
      console.log(`  • ${s.name.padEnd(44)} Customer Price: ₹${s.custPrice} | Dealer Cost: ₹${s.baseCost} | Margin: ${s.margin} (Profit: ₹${s.profit})`);
    });
  }

  process.exit(0);
}

calibrate().catch(err => {
  console.error("Error during calibration:", err);
  process.exit(1);
});
