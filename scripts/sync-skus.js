require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  });
} else {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

const db = admin.firestore();

async function syncSkus() {
  const updates = [
    { id: "rack_2u_wall_cctv", sku: "ACC-2U-RACK-RECORDER" },
    { id: "rack_4u_wall_cctv", sku: "ACC-4U-RACK-RECORDER" },
    { id: "cable_hdmi_1_5m", sku: "HDMI-1.5M" },
    { id: "cable_hdmi_3m", sku: "HDMI-3M" },
    { id: "cable_hdmi_5m", sku: "HDMI-5M" },
    { id: "NET-COFE-4G-ROUTER-CF707", sku: "ACC-4G-ROUTER" }
  ];

  for (const u of updates) {
    await db.collection("products").doc(u.id).set({ sku: u.sku }, { merge: true });
    console.log(`Synced sku: ${u.sku} on doc: ${u.id}`);
  }
  console.log("All SKUs synced to Firestore successfully!");
}

syncSkus().then(() => process.exit(0)).catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});
