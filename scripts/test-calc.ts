import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

async function main() {
  const { adminDb } = await import("../lib/firebase-admin");
  const { calculatePricing } = await import("../lib/pricing-engine");

  const leadId = "276gQ5K232tHPJ0hXx0e";
  const [leadDoc, productsSnap, addonsSnap, settingsSnap] = await Promise.all([
    adminDb.collection("leads").doc(leadId).get(),
    adminDb.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
    adminDb.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
    adminDb.collection("settings").doc("pricing").get(),
  ]);

  const leadData = leadDoc.data() as any;
  const products = productsSnap.docs.map(d => {
    const data = d.data() as any;
    if (!Array.isArray(data.technologies)) {
      data.technologies = data.technology ? [data.technology] : ["Common"];
    }
    return { id: d.id, ...data };
  });
  const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const settings = settingsSnap.data() as any;

  console.log("Products count:", products.length);
  console.log("Lead cabling_done:", leadData.cabling_done);
  console.log("Lead wizard_answers:", leadData.wizard_answers);

  // Pick CP Plus 2MP card products
  const cam = products.find((p: any) => p.brand === "CP Plus" && p.category === "cctv_camera" && p.resolution_mp === 2);
  const rec = products.find((p: any) => p.brand === "CP Plus" && p.category === "recorder" && p.technology === "HD" && p.channels === 4);
  const str = products.find((p: any) => p.category === "storage" && p.capacity === "500GB");

  console.log("Cam:", cam?.id, "Rec:", rec?.id, "Str:", str?.id);

  // Frontend calculation
  const frontendSelection: any = {
    lead_id: leadId,
    plan_type: "recommended",
    technology: "HD",
    camera_count: 4,
    picture_quality: "good",
    recording_days: 15,
    selected_addons: [],
    selected_camera_id: cam?.id,
    selected_recorder_id: rec?.id,
    selected_storage_id: str?.id,
    brand_preference: "CP Plus",
    resolution_preference: "2MP",
    property_type: "home"
  };

  const pFrontend = calculatePricing({
    selection: frontendSelection,
    products,
    addons,
    settings,
    cablingDone: leadData.cabling_done || false,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    activeOffer: leadData.active_offer,
  });

  console.log("Frontend calculated total:", pFrontend.total_payable);

  // Backend calculation from /api/quotes/route.ts
  const wizardAnswers = leadData.wizard_answers || {};
  const siteSurvey = leadData.site_survey || {};

  const backendSelection = { ...frontendSelection };
  if (!backendSelection.recording_mode && wizardAnswers.q_recording_mode) {
    backendSelection.recording_mode = wizardAnswers.q_recording_mode;
  }
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

  const pBackend = calculatePricing({
    selection: backendSelection,
    products,
    addons,
    settings,
    cablingDone: leadData.cabling_done || false,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    activeOffer: leadData.active_offer,
  });

  console.log("Backend calculated total:", pBackend.total_payable);
  console.log("Difference:", pBackend.total_payable - pFrontend.total_payable);

  if (pBackend.total_payable !== pFrontend.total_payable) {
    console.log("Frontend items:", pFrontend.items.map(i => `${i.display_name} x${i.qty} = ${i.line_total}`));
    console.log("Backend items:", pBackend.items.map(i => `${i.display_name} x${i.qty} = ${i.line_total}`));
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
