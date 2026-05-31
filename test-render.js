const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');
const { calculatePricing } = require('./lib/pricing-engine');

// Manually parse .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
});

initializeApp({
  credential: cert({
    projectId: env['FIREBASE_PROJECT_ID'],
    clientEmail: env['FIREBASE_CLIENT_EMAIL'],
    privateKey: env['FIREBASE_PRIVATE_KEY'] ? env['FIREBASE_PRIVATE_KEY'].replace(/\\n/g, '\n') : '',
  }),
  storageBucket: env['FIREBASE_STORAGE_BUCKET']
});

const db = getFirestore();

async function run() {
  try {
    const leadId = 'hkq0Q9uPR0NtchfibYCd';
    console.log('Fetching data for lead:', leadId);
    
    const [
      leadSnap,
      productsSnap,
      addonsSnap,
      rulesSnap,
      settingsSnap,
      rulesSnap2,
      layoutsSnap
    ] = await Promise.all([
      db.collection("leads").doc(leadId).get(),
      db.collection("products").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      db.collection("addons").where("is_active", "==", true).where("is_deleted", "==", false).get(),
      db.collection("addon_rules").get(),
      db.collection("settings").doc("app_config").get(), // SETTINGS_DOC_ID is "app_config"
      db.collection("recommendation_rules").orderBy("priority", "asc").get(),
      db.collection("comparison_card_layouts").where("is_active", "==", true).get()
    ]);

    const lead = { id: leadSnap.id, ...leadSnap.data() };
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const addons = addonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const addon_rules = rulesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.data();
    const recommendation_rules = rulesSnap2.docs.map(d => ({ id: d.id, ...d.data() }));
    const card_layouts = layoutsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log('Lead customer name:', lead.customer_name);
    console.log('Products fetched:', products.length);
    console.log('Addons fetched:', addons.length);
    console.log('Settings fetched:', !!settings);

    // Initial setup mimicking ConfiguratorView
    const initialCamCount = parseInt(lead.wizard_answers["q_cam_count"]) || 4;
    const initialDays = parseInt(lead.wizard_answers["q_storage"]) || 15;
    const wantsAmcRaw = lead.wizard_answers["q_amc"];
    const wantsAmc = typeof wantsAmcRaw === 'string' ? wantsAmcRaw === 'true' : !!wantsAmcRaw;

    const reqFeaturesRaw = lead.wizard_answers["q_special_features"] || lead.wizard_answers["q_features"];
    const rawFeaturesArray = Array.isArray(reqFeaturesRaw) ? reqFeaturesRaw : (reqFeaturesRaw ? [reqFeaturesRaw] : []);
    
    const requestedFeatures = Array.from(new Set(rawFeaturesArray.map(f => {
      const fl = f.toLowerCase();
      if (fl.includes("night") || fl.includes("color")) return "color";
      if (fl.includes("audio") || fl.includes("mic") || fl.includes("sound")) return "mic";
      if (fl.includes("ptz") || fl.includes("360") || fl.includes("pan") || fl.includes("tilt")) return "ptz";
      if (fl.includes("ultra") || fl.includes("4mp") || fl.includes("5mp") || fl.includes("8mp") || fl.includes("4k")) return "4mp";
      if (fl.includes("stqc")) return "stqc";
      return "";
    }).filter(f => f !== "")));

    const surfaceRaw = lead.wizard_answers["q_surface"];
    const surfaceTypes = Array.isArray(surfaceRaw) ? surfaceRaw : (surfaceRaw ? [surfaceRaw] : []);

    const generalAddonsRaw = lead.wizard_answers["q_general_addons"];
    const rawAddonsArray = Array.isArray(generalAddonsRaw) ? generalAddonsRaw : (generalAddonsRaw ? [generalAddonsRaw] : []);
    const selectedAddons = rawAddonsArray.filter(a => a !== "none").map(a => `addon_${a}`);

    let mappedBrand = lead.wizard_answers["q_brand"] || "all";
    if (mappedBrand === "recommend" || mappedBrand === "unsure") mappedBrand = "all";
    if (mappedBrand === "cpplus") mappedBrand = "CP-Plus";

    const selection = {
      technology: lead.technology_choice || "HD",
      camera_count: initialCamCount,
      mixed_camera_requirements: undefined,
      recording_days: initialDays,
      ceiling_height: lead.wizard_answers["q_height"] || "standard",
      wants_amc: wantsAmc,
      requested_features: requestedFeatures,
      surface_types: surfaceTypes,
      selected_addons: selectedAddons,
      brand_preference: mappedBrand,
      installation_timeline: lead.wizard_answers["q_timeline"] || "research",
      property_type: lead.property_type,
    };

    console.log('Testing calculatePricing for Budget tier...');
    const resultBudget = calculatePricing({
      selection: { ...selection, plan_type: "budget", picture_quality: "good" },
      products,
      addons,
      settings,
      cablingDone: lead.cabling_done,
      referralDiscountPercent: 0,
      referralDiscountFlat: 0,
    });
    console.log('Budget total payable:', resultBudget.total_payable);

    console.log('Testing calculatePricing for Recommended tier...');
    const resultRec = calculatePricing({
      selection: { ...selection, plan_type: "recommended" },
      products,
      addons,
      settings,
      cablingDone: lead.cabling_done,
      referralDiscountPercent: 0,
      referralDiscountFlat: 0,
    });
    console.log('Recommended total payable:', resultRec.total_payable);

    console.log('Testing calculatePricing for Premium tier...');
    const resultPremium = calculatePricing({
      selection: { ...selection, plan_type: "premium", picture_quality: "crystal_clear" },
      products,
      addons,
      settings,
      cablingDone: lead.cabling_done,
      referralDiscountPercent: 0,
      referralDiscountFlat: 0,
    });
    console.log('Premium total payable:', resultPremium.total_payable);

    console.log('✅ ALL CALCULATIONS SUCCESSFUL! No pricing engine crashes.');
  } catch (err) {
    console.error('🚨 TEST CRASHED:', err);
  }
}

run();
