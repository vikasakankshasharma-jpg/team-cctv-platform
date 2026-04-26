import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const SETTINGS_DOC_ID = "app_config";

export async function GET() {
  // SECURITY GUARD: Block access in production to prevent data wipes
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Seeding is disabled in production. Use a local service account to seed directly." },
      { status: 403 }
    );
  }

  try {
    const batch = adminDb.batch();

    // --- 1. SEED PROFESSIONAL PRODUCT MATRIX (WITH LOGIC FIELDS) ---
    const products = [
      // HD Cameras
      { technical_name: "cam_hd_2mp", display_name: "TEAM 2MP HD Pro-Dome", category: "camera", technology: "HD", unit_price: 1450, resolution_tier: "good", is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "cam_hd_5mp", display_name: "TEAM 5MP HD Ultra-Bullet", category: "camera", technology: "HD", unit_price: 2100, resolution_tier: "very_clear", is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "cam_hd_8mp", display_name: "TEAM 8MP 4K HD Crystal", category: "camera", technology: "HD", unit_price: 3200, resolution_tier: "crystal_clear", is_active: true, is_deleted: false, created_at: new Date() },
      
      // IP Cameras
      { technical_name: "cam_ip_2mp", display_name: "TEAM 2MP IP Smart-Dome", category: "camera", technology: "IP", unit_price: 2850, resolution_tier: "good", is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "cam_ip_5mp", display_name: "TEAM 5MP IP AI-Bullet", category: "camera", technology: "IP", unit_price: 3600, resolution_tier: "very_clear", is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "cam_ip_8mp", display_name: "TEAM 8MP 4K IP Elite-Node", category: "camera", technology: "IP", unit_price: 5800, resolution_tier: "crystal_clear", is_active: true, is_deleted: false, created_at: new Date() },
      
      // Recorders (Channels)
      { technical_name: "dvr_4ch", display_name: "4-Channel Hybrid DVR", category: "recorder", technology: "HD", unit_price: 3800, channels: 4, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "dvr_8ch", display_name: "8-Channel Hybrid DVR", category: "recorder", technology: "HD", unit_price: 6200, channels: 8, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "nvr_4ch", display_name: "4-Channel Smart NVR", category: "recorder", technology: "IP", unit_price: 5900, channels: 4, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "nvr_8ch", display_name: "8-Channel Smart NVR", category: "recorder", technology: "IP", unit_price: 8800, channels: 8, is_active: true, is_deleted: false, created_at: new Date() },
      
      // Accessories (Hard Disks)
      { technical_name: "hdd_500gb", display_name: "500GB Surveillance HDD", category: "accessory", technology: "both", unit_price: 2500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_1tb", display_name: "1TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 4200, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_2tb", display_name: "2TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 6800, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_3tb", display_name: "3TB Surveillance HDD", category: "accessory", technology: "both", unit_price: 8500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_4tb", display_name: "4TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 10500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_6tb", display_name: "6TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 14500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_8tb", display_name: "8TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 18500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_10tb", display_name: "10TB Seagate SkyHawk", category: "accessory", technology: "both", unit_price: 22500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_12tb", display_name: "12TB Enterprise HDD", category: "accessory", technology: "both", unit_price: 28500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_14tb", display_name: "14TB Enterprise HDD", category: "accessory", technology: "both", unit_price: 34500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_16tb", display_name: "16TB Enterprise HDD", category: "accessory", technology: "both", unit_price: 40500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_18tb", display_name: "18TB Enterprise HDD", category: "accessory", technology: "both", unit_price: 46500, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "hdd_20tb", display_name: "20TB Enterprise HDD", category: "accessory", technology: "both", unit_price: 52500, is_active: true, is_deleted: false, created_at: new Date() },
    ];

    products.forEach(p => {
      const ref = adminDb.collection("products").doc(p.technical_name);
      batch.set(ref, p);
    });

    // --- 2. SEED ELITE SYSTEM ADD-ONS ---
    // --- 2. SEED ELITE SYSTEM ADD-ONS ---
    const addons = [
      { technical_name: "wire_mgr_mini", display_name: "Compact Wire Manager", price: 450, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "wire_mgr_max", display_name: "Industrial Wire Orchestrator", price: 1200, is_active: true, is_deleted: false, created_at: new Date() },
      { technical_name: "audio_mic", display_name: "Active Noise-Cancelling Mic", price: 850, is_active: true, is_deleted: false, created_at: new Date() },
    ];

    addons.forEach(a => {
      const ref = adminDb.collection("addons").doc(a.technical_name);
      batch.set(ref, a);
    });

    // --- 3. SEED ELITE WIZARD CONFIGURATION (COMPLETE 5 STEPS) ---
    const wizardSteps = [
      {
        id: "step_prop_type",
        title: "Property Type",
        description: "Tell us where you want to install the cameras.",
        position: 0,
        is_active: true,
        questions: [
          {
            id: "q_prop_type",
            question_text: "Where is the site?",
            position: 0,
            input_type: "single",
            is_required: true,
            options: [
              { label: "Home", value: "home", position: 0, pricing_tags: [] },
              { label: "Office", value: "office", position: 1, pricing_tags: [] },
              { label: "Factory / Warehouse", value: "factory", position: 2, pricing_tags: ["industrial_grade"] },
            ]
          }
        ]
      },
      {
        id: "step_prop_size",
        title: "Property Size",
        description: "How big is the area you want to cover?",
        position: 1,
        is_active: true,
        questions: [
          {
            id: "q_prop_size",
            question_text: "Approximate Coverage Area?",
            position: 0,
            input_type: "single",
            is_required: true,
            options: [
              { label: "Small area", value: "small", position: 0, pricing_tags: [] },
              { label: "Medium area", value: "medium", position: 1, pricing_tags: [] },
              { label: "Large area", value: "large", position: 2, pricing_tags: ["high_storage"] },
            ]
          }
        ]
      },
      {
        id: "step_infra",
        title: "Wiring Check",
        description: "Has the wiring already been done at your site?",
        position: 2,
        is_active: true,
        questions: [
          {
            id: "q_wiring",
            question_text: "Current Wiring Status?",
            position: 0,
            input_type: "single",
            is_required: true,
            options: [
              { label: "Wiring is already done", value: "true", position: 0, pricing_tags: ["labor_fitting_only"] },
              { label: "Need new wiring service", value: "false", position: 1, pricing_tags: ["labor_full_installation"] },
            ]
          }
        ]
      },
      {
        id: "step_features",
        title: "System Features",
        description: "Choose extra features you want in your cameras.",
        position: 3,
        is_active: true,
        questions: [
          {
            id: "q_features",
            question_text: "What features do you need?",
            position: 0,
            input_type: "multi",
            is_required: true,
            options: [
              { label: "Starlight-Night Vision", value: "night_vision", position: 0, pricing_tags: ["starlight"] },
              { label: "Mobile Intelligence", value: "phone_alerts", position: 1, pricing_tags: ["cloud_ready"] },
              { label: "Bi-Directional Audio", value: "audio", position: 2, pricing_tags: ["audio_mic"] },
            ]
          }
        ]
      },
      {
        id: "step_tech",
        title: "Technology Type",
        description: "Choose between standard HD or smart digital cameras.",
        position: 4,
        is_active: true,
        questions: [
          {
            id: "q_tech",
            question_text: "Which technology would you like?",
            position: 0,
            input_type: "single",
            is_required: true,
            options: [
              { label: "Standard HD Cameras", value: "HD", position: 0, pricing_tags: ["hd_standard"] },
              { label: "Smart Digital (IP) Cameras", value: "IP", position: 1, pricing_tags: ["ip_pro"] },
            ]
          }
        ]
      }
    ];

    // Clear existing wizard data to ensure fresh 5-step state
    // Note: Batch limit is 500, but we'll manually seed carefully
    for (const step of wizardSteps) {
      const stepRef = adminDb.collection("wizard_steps").doc(step.id);
      const { id, questions, ...stepData } = step;
      batch.set(stepRef, { ...stepData, created_at: new Date() });

      for (const question of questions) {
        const qRef = stepRef.collection("questions").doc(question.id);
        const { id: qId, options, ...qData } = question;
        batch.set(qRef, qData);

        for (const option of options) {
          const optRef = qRef.collection("options").doc();
          batch.set(optRef, option);
        }
      }
    }

    // --- 4. SEED SETTINGS ---
    const settingsRef = adminDb.collection("settings").doc(SETTINGS_DOC_ID);
    batch.set(settingsRef, {
      company_name: "TEAM CCTV",
      company_logo_url: null,
      gst_rate: 18,
      whatsapp_template: "Security Alert: {{customer_name}}, your custom configuration is ready.",
      pricing_cache_ttl_seconds: 3600,
      otp_provider: "firebase_phone",
      labor_fitting_only_rate: 650,
      labor_full_installation_rate: 1800,
      wire_cost_per_meter: 45,
      updated_at: new Date(),
    });

    await batch.commit();
    return NextResponse.json({ message: "Elite Readiness Data Seeding Successful" });
  } catch (error: any) {
    console.error("Seeding Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
