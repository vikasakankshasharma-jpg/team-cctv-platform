import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();

async function seedSettings() {
  console.log("🚀 Seeding settings/app_config...");
  const ref = db.collection("settings").doc("app_config");
  await ref.set({
    company_name: "TEAM CCTV",
    gst_rate: 18,
    labor_hd_per_camera: 400,
    labor_ip_per_camera: 500,
    cable_copper_coated_hd: 8,
    cable_copper_coated_ip: 12,
    amc_1yr_pct: 15,
    minimum_margin_threshold: 15,
    labor_cost_margin_percent: 30,
    conduit_cost_per_meter: 20,
    connector_rj45_cost: 25,
    connector_bnc_dc_cost: 70
  }, { merge: true });
  console.log("✅ Seeded settings/app_config!");
  process.exit(0);
}

seedSettings().catch(err => {
  console.error("❌ Failed to seed settings:", err);
  process.exit(1);
});
