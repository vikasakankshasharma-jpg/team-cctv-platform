/**
 * @file scripts/seed-wizard-steps.ts
 * @description One-time seed script to populate Firestore `wizard_steps` collection
 *              from the canonical fallback definition in lib/queries.ts.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json -e "require('./scripts/seed-wizard-steps.ts')"
 * OR simply run via npm:
 *   npm run seed:wizard
 *
 * Safe to re-run: existing docs with same ID are merged (not duplicated).
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env vars — try .env.local first, then .env.production
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.vercel.prod"), override: false });

// ─────────────────────────────────────────────
// Firebase Admin Init
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Canonical Wizard Steps Definition
// ─────────────────────────────────────────────

interface WizardOption {
  id: string;
  label: string;
  value: string;
  position: number;
  icon?: string;
  badge?: string;
}

interface WizardQuestion {
  id: string;
  question_text: string;
  input_type: "single" | "multi" | "number";
  is_required: boolean;
  position: number;
  options: WizardOption[];
}

interface WizardStep {
  title: string;
  description: string;
  position: number;
  is_active: boolean;
  questions: WizardQuestion[];
}

const WIZARD_STEPS: Record<string, WizardStep> = {
  step_prop_type: {
    title: "Property Type",
    description: "What type of property are you securing?",
    position: 0,
    is_active: true,
    questions: [
      {
        id: "q_prop_type",
        question_text: "Select property type:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "opt_home",    label: "Home / Residential",      value: "home",      position: 0, icon: "🏠" },
          { id: "opt_office",  label: "Office / Commercial",     value: "office",    position: 1, icon: "🏢" },
          { id: "opt_shop",    label: "Shop / Retail",           value: "shop",      position: 2, icon: "🏪" },
          { id: "opt_factory", label: "Factory / Warehouse",     value: "factory",   position: 3, icon: "🏭" },
        ],
      },
    ],
  },

  step_internet: {
    title: "Internet at Site",
    description: "Do you have active WiFi or Internet at the installation site?",
    position: 1,
    is_active: true,
    questions: [
      {
        id: "q_internet",
        question_text: "Internet availability:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "opt_int_yes", label: "Yes, WiFi/Internet is available", value: "true",  position: 0, icon: "📶" },
          { id: "opt_int_no",  label: "No Internet at site",             value: "false", position: 1, icon: "📵" },
        ],
      },
    ],
  },

  step_install_type: {
    title: "Setup Type",
    description: "Is this a brand new installation or an upgrade?",
    position: 2,
    is_active: true,
    questions: [
      {
        id: "q_install_type",
        question_text: "Select setup type:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "opt_ins_new", label: "New Installation",         value: "new",     position: 0, icon: "✨" },
          { id: "opt_ins_upg", label: "Upgrade Existing System",  value: "upgrade", position: 1, icon: "⬆️" },
        ],
      },
    ],
  },

  step_cam_count: {
    title: "Camera Count",
    description: "How many cameras do you need?",
    position: 3,
    is_active: true,
    questions: [
      {
        id: "q_cam_count",
        question_text: "Enter number of cameras:",
        input_type: "number",
        is_required: true,
        position: 0,
        options: [],
      },
    ],
  },

  step_height: {
    title: "Ceiling Height",
    description: "How high are your ceilings where cameras will be mounted?",
    position: 4,
    is_active: true,
    questions: [
      {
        id: "q_height",
        question_text: "Select the maximum height:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_h_std",   label: "Standard (Up to 10 feet)",   value: "standard",  position: 0 },
          { id: "fopt_h_high",  label: "High (11 to 15 feet)",        value: "high",      position: 1 },
          { id: "fopt_h_vhigh", label: "Very High (Above 15 feet)",   value: "very_high", position: 2 },
        ],
      },
    ],
  },

  step_surface: {
    title: "Mounting Surface",
    description: "What type of surfaces will the cameras be mounted on?",
    position: 5,
    is_active: true,
    questions: [
      {
        id: "q_surface",
        question_text: "Select all that apply:",
        input_type: "multi",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_std",   label: "Standard (Brick, Concrete walls)",        value: "standard",      position: 0 },
          { id: "fopt_false", label: "False Ceiling (Gypsum / POP)",             value: "false_ceiling", position: 1 },
          { id: "fopt_metal", label: "Metal (Sheds, Poles)",                     value: "metal",         position: 2 },
          { id: "fopt_prem",  label: "Premium Surfaces (Marble, Granite, Tiles)",value: "premium",       position: 3 },
        ],
      },
    ],
  },

  step_technology: {
    title: "Camera Technology",
    description: "Which camera technology do you prefer?",
    position: 6,
    is_active: true,
    questions: [
      {
        id: "q_tech",
        question_text: "Select technology:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_ip", label: "Smart Digital IP Cameras (Recommended)", value: "IP", position: 0, badge: "Recommended" },
          { id: "fopt_hd", label: "Standard HD Analog Cameras (Budget)",    value: "HD", position: 1 },
        ],
      },
    ],
  },

  step_resolution: {
    title: "Camera Quality",
    description: "What image quality do you need?",
    position: 7,
    is_active: true,
    questions: [
      {
        id: "q_resolution",
        question_text: "Select resolution:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "opt_res_2mp", label: "2MP Standard HD — Good for most homes",        value: "2mp", position: 0 },
          { id: "opt_res_4mp", label: "4MP Pro HD — Clearer faces & number plates",   value: "4mp", position: 1, badge: "Popular" },
          { id: "opt_res_5mp", label: "5MP Ultra HD — Crisp detail, night color",     value: "5mp", position: 2 },
          { id: "opt_res_8mp", label: "8MP 4K Professional Grade — Banks & factories",value: "8mp", position: 3 },
        ],
      },
    ],
  },

  step_storage: {
    title: "Recording Storage",
    description: "How far back do you need to watch old recordings?",
    position: 8,
    is_active: true,
    questions: [
      {
        id: "q_storage",
        question_text: "Select recording duration:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_s_7",  label: "1 Week (Standard)",  value: "7",  position: 0 },
          { id: "fopt_s_15", label: "15 Days",             value: "15", position: 1, badge: "Popular" },
          { id: "fopt_s_30", label: "1 Month",             value: "30", position: 2 },
          { id: "fopt_s_90", label: "3 Months",            value: "90", position: 3 },
        ],
      },
    ],
  },

  step_features: {
    title: "Special Features",
    description: "Customize your security system capabilities.",
    position: 9,
    is_active: true,
    questions: [
      {
        id: "q_features",
        question_text: "Which features do you need? (Select all that apply)",
        input_type: "multi",
        is_required: false,
        position: 0,
        options: [
          { id: "fopt_feat_color",      label: "24/7 Color Night Vision",          value: "feat_color",      position: 0 },
          { id: "fopt_feat_dual_light", label: "Smart Dual Light (Color on motion)",value: "feat_dual_light", position: 1 },
          { id: "fopt_feat_mic",        label: "Built-in Microphone",              value: "feat_mic",        position: 2 },
          { id: "fopt_feat_speaker",    label: "Speaker / Two-Way Talk",           value: "feat_speaker",    position: 3 },
          { id: "fopt_feat_ik10",       label: "Hammer-Proof (IK10)",              value: "feat_ik10",       position: 4 },
        ],
      },
    ],
  },

  step_wiring: {
    title: "Existing Wiring",
    description: "Is your property already wired for CCTV?",
    position: 10,
    is_active: true,
    questions: [
      {
        id: "q_wiring",
        question_text: "Select cabling status:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_wired_yes", label: "Yes – Cabling is already done",   value: "true",  position: 0 },
          { id: "fopt_wired_no",  label: "No – Full installation required",  value: "false", position: 1 },
        ],
      },
    ],
  },

  step_brand: {
    title: "Brand Preference",
    description: "Do you have a specific brand in mind?",
    position: 11,
    is_active: true,
    questions: [
      {
        id: "q_brand",
        question_text: "Select brand preference:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_b_rec",   label: "Unsure, please recommend the best value", value: "recommend", position: 0, badge: "Recommended" },
          { id: "fopt_b_cp",    label: "CP Plus",                                 value: "cpplus",    position: 1 },
          { id: "fopt_b_prama", label: "Prama (Hikvision Technology)",            value: "prama",     position: 2 },
          { id: "fopt_b_dah",   label: "Dahua",                                   value: "dahua",     position: 3 },
        ],
      },
    ],
  },

  step_budget: {
    title: "Budget Range",
    description: "What is your approximate budget for this project?",
    position: 12,
    is_active: true,
    questions: [
      {
        id: "q_budget",
        question_text: "Select budget range:",
        input_type: "single",
        is_required: false,
        position: 0,
        options: [
          { id: "opt_bud_low",  label: "Budget Friendly (Value for money)",       value: "budget",   position: 0 },
          { id: "opt_bud_mid",  label: "Standard (Performance balanced)",          value: "standard", position: 1, badge: "Popular" },
          { id: "opt_bud_high", label: "Premium (Best quality & features)",        value: "premium",  position: 2 },
        ],
      },
    ],
  },

  step_timeline: {
    title: "Installation Timeline",
    description: "How soon do you need this system installed?",
    position: 13,
    is_active: true,
    questions: [
      {
        id: "q_timeline",
        question_text: "Select urgency:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_t_asap",     label: "ASAP (Today/Tomorrow)", value: "asap",     position: 0 },
          { id: "fopt_t_week",     label: "Within a week",          value: "week",     position: 1 },
          { id: "fopt_t_month",    label: "Next Month",             value: "month",    position: 2 },
          { id: "fopt_t_research", label: "Just researching",       value: "research", position: 3 },
        ],
      },
    ],
  },

  step_amc: {
    title: "Maintenance Plan",
    description: "Would you like an Annual Maintenance Contract (AMC)?",
    position: 14,
    is_active: true,
    questions: [
      {
        id: "q_amc",
        question_text: "Select AMC option:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_amc_yes", label: "Yes, protect my system (Recommended)", value: "true",  position: 0, badge: "Recommended" },
          { id: "fopt_amc_no",  label: "No, I'll manage it myself",             value: "false", position: 1 },
        ],
      },
    ],
  },
};

// ─────────────────────────────────────────────
// Seed Function
// ─────────────────────────────────────────────

async function seedWizardSteps() {
  console.log("🚀 Starting wizard_steps seed...");
  console.log(`   Project: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log(`   Steps to seed: ${Object.keys(WIZARD_STEPS).length}`);

  const batch = db.batch();
  let operationCount = 0;

  for (const [stepId, stepData] of Object.entries(WIZARD_STEPS)) {
    const { questions, ...stepMeta } = stepData;
    const stepRef = db.collection("wizard_steps").doc(stepId);

    // Upsert step metadata
    batch.set(
      stepRef,
      {
        ...stepMeta,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    operationCount++;

    // For each question, upsert question + its options
    for (const question of questions) {
      const { options, ...questionMeta } = question;
      const qRef = stepRef.collection("questions").doc(question.id);

      batch.set(qRef, questionMeta, { merge: true });
      operationCount++;

      for (const option of options) {
        const optRef = qRef.collection("options").doc(option.id);
        batch.set(optRef, option, { merge: true });
        operationCount++;
      }
    }
  }

  // Firestore batch limit is 500 writes
  if (operationCount > 499) {
    console.warn(`⚠️  ${operationCount} operations — may need batch splitting.`);
  }

  await batch.commit();

  console.log(`\n✅ Done! Seeded ${Object.keys(WIZARD_STEPS).length} steps with ${operationCount} total writes.`);
  console.log("\nStep order:");
  Object.entries(WIZARD_STEPS)
    .sort((a, b) => a[1].position - b[1].position)
    .forEach(([id, step]) => {
      console.log(`   ${String(step.position).padStart(2, " ")}. ${step.title.padEnd(25)} (${id})`);
    });

  process.exit(0);
}

seedWizardSteps().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
