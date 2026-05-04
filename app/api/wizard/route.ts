import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { WizardStep, WizardQuestion, WizardOption } from "@/types";

/**
 * GET /api/wizard
 * Fetches the complete multi-layer wizard configuration from Firestore.
 * Strategy: Parallel Orchestration for low-latency retrieval of hierarchical schemas.
 */
export async function GET(request: Request) {
  try {
    // Fast-fail in CI/mock environments to prevent Playwright timeouts
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === "your_project_id_here") {
      console.warn("⚠️ Wizard Intelligence: Mock environment detected. Bypassing Firestore.");
      return NextResponse.json({ 
        steps: getDefaultFallbackWizard(),
        metadata: { source: "fallback_emergency", error: "Mock Environment Detected" }
      });
    }

    const stepsSnapshot = await adminDb
      .collection("wizard_steps")
      .where("is_active", "==", true)
      .get();

    if (stepsSnapshot.empty) {
      console.warn("⚠️ Wizard Intelligence: No active steps found in Firestore. Triggering emergency fallback.");
      return NextResponse.json({ steps: getDefaultFallbackWizard() });
    }

    // Sort steps by position in-memory to bypass index requirements
    const sortedDocs = [...stepsSnapshot.docs].sort((a, b) => 
      (a.data().position || 0) - (b.data().position || 0)
    );

    // Parallel fetch subcollections for deep hierarchy
    const stepPromises = sortedDocs.map(async (stepDoc) => {
      const stepId = stepDoc.id;

      // Fetch questions for this step
      const questionsSnapshot = await stepDoc.ref
        .collection("questions")
        .orderBy("position", "asc")
        .get();

      const questionsPromises = questionsSnapshot.docs.map(async (qDoc) => {
        const qData = qDoc.data();
        
        // Fetch terminal options for this question
        const optionsSnapshot = await qDoc.ref
          .collection("options")
          .orderBy("position", "asc")
          .get();

        const options = optionsSnapshot.docs.map(optDoc => ({
          id: optDoc.id,
          ...optDoc.data()
        })) as WizardOption[];

        return {
          id: qDoc.id,
          ...qData,
          options
        };
      });

      const questions = await Promise.all(questionsPromises);

      const stepData = stepDoc.data();
      const serializedStep = {
        ...stepData,
        created_at: stepData.created_at?.toDate?.()?.toISOString() || null,
        updated_at: stepData.updated_at?.toDate?.()?.toISOString() || null,
      };

      return {
        id: stepId,
        ...serializedStep,
        questions
      };
    });

    const wizardSteps = await Promise.all(stepPromises);

    return NextResponse.json({ 
      steps: wizardSteps,
      metadata: {
        source: "firestore",
        timestamp: new Date().toISOString(),
        count: wizardSteps.length
      }
    });
  } catch (error) {
    const err = error as Error;
    console.error("❌ Critical System Fault in Wizard API:", err.message);
    // Explicitly return the fallback if Firebase connectivity is lost
    return NextResponse.json({ 
      steps: getDefaultFallbackWizard(),
      metadata: {
        source: "fallback_emergency",
        error: err.message
      }
    });
  }
}

/** 
 * Emergency Fallback Strategy: Mirrors the exact seeded wizard template.
 * CRITICAL: Question IDs here MUST match what LeadGate.tsx extracts (q_prop_type, q_tech, q_cam_count, q_wiring).
 */
