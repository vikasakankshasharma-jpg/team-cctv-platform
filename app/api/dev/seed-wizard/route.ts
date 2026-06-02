import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dev/seed-wizard
 * Wipes and re-seeds the wizard template. Dev only.
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    // Step 1: Deep wipe all wizard_steps and their subcollections
    const existingSteps = await adminDb.collection("wizard_steps").get();
    for (const stepDoc of existingSteps.docs) {
      const questions = await stepDoc.ref.collection("questions").get();
      for (const qDoc of questions.docs) {
        const options = await qDoc.ref.collection("options").get();
        const wipeBatch = adminDb.batch();
        options.docs.forEach(opt => wipeBatch.delete(opt.ref));
        wipeBatch.delete(qDoc.ref);
        await wipeBatch.commit();
      }
      await stepDoc.ref.delete();
    }

    const seedData = [
      {
        step: { id: "step_property", position: 0, title: "Property Type", description: "What type of property are you securing?", is_active: true },
        questions: [
          {
            id: "q_prop_type", question_text: "Select property type:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "opt_home", label: "Home / Residential", value: "home", position: 0 },
              { id: "opt_office", label: "Office / Commercial", value: "office", position: 1 },
              { id: "opt_shop", label: "Shop / Retail", value: "shop", position: 2 },
              { id: "opt_factory", label: "Factory / Warehouse", value: "factory", position: 3 },
            ]
          }
        ]
      },
      {
        step: { id: "step_surface", position: 1, title: "Mounting Surface", description: "What type of surfaces will the cameras be mounted on?", is_active: true },
        questions: [
          {
            id: "q_surface", question_text: "Select all that apply:", input_type: "multi", is_required: true, position: 0,
            options: [
              { id: "fopt_std", label: "Standard (Brick, Concrete walls)", value: "standard", position: 0 },
              { id: "fopt_false", label: "False Ceiling (Gypsum / POP)", value: "false_ceiling", position: 1 },
              { id: "fopt_metal", label: "Metal (Sheds, Poles)", value: "metal", position: 2 },
              { id: "fopt_prem", label: "Premium Surfaces (Marble, Granite, Tiles)", value: "premium", position: 3 },
            ]
          }
        ]
      },
      {
        step: { id: "step_height", position: 2, title: "Ceiling Height", description: "How high are your ceilings where cameras will be mounted?", is_active: true },
        questions: [
          {
            id: "q_height", question_text: "Select the maximum height:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "fopt_h_std", label: "Standard (Up to 10 feet)", value: "standard", position: 0 },
              { id: "fopt_h_high", label: "High (11 to 15 feet)", value: "high", position: 1 },
              { id: "fopt_h_vhigh", label: "Very High (Above 15 feet)", value: "very_high", position: 2 },
            ]
          }
        ]
      },
      {
        step: { id: "step_cameras", position: 3, title: "Camera Count", description: "How many cameras do you need?", is_active: true },
        questions: [
          {
            id: "q_cam_count", question_text: "Enter number of cameras:", input_type: "number", is_required: true, position: 0,
            options: []
          }
        ]
      },
      {
        step: { id: "step_technology", position: 4, title: "Camera Technology", description: "Which camera technology do you prefer?", is_active: true },
        questions: [
          {
            id: "q_tech", question_text: "Select technology:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "opt_ip", label: "Smart Digital IP Cameras (Recommended)", value: "IP", position: 0 },
              { id: "opt_hd", label: "Standard HD Analog Cameras (Budget)", value: "HD", position: 1 },
            ]
          }
        ]
      },
      {
        step: { id: "step_storage", position: 5, title: "Storage", description: "How far back do you need to be able to watch old recordings?", is_active: true },
        questions: [
          {
            id: "q_storage", question_text: "Select recording duration:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "fopt_s_0", label: "No Storage Required", value: "0", position: 0 },
              { id: "fopt_s_7", label: "1 Week (Standard)", value: "7", position: 1 },
              { id: "fopt_s_15", label: "15 Days", value: "15", position: 2 },
              { id: "fopt_s_30", label: "1 Month", value: "30", position: 3 },
              { id: "fopt_s_90", label: "3 Months", value: "90", position: 4 },
            ]
          }
        ]
      },
      {
        step: { id: "step_features", position: 6, title: "Features", description: "Customize your recording capabilities.", is_active: true },
        questions: [
          {
            id: "q_features", question_text: "Which special features do you need? (Select all that apply)", input_type: "multi", is_required: false, position: 0,
            options: [
              { id: "fopt_feat_color", label: "24/7 Color Night Vision", value: "feat_color", position: 0 },
              { id: "fopt_feat_dual_light", label: "Smart Dual Light (Color on motion)", value: "feat_dual_light", position: 1 },
              { id: "fopt_feat_mic", label: "Microphone", value: "feat_mic", position: 2 },
              { id: "fopt_feat_speaker", label: "Speaker / Two-Way Talk", value: "feat_speaker", position: 3 },
              { id: "fopt_feat_ik10", label: "Hammer-Proof", value: "feat_ik10", position: 4 },
            ]
          }
        ]
      },
      {
        step: { id: "step_wiring", position: 7, title: "Wiring", description: "Is your property already wired for CCTV?", is_active: true },
        questions: [
          {
            id: "q_wiring", question_text: "Select cabling status:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "opt_wired_yes", label: "Yes – Cabling is already done", value: "true", position: 0 },
              { id: "opt_wired_no", label: "No – Full installation required", value: "false", position: 1 },
            ]
          },
          {
            id: "q_wiring_type", question_text: "Type of wiring required:", input_type: "single", is_required: false, position: 1,
            options: [
              { id: "opt_wiring_open", label: "Open Wiring", value: "open", position: 0 },
              { id: "opt_wiring_conduit", label: "Conduit Flat Pipe", value: "conduit", position: 1 },
            ]
          }
        ]
      },
      {
        step: { id: "step_timeline", position: 8, title: "Timeline", description: "How soon do you need this system installed?", is_active: true },
        questions: [
          {
            id: "q_timeline", question_text: "Select urgency:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "fopt_t_asap", label: "ASAP (Today/Tomorrow)", value: "asap", position: 0 },
              { id: "fopt_t_week", label: "Within a week", value: "week", position: 1 },
              { id: "fopt_t_month", label: "Next Month", value: "month", position: 2 },
              { id: "fopt_t_research", label: "Just researching", value: "research", position: 3 },
            ]
          }
        ]
      },
      {
        step: { id: "step_brand", position: 9, title: "Brand", description: "Do you have a specific brand in mind?", is_active: true },
        questions: [
          {
            id: "q_brand", question_text: "Select brand preference:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "fopt_b_rec", label: "Unsure, please recommend the best value", value: "recommend", position: 0 },
              { id: "fopt_b_cp", label: "CP Plus", value: "cpplus", position: 1 },
              { id: "fopt_b_hik", label: "Hikvision", value: "hikvision", position: 2 },
              { id: "fopt_b_dah", label: "Dahua", value: "dahua", position: 3 },
            ]
          }
        ]
      },
      {
        step: { id: "step_amc", position: 10, title: "Maintenance", description: "Would you like an Annual Maintenance Contract (AMC)?", is_active: true },
        questions: [
          {
            id: "q_amc", question_text: "Select AMC option:", input_type: "single", is_required: true, position: 0,
            options: [
              { id: "fopt_amc_yes", label: "Yes, protect my system", value: "true", position: 0 },
              { id: "fopt_amc_no", label: "No, I'll manage it myself", value: "false", position: 1 },
            ]
          }
        ]
      }
    ];

    for (const entry of seedData) {
      const stepRef = adminDb.collection("wizard_steps").doc(entry.step.id);
      await stepRef.set({
        title: entry.step.title,
        description: entry.step.description,
        position: entry.step.position,
        is_active: entry.step.is_active,
        created_at: new Date(),
        updated_at: new Date(),
      });

      for (const q of entry.questions) {
        const qRef = stepRef.collection("questions").doc(q.id);
        await qRef.set({
          question_text: q.question_text,
          input_type: q.input_type,
          is_required: q.is_required,
          position: q.position,
        });

        for (const opt of q.options) {
          await qRef.collection("options").doc(opt.id).set({
            label: opt.label,
            value: opt.value,
            position: opt.position,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Wizard template seeded successfully. 11 steps, 11 questions created.",
      steps: seedData.map(e => ({ id: e.step.id, title: e.step.title }))
    });
  } catch (error) {
    const err = error as Error;
    console.error("Wizard seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
