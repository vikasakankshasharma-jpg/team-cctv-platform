import { resolveProducts } from "./lib/product-resolver.ts";
import { generateConfiguration } from "./lib/configuration-engine.ts";
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });
if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }),
  });
}
const db = getFirestore();

const cases = [
  { name: "Standard 8-cam IP", req: { camera_count: 8, technology_preference: "IP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 4, outdoor_camera_count: 4 } },
  { name: "Large 16-cam HD Premium", req: { camera_count: 16, technology_preference: "HD", recording_days: 30, budget_preference: "PREMIUM", indoor_camera_count: 8, outdoor_camera_count: 8 } },
  { name: "Small 2-cam IP Long-Storage", req: { camera_count: 2, technology_preference: "IP", recording_days: 90, budget_preference: "BUDGET", indoor_camera_count: 2, outdoor_camera_count: 0 } },
  { name: "Massive 32-cam IP", req: { camera_count: 32, technology_preference: "IP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 16, outdoor_camera_count: 16 } },
  { name: "Outdoor 4-cam HD Economy", req: { camera_count: 4, technology_preference: "HD", recording_days: 15, budget_preference: "BUDGET", indoor_camera_count: 0, outdoor_camera_count: 4 } },
];

async function runTests() {
  const prodSnap = await db.collection("products").get();
  const pool = prodSnap.docs.map(d => ({id: d.id, ...d.data()}));
  
  let passed = 0;
  for (const c of cases) {
    console.log(`\n--- Test: ${c.name} ---`);
    const config = generateConfiguration(c.req as any);
    const resolved = resolveProducts(config, c.req as any, pool as any);
    
    const plan = c.req.budget_preference === "BUDGET" ? resolved.budget : (c.req.budget_preference === "PREMIUM" ? resolved.premium : resolved.recommended);
    
    let errors = [];
    
    // Tech Match
    if (plan.cameras) {
      plan.cameras.forEach(cam => {
         if (!cam.product.display_name.includes(c.req.technology_preference)) {
            errors.push(`Camera technology mismatch. Expected ${c.req.technology_preference}, got: ${cam.product.display_name}`);
         }
      });
    } else { errors.push("No cameras found"); }
    
    // Storage Match
    if (!plan.storage && c.req.recording_days > 0) {
      errors.push("Missing HDD!");
    } else if (plan.storage) {
       console.log("   -> Selected Storage:", plan.storage.display_name);
    }
    
    // Power Match
    if (!plan.power) {
      errors.push("Missing Power Supply!");
    } else {
      const pName = plan.power.display_name.toLowerCase();
      console.log("   -> Selected Power:", pName);
      if (c.req.technology_preference === "IP" && !pName.includes("poe")) {
        errors.push(`Expected PoE switch for IP, got: ${pName}`);
      }
      if (c.req.technology_preference === "HD" && !pName.includes("smps") && !pName.includes("power supply")) {
        errors.push(`Expected SMPS for HD, got: ${pName}`);
      }
    }
    
    if (errors.length === 0) {
      console.log("? PASSED");
      passed++;
    } else {
      console.log("? FAILED");
      errors.forEach(e => console.log("   ->", e));
    }
  }
  console.log(`\nResults: ${passed}/${cases.length} passed.`);
  process.exit(0);
}
runTests();
