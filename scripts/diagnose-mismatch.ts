import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { adminDb } from "../lib/firebase-admin";
import { calculatePricing } from "../lib/pricing-engine";
import { Product, Addon, AppSettings, Lead } from "../types";

import { SETTINGS_DOC_ID } from "../lib/constants";

async function main() {
  const leadId = "276gQ5K232tHPJ0hXx0e";
  const [leadDoc, productsSnap, addonsSnap, settingsSnap] = await Promise.all([
    adminDb.collection("leads").doc(leadId).get(),
    adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
    adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
    adminDb.collection("settings").doc(SETTINGS_DOC_ID).get(),
  ]);

  const leadData = leadDoc.data() as Lead;
  const products = productsSnap.docs.map(d => {
    const data = d.data() as any;
    if (!Array.isArray(data.technologies)) {
      data.technologies = data.technology ? [data.technology] : ["Common"];
    }
    return { id: d.id, ...data };
  }) as Product[];
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Addon[];
  const settings = settingsSnap.data() as AppSettings;

  console.log("Products count:", products.length);
  console.log("Addons count:", addons.length);

  const cameras = products.filter(p => p.category === "cctv_camera");
  console.log("Cameras:", cameras.map(c => ({ id: c.id, brand: c.brand, res: (c as any).resolution, price: (c as any).unit_price })));

  const cam = products.find(p => p.brand === "CP Plus" && p.category === "cctv_camera" && ((p as any).resolution === "2MP" || p.resolution_mp === 2));
  const rec = products.find(p => p.brand === "CP Plus" && p.category === "recorder" && p.technology === "HD" && p.channels === 4);
  const str = products.find(p => p.category === "storage" && ((p as any).capacity === "500GB" || (p as any).storage_capacity_tb === 0.5));

  console.log("Found Cam:", cam?.id, cam?.display_name);
  console.log("Found Rec:", rec?.id, rec?.display_name);
  console.log("Found Str:", str?.id, str?.display_name);

  const selection: any = {
    lead_id: leadId,
    plan_type: "recommended",
    technology: "HD",
    camera_count: 4,
    picture_quality: "good",
    recording_days: 7,
    selected_addons: [],
    selected_camera_id: cam?.id,
    selected_recorder_id: rec?.id,
    selected_storage_id: str?.id,
    brand_preference: "CP Plus",
    resolution_preference: "2MP",
    property_type: "home"
  };

  const pricing1 = calculatePricing({
    selection,
    products,
    addons,
    settings,
    cablingDone: leadData.cabling_done || false,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    activeOffer: leadData.active_offer,
  });

  console.log("Pricing with explicit IDs total:", pricing1.total_payable);
  console.log("Items:", pricing1.items.map(i => `${i.display_name} x${i.qty} = ${i.line_total}`));

  // Now test what /api/quotes receives if selection fields differ:
  // In /api/quotes, lines 93-124 map outdoor_camera_count, indoor_camera_count, wiring_type, etc.!
  const wizardAnswers = (leadData.wizard_answers || {}) as Record<string, unknown>;
  const siteSurvey = (leadData as any).site_survey || {};
  console.log("wizardAnswers:", wizardAnswers);
  console.log("siteSurvey:", siteSurvey);

  const backendSelection = { ...selection };
  if (!backendSelection.recording_mode && wizardAnswers.q_recording_mode) {
    backendSelection.recording_mode = wizardAnswers.q_recording_mode as any;
  }
  // If user selected a specific camera/package, do not overwrite with mixed split from wizard answers
  if (!backendSelection.selected_camera_id) {
    if (backendSelection.outdoor_camera_count === undefined) {
      if (siteSurvey.outdoor_camera_count !== undefined) {
        backendSelection.outdoor_camera_count = siteSurvey.outdoor_camera_count;
      } else if (wizardAnswers.outdoor_camera_count !== undefined) {
        backendSelection.outdoor_camera_count = Number(wizardAnswers.outdoor_camera_count);
      }
    }
    if (backendSelection.indoor_camera_count === undefined) {
      if (siteSurvey.indoor_camera_count !== undefined) {
        backendSelection.indoor_camera_count = siteSurvey.indoor_camera_count;
      } else if (wizardAnswers.indoor_camera_count !== undefined) {
        backendSelection.indoor_camera_count = Number(wizardAnswers.indoor_camera_count);
      }
    }
  }

  const pricing2 = calculatePricing({
    selection: backendSelection,
    products,
    addons,
    settings,
    cablingDone: leadData.cabling_done || false,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    activeOffer: leadData.active_offer,
  });

  console.log("Backend calculation total:", pricing2.total_payable);
  console.log("Backend Items:", pricing2.items.map(i => `${i.display_name} x${i.qty} = ${i.line_total}`));
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
