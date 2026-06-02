import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { calculatePricing } from "../lib/pricing-engine";
import { Product, Addon, AppSettings, ConfiguratorSelection } from "../types/index";

dotenv.config({ path: ".env.local" });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function runTests() {
  const productsSnap = await db.collection("products").where("is_active", "==", true).get();
  const addonsSnap = await db.collection("addons").where("is_active", "==", true).get();
  const settingsSnap = await db.collection("settings").doc("app_config").get();

  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[];
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Addon[];
  const settings = settingsSnap.data() as AppSettings;

  console.log("Loaded", products.length, "products and", addons.length, "addons.");

  const scenarios = [
    {
      name: "Standard HD (4 Cameras, Wiring Done)",
      selection: {
        technology: "HD",
        camera_count: 4,
        picture_quality: "good",
        recording_days: 15,
        selected_addons: [],
        plan_type: "recommended"
      } as ConfiguratorSelection,
      cablingDone: true
    },
    {
      name: "Smart IP (8 Cameras, Wiring Not Done)",
      selection: {
        technology: "IP",
        camera_count: 8,
        picture_quality: "very_clear",
        recording_days: 15,
        selected_addons: [],
        plan_type: "recommended",
        requested_features: ["color_nv", "audio"],
      } as ConfiguratorSelection,
      cablingDone: false
    },
    {
      name: "Wireless WiFi (4 Cameras, Solar, 4G)",
      selection: {
        technology: "WiFi",
        camera_count: 4,
        picture_quality: "very_clear",
        recording_days: 15,
        selected_addons: [],
        plan_type: "recommended",
        requested_features: ["solar", "4g"],
      } as ConfiguratorSelection,
      cablingDone: true // Wiring is irrelevant for WiFi, engine handles it
    },
    {
      name: "Mixed IP Configuration (16 Cameras, Advanced Features)",
      selection: {
        technology: "IP",
        camera_count: 16,
        picture_quality: "crystal_clear",
        recording_days: 30,
        selected_addons: [],
        plan_type: "recommended",
        mixed_camera_requirements: [
          { type: "PTZ / High Zoom", count: 2 },
          { type: "Color Night Vision", count: 4 },
          { type: "Standard Dome", count: 10 }
        ]
      } as ConfiguratorSelection,
      cablingDone: false
    }
  ];

  for (const s of scenarios) {
    try {
      const result = calculatePricing({
        selection: s.selection,
        products,
        addons,
        settings,
        cablingDone: s.cablingDone,
      });
      console.log(`\n=========================================`);
      console.log(`Scenario: ${s.name}`);
      console.log(`Total Payable: ₹${result.total_payable}`);
      console.log(`Hardware Cost: ₹${result.base_hardware_cost}`);
      console.log(`Labor/Installation: ₹${result.labor_cost}`);
      console.log(`Wiring Cost: ₹${result.cabling_cost}`);
      console.log(`GST: ₹${result.gst_amount}`);
      console.log(`Line Items:`);
      result.items.forEach(li => {
        console.log(`  - [${li.qty}x] ${li.display_name} @ ₹${li.unit_price} = ₹${li.line_total}`);
      });
    } catch (e: any) {
      console.error(`Failed to calculate pricing for ${s.name}: ${e.message}`);
    }
  }
}

runTests().then(() => process.exit(0)).catch(console.error);
