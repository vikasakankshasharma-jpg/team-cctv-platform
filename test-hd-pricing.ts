import { adminDb } from "./lib/firebase-admin";
import { calculatePricing } from "./lib/pricing-engine";
import type { Product, AppSettings } from "./types";
import { SETTINGS_DOC_ID } from "./lib/firebase-client";

async function runTests() {
  const productsSnapshot = await adminDb.collection("products").where("is_active", "==", true).get();
  const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];

  const settingsDoc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
  const settings = settingsDoc.data() as AppSettings;

  const addonsSnapshot = await adminDb.collection("addons").where("is_active", "==", true).get();
  const addons = addonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

  console.log("=== HD Camera Setups ===");
  for (let count = 1; count <= 5; count++) {
    console.log(`\n--- ${count} Cameras ---`);
    for (let opt = 1; opt <= 3; opt++) {
      try {
        const res = calculatePricing({
          selection: {
            technology: "HD",
            camera_count: count,
            selected_camera_option: opt,
            recording_days: 15,
            plan_type: "recommended",
            picture_quality: "good",
            selected_addons: []
          },
          products, settings, addons, cablingDone: false, evaluatedAddonRules: {}
        });
        
        console.log(`Option ${opt} Total: ₹${res.base_hardware_cost + res.labor_cost}`);
        // Let's print the items to see if they match the attachment
        if (opt === 1 && count === 1) {
             console.log("Breakdown for 1 Camera Option 1:");
             res.items.forEach(i => console.log(`  ${i.qty}x ${i.display_name} @ ₹${i.unit_price} = ₹${i.line_total}`));
             console.log(`  Labor: ₹${res.labor_cost}`);
        }
        if (opt === 3 && count === 5) {
             console.log("Breakdown for 5 Cameras Option 3:");
             res.items.forEach(i => console.log(`  ${i.qty}x ${i.display_name} @ ₹${i.unit_price} = ₹${i.line_total}`));
             console.log(`  Labor: ₹${res.labor_cost}`);
        }
      } catch (err) {
        console.log(`Option ${opt} failed:`, (err as any).message);
      }
    }
  }
}

runTests().then(() => process.exit(0)).catch(console.error);
