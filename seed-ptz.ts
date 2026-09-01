import { adminDb } from "./lib/firebase-admin";

async function seedPTZ() {
  const addonsRef = adminDb.collection("addons");

  const ptz1 = {
    display_name: "PTZ 15x Optical Zoom Upgrade (Budget)",
    category: "upgrade_camera",
    technology: "IP",
    base_cost: 7500,
    unit_price: 8625, // 7500 * 1.15
    margin_percent: 15,
    brand: "budget",
    is_active: true,
    stock_quantity: 10,
    unit_multiplier: "none"
  };

  const ptz2 = {
    display_name: "PTZ 25x Optical Zoom Upgrade (CP Plus)",
    category: "upgrade_camera",
    technology: "IP",
    base_cost: 29500,
    unit_price: 33925, // 29500 * 1.15
    margin_percent: 15,
    brand: "cpplus",
    is_active: true,
    stock_quantity: 5,
    unit_multiplier: "none"
  };

  await addonsRef.doc("upg_ptz_budget_15x").set(ptz1);
  await addonsRef.doc("upg_ptz_cpplus_25x").set(ptz2);
  
  // Clean up old mock ones if they exist
  try {
     await addonsRef.doc("upg_ptz_10x").delete();
     await addonsRef.doc("upg_ptz_30x").delete();
  } catch (e) {}

  console.log("Successfully seeded PTZ addons");
  process.exit(0);
}

seedPTZ().catch(console.error);
