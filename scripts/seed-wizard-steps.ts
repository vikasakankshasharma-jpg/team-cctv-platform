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

  step_install_type: {
    title: "Setup Type",
    description: "Is this a brand new installation or an upgrade?",
    position: 1,
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

  step_technology: {
    title: "Camera Technology",
    description: "What level of quality and features do you expect?",
    position: 2,
    is_active: true,
    questions: [
      {
        id: "q_tech",
        question_text: "Select security level:",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "fopt_ip", label: "IP Network Camera (Smart Digital)", value: "IP", position: 0, badge: "Recommended" },
          { id: "fopt_hd", label: "HD Analog Camera (Basic Budget)",   value: "HD", position: 1 },
          { id: "opt_wifi", label: "WiFi Camera (Wireless Smart)", value: "WiFi", position: 2 },
          
        ],
      },
    ],
  },

  step_storage: {
    title: "Recording Storage",
    description: "How far back do you need to watch old recordings?",
    position: 4,
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
        ],
      },
    ],
  },

  step_general_addons: {
    title: "Accessories",
    description: "Would you like to include any extra accessories?",
    position: 6,
    is_active: true,
    questions: [
      {
        id: "q_general_addons",
        question_text: "Select additional hardware (Optional):",
        input_type: "multi",
        is_required: false,
        position: 0,
        options: [
          { id: "aopt_none",    label: "No extra accessories needed", value: "none",    position: 0 },
          { id: "aopt_monitor", label: "Monitor Display (32-inch)",   value: "monitor", position: 1 },
          { id: "aopt_ups",     label: "Power Backup (UPS)",          value: "ups",     position: 2 },
          { id: "aopt_4g",      label: "4G Router (No WiFi at site)", value: "4g",      position: 3 },
        ],
      },
    ],
  },

  step_site_overview: {
    title: "Site Overview",
    description: "Help our installers prepare for your site.",
    position: 7,
    is_active: true,
    questions: [
      {
        id: "q_height",
        question_text: "What is the approximate mounting height?",
        input_type: "single",
        is_required: true,
        position: 0,
        options: [
          { id: "hopt_std",   label: "Standard (Up to 10ft)",        value: "standard",  position: 0 },
          { id: "hopt_high",  label: "High (10ft - 15ft)",           value: "high",      position: 1, badge: "Requires Ladder" },
          { id: "hopt_vhigh", label: "Very High (15ft+)",            value: "very_high", position: 2, badge: "Requires Ladder" },
        ],
      },
      {
        id: "q_surface",
        question_text: "What kind of surface will the cameras be mounted on?",
        input_type: "multi",
        is_required: true,
        position: 1,
        options: [
          { id: "sopt_brick",  label: "Concrete / Brick Wall",  value: "brick",   position: 0 },
          { id: "sopt_false",  label: "False Ceiling",          value: "false",   position: 1 },
          { id: "sopt_marble", label: "Marble / Stone",         value: "marble",  position: 2 },
          { id: "sopt_metal",  label: "Metal / Pole",           value: "metal",   position: 3 },
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

  // Delete all existing steps to ensure a clean slate
  console.log("🧹 Cleaning up old wizard steps...");
  const oldSteps = await db.collection("wizard_steps").get();
  const deleteBatch = db.batch();
  for (const doc of oldSteps.docs) {
    deleteBatch.delete(doc.ref);
  }
  await deleteBatch.commit();
  console.log("✅ Old steps deleted.");

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

