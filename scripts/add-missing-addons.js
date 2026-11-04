/**
 * @file scripts/add-missing-addons.js
 * @description Adds the 6 essential quotation add-on items verified from Mega Compu World
 * so that InstantQuotationReview, QuoteComparison, and pricing-engine never hit synthetic fallbacks.
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
const ts = admin.firestore.FieldValue.serverTimestamp();

const MISSING_ADDONS = {
  "ACC-WIFI-EXTENDER": {
    display_name: "TP-Link 300Mbps Wi-Fi Range Extender (TL-WA850RE)",
    technical_name: "TL-WA850RE",
    internal_sku: "ACC-WIFI-EXTENDER",
    sku: "ACC-WIFI-EXTENDER",
    vendor_pid: "A0050",
    source_vendor: "Mega Compu World",
    brand: "TP-Link",
    category: "network",
    technology: "Wireless",
    technologies: ["Wireless", "Common"],
    catalog_path: "network/router/4G Wireless Router",
    unit_price: 1558,
    base_cost: 1355,
    margin_percentage: 15,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  },
  "CAB-ELEC-2CORE-PU": {
    display_name: "2-Core Pure Copper Electrical Power Wire (Per Meter)",
    technical_name: "CAB-ELEC-2CORE-PU",
    internal_sku: "CAB-ELEC-2CORE-PU",
    sku: "CAB-ELEC-2CORE-PU",
    source_vendor: "Mega Compu World",
    brand: "Standard Electrical",
    category: "cable",
    subcategory: "electrical_wire",
    technology: "Common",
    technologies: ["Common", "Wireless", "HD", "IP"],
    catalog_path: "cable/electrical/Electrical Power Wire",
    unit_price: 12,
    base_cost: 9,
    margin_percentage: 25,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  },
  "ACC-PVC-RACK-POE": {
    display_name: "PVC Weatherproof Enclosure Box for PoE Switch",
    technical_name: "ACC-PVC-RACK-POE",
    internal_sku: "ACC-PVC-RACK-POE",
    sku: "ACC-PVC-RACK-POE",
    source_vendor: "Mega Compu World",
    brand: "Generic",
    category: "rack",
    technology: "Common",
    technologies: ["Common", "IP"],
    catalog_path: "rack/cctv_rack/Wall-Mount CCTV Rack",
    unit_price: 630,
    base_cost: 504,
    margin_percentage: 25,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  },
  "HDMI-10M": {
    display_name: "High-Speed 4K HDMI Cable 10 Meter",
    technical_name: "HDMI-4K-10M",
    internal_sku: "HDMI-10M",
    sku: "HDMI-10M",
    vendor_pid: "P6037",
    source_vendor: "Mega Compu World",
    brand: "Ranz",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    catalog_path: "hdmi_cable/display/HDMI Display Cable",
    length_meters: 10,
    unit_price: 450,
    base_cost: 360,
    margin_percentage: 25,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  },
  "HDMI-15M": {
    display_name: "High-Speed 4K HDMI Cable 15 Meter",
    technical_name: "HDMI-4K-15M",
    internal_sku: "HDMI-15M",
    sku: "HDMI-15M",
    vendor_pid: "P5415",
    source_vendor: "Mega Compu World",
    brand: "Ranz",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    catalog_path: "hdmi_cable/display/HDMI Display Cable",
    length_meters: 15,
    unit_price: 680,
    base_cost: 544,
    margin_percentage: 25,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  },
  "HDMI-20M": {
    display_name: "High-Speed 4K HDMI Cable 20 Meter",
    technical_name: "HDMI-4K-20M",
    internal_sku: "HDMI-20M",
    sku: "HDMI-20M",
    vendor_pid: "A2832",
    source_vendor: "Mega Compu World",
    brand: "Securelink",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    catalog_path: "hdmi_cable/display/HDMI Display Cable",
    length_meters: 20,
    unit_price: 950,
    base_cost: 760,
    margin_percentage: 25,
    stock_status: "in_stock",
    is_active: true,
    is_quotation_eligible: true
  }
};

async function addMissingAddons() {
  console.log("==> Adding 6 verified quotation add-ons into Firestore...");
  const batch = db.batch();

  for (const [id, data] of Object.entries(MISSING_ADDONS)) {
    const docRef = db.collection('products').doc(id);
    batch.set(docRef, {
      ...data,
      id,
      created_at: ts,
      updated_at: ts
    }, { merge: true });
    console.log(`  + [${id}] ${data.display_name} - Cust: ₹${data.unit_price} | Cost: ₹${data.base_cost} | Margin: +${data.margin_percentage}%`);
  }

  await batch.commit();

  const totalSnap = await db.collection('products').get();
  console.log(`\n==> Firestore now has ${totalSnap.docs.length} fully verified products!`);
  process.exit(0);
}

addMissingAddons().catch(err => {
  console.error("Error adding addons:", err);
  process.exit(1);
});
