const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    })
  });
}

const db = admin.firestore();

async function run() {
  console.log("Updating global settings...");
  await db.collection("settings").doc("global").set({
    connector_rj45_cost: 5,
    connector_bnc_dc_cost: 20,
    margin_cable: 50,
  }, { merge: true });
  console.log("Global settings updated.");

  const cables = [
    {
      display_name: "Budget Brand CAT6 Cable",
      technical_name: "CAT6 Cable CC Budget",
      brand: "budget",
      category: "cable",
      technologies: ["IP"],
      base_cost: 10.49,
      unit_price: Math.round(10.49 * 1.50), // 16
      is_active: true,
      is_quotation_eligible: true,
      stock_status: "in_stock"
    },
    {
      display_name: "CP Plus CAT6 Cable",
      technical_name: "CAT6 Cable CC CP Plus",
      brand: "cpplus",
      category: "cable",
      technologies: ["IP"],
      base_cost: 12.13,
      unit_price: Math.round(12.13 * 1.50), // 18
      is_active: true,
      is_quotation_eligible: true,
      stock_status: "in_stock"
    },
    {
      display_name: "Budget Brand 3+1 Cable",
      technical_name: "3+1 Coaxial CC Budget",
      brand: "budget",
      category: "cable",
      technologies: ["HD"],
      base_cost: 8.57,
      unit_price: Math.round(8.57 * 1.50), // 13
      is_active: true,
      is_quotation_eligible: true,
      stock_status: "in_stock"
    },
    {
      display_name: "CP Plus 3+1 Cable",
      technical_name: "3+1 Coaxial CP Plus",
      brand: "cpplus",
      category: "cable",
      technologies: ["HD"],
      base_cost: 15,
      unit_price: Math.round(15 * 1.50), // 23
      is_active: true,
      is_quotation_eligible: true,
      stock_status: "in_stock"
    }
  ];

  console.log("Checking cable products...");
  const existing = await db.collection("products").where("category", "==", "cable").get();
  
  if (existing.empty) {
    for (const c of cables) {
      await db.collection("products").add(c);
      console.log(`Added ${c.display_name}`);
    }
  } else {
    console.log("Cables already exist, updating prices/margins...");
    existing.forEach(async (doc) => {
        const data = doc.data();
        const match = cables.find(c => c.technical_name === data.technical_name);
        if (match) {
            await doc.ref.update({
                base_cost: match.base_cost,
                unit_price: match.unit_price
            });
            console.log(`Updated ${match.display_name}`);
        }
    });
  }
  console.log("Done.");
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
