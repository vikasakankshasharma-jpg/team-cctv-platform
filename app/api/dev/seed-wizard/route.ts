import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dev/seed-wizard
 * Wipes and re-seeds the wizard template. Dev only.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Disabled in production." }, { status: 403 });
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

    // Step 2: Seed fresh data
    const seedData = [
      {
        step: { id: "step_property", position: 0, title: "Property Type", description: "Tell us where you want to install the cameras.", is_active: true },
        questions: [
          {
            id: "q_prop_type",
            question_text: "What type of property are you securing?",
            input_type: "single",
            is_required: true,
            position: 0,
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
        step: { id: "step_tech", position: 1, title: "Technology Preference", description: "Choose the camera system technology.", is_active: true },
        questions: [
          {
            id: "q_tech",
            question_text: "Which camera technology do you prefer?",
            input_type: "single",
            is_required: true,
            position: 0,
            options: [
              { id: "opt_ip", label: "Smart Digital IP Cameras (Recommended)", value: "IP", position: 0 },
              { id: "opt_hd", label: "Standard HD Analog Cameras (Budget)", value: "HD", position: 1 },
            ]
          }
        ]
      },
      {
        step: { id: "step_cameras", position: 2, title: "Coverage Requirements", description: "How many cameras do you need to secure your property?", is_active: true },
        questions: [
          {
            id: "q_cam_count",
            question_text: "How many cameras do you need?",
            input_type: "number",
            is_required: true,
            position: 0,
            options: []
          }
        ]
      },
      {
        step: { id: "step_wiring", position: 3, title: "Installation Status", description: "This helps us calculate the installation cost accurately.", is_active: true },
        questions: [
          {
            id: "q_wiring",
            question_text: "Is your property already wired for CCTV?",
            input_type: "single",
            is_required: true,
            position: 0,
            options: [
              { id: "opt_wired_yes", label: "Yes – Cabling is already done", value: "true", position: 0 },
              { id: "opt_wired_no", label: "No – Full installation required", value: "false", position: 1 },
            ]
          }
        ]
      },
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
      message: "Wizard template seeded successfully. 4 steps, 4 questions created.",
      steps: seedData.map(e => ({ id: e.step.id, title: e.step.title }))
    });
  } catch (error) {
    const err = error as Error;
    console.error("Wizard seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