function getDefaultFallbackWizard(): WizardStep[] {
  return [
    {
      id: "fallback_step1",
      title: "Mounting Surface",
      description: "What type of surfaces will the cameras be mounted on?",
      position: 0,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_surface",
          question_text: "Select all that apply:",
          position: 0,
          input_type: "multi",
          is_required: true,
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
      id: "fallback_step2",
      title: "Ceiling Height",
      description: "How high are your ceilings where cameras will be mounted?",
      position: 1,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_height",
          question_text: "Select the maximum height:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_h_std", label: "Standard (Up to 10 feet)", value: "standard", position: 0 },
            { id: "fopt_h_high", label: "High (11 to 15 feet)", value: "high", position: 1 },
            { id: "fopt_h_vhigh", label: "Very High (Above 15 feet)", value: "very_high", position: 2 },
          ]
        },
        // We will capture ladder arrangement via a follow up UI in the component, or just ask it here.
        // For simplicity in the generic wizard engine, we can ask it if they pick high. The wizard UI doesn't have native conditional rendering yet, so we ask it globally but make it optional, or just assume TEAM brings it.
        // Actually, let's keep it simple: just height. The pricing engine can assume TEAM brings it if height > standard.
      ]
    },
    {
      id: "fallback_step3",
      title: "Camera Count & Tech",
      description: "How many cameras do you need and what type?",
      position: 2,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_cam_count",
          question_text: "How many cameras do you need?",
          position: 0,
          input_type: "number",
          is_required: true,
          options: []
        },
        {
          id: "q_tech",
          question_text: "Which camera technology do you prefer?",
          position: 1,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_ip", label: "Smart Digital IP Cameras (Recommended)", value: "IP", position: 0 },
            { id: "fopt_hd", label: "Standard HD Analog Cameras (Budget)",    value: "HD", position: 1 },
          ]
        }
      ]
    },
    {
      id: "fallback_step4",
      title: "Storage & Features",
      description: "Customize your recording capabilities.",
      position: 3,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_storage",
          question_text: "How far back do you need to be able to watch old recordings?",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_s_7", label: "1 Week (Standard)", value: "7", position: 0 },
            { id: "fopt_s_15", label: "15 Days", value: "15", position: 1 },
            { id: "fopt_s_30", label: "1 Month", value: "30", position: 2 },
            { id: "fopt_s_90", label: "3 Months", value: "90", position: 3 },
          ]
        },
        {
          id: "q_features",
          question_text: "Which special features do you need? (Select all that apply)",
          position: 1,
          input_type: "multi",
          is_required: false,
          options: [
            { id: "fopt_feat_color", label: "24/7 Color Night Vision (See full color even in pitch black)", value: "feat_color", position: 0 },
            { id: "fopt_feat_dual_light", label: "Smart Dual Light - Color Night Vision on Motion (\"Turn On\" Color Night Vision only when someone walks by otherwise in Black & White Vision)", value: "feat_dual_light", position: 1 },
            { id: "fopt_feat_mic", label: "Microphone (Listen to voices and sounds)", value: "feat_mic", position: 2 },
            { id: "fopt_feat_speaker", label: "Speaker / Two-Way Talk (Speak through your phone)", value: "feat_speaker", position: 3 },
            { id: "fopt_feat_ik10", label: "Hammer-Proof (Vandal-resistant casing)", value: "feat_ik10", position: 4 },
          ]
        }
      ]
    },
    {
      id: "fallback_step5",
      title: "Logistics",
      description: "Installation details to finalize your quote.",
      position: 4,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_wiring",
          question_text: "Is your property already wired for CCTV?",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_wired_yes", label: "Yes – Cabling is already done",    value: "true",  position: 0 },
            { id: "fopt_wired_no",  label: "No – Full installation required",  value: "false", position: 1 },
          ]
        },
        {
          id: "q_timeline",
          question_text: "How soon do you need this system installed?",
          position: 1,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_t_asap", label: "ASAP (Today/Tomorrow)", value: "asap", position: 0 },
            { id: "fopt_t_week", label: "Within a week", value: "week", position: 1 },
            { id: "fopt_t_month", label: "Next Month", value: "month", position: 2 },
            { id: "fopt_t_research", label: "Just researching", value: "research", position: 3 },
          ]
        },
        {
          id: "q_brand",
          question_text: "Do you have a specific brand in mind?",
          position: 2,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_b_rec", label: "Unsure, please recommend the best value", value: "recommend", position: 0 },
            { id: "fopt_b_cp", label: "CP Plus", value: "cpplus", position: 1 },
            { id: "fopt_b_hik", label: "Hikvision", value: "hikvision", position: 2 },
            { id: "fopt_b_dah", label: "Dahua", value: "dahua", position: 3 },
          ]
        },
        {
          id: "q_amc",
          question_text: "Would you like an Annual Maintenance Contract (AMC)?",
          position: 3,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_amc_yes", label: "Yes, protect my system", value: "true", position: 0 },
            { id: "fopt_amc_no", label: "No, I'll manage it myself", value: "false", position: 1 },
          ]
        }
      ]
    }
  ];
}

