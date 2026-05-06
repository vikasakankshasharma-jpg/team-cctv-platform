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
      } as unknown as WizardStep;
    });

    let wizardSteps = await Promise.all(stepPromises);

    // --- INJECT DYNAMIC RESOLUTION STEP ---
    const camerasSnapshot = await adminDb
      .collection("products")
      .where("category", "==", "camera")
      .where("is_active", "==", true)
      .get();
      
    const availableResolutions = new Set<number>();
    camerasSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.resolution_mp) {
        availableResolutions.add(data.resolution_mp);
      }
    });
    
    // Sort ascending
    const sortedResolutions = Array.from(availableResolutions).sort((a, b) => a - b);
    
    // Only inject if we have resolutions and the step doesn't already exist
    const hasResolutionStep = wizardSteps.some(s => 
      s.questions?.some(q => q.id === "q_resolution")
    );

    if (sortedResolutions.length > 0 && !hasResolutionStep) {
      const resOptions: WizardOption[] = [];
      const resLabels: Record<number, string> = {
        2: "2MP Standard HD — Good for most homes",
        4: "4MP Pro HD — Clearer faces & number plates",
        5: "5MP Ultra HD — Crisp detail, night color",
        6: "6MP Premium — Large premises & retail",
        8: "8MP Professional Grade — Banks & factories"
      };
      
      sortedResolutions.forEach((mp, index) => {
        resOptions.push({
          id: `opt_res_${mp}mp`,
          label: resLabels[mp] || `${mp}MP Camera`,
          value: `${mp}mp`,
          position: index
        });
      });

      const resolutionStep: WizardStep = {
        id: "dynamic_step_resolution",
        title: "Camera Quality",
        description: "What image quality do you need?",
        position: 11, // Insert after Property Type
        is_active: true,
        created_at: new Date().toISOString(),
        questions: [
          {
            id: "q_resolution",
            question_text: "Select resolution:",
            input_type: "single",
            is_required: true,
            position: 0,
            options: resOptions
          }
        ]
      };

      // Increment positions for subsequent steps to maintain order
      wizardSteps = wizardSteps.map(step => {
        if (step.position >= 1) {
          return { ...step, position: step.position + 1 };
        }
        return step;
      });

      // Insert and re-sort
      wizardSteps.push(resolutionStep);
      wizardSteps.sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    // --- END DYNAMIC RESOLUTION STEP ---

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
      title: "Property Type",
      description: "What type of property are you securing?",
      position: 0,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_prop_type",
          question_text: "Select property type:",
          position: 0,
          input_type: "single",
          is_required: true,
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
      id: "fallback_step_res",
      title: "Camera Quality",
      description: "What image quality do you need?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_resolution",
          question_text: "Select resolution:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "opt_res_2mp", label: "2MP Standard HD — Good for most homes", value: "2mp", position: 0 },
            { id: "opt_res_4mp", label: "4MP Pro HD — Clearer faces & number plates", value: "4mp", position: 1 },
            { id: "opt_res_5mp", label: "5MP Ultra HD — Crisp detail, night color", value: "5mp", position: 2 },
          ]
        }
      ]
    },
    {
      id: "fallback_step2",
      title: "Mounting Surface",
      description: "What type of surfaces will the cameras be mounted on?",
      position: 11,
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
      id: "fallback_step3",
      title: "Ceiling Height",
      description: "How high are your ceilings where cameras will be mounted?",
      position: 11,
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
        }
      ]
    },
    {
      id: "fallback_step4",
      title: "Camera Count",
      description: "How many cameras do you need?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_cam_count",
          question_text: "Enter number of cameras:",
          position: 0,
          input_type: "number",
          is_required: true,
          options: []
        }
      ]
    },
    {
      id: "fallback_step5",
      title: "Technology",
      description: "Which camera technology do you prefer?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_tech",
          question_text: "Select technology:",
          position: 0,
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
      id: "fallback_step6",
      title: "Storage",
      description: "How far back do you need to be able to watch old recordings?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_storage",
          question_text: "Select recording duration:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_s_7", label: "1 Week (Standard)", value: "7", position: 0 },
            { id: "fopt_s_15", label: "15 Days", value: "15", position: 1 },
            { id: "fopt_s_30", label: "1 Month", value: "30", position: 2 },
            { id: "fopt_s_90", label: "3 Months", value: "90", position: 3 },
          ]
        }
      ]
    },
    {
      id: "fallback_step7",
      title: "Features",
      description: "Customize your recording capabilities.",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_features",
          question_text: "Which special features do you need? (Select all that apply)",
          position: 0,
          input_type: "multi",
          is_required: false,
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
      id: "fallback_step8",
      title: "Wiring",
      description: "Is your property already wired for CCTV?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_wiring",
          question_text: "Select cabling status:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_wired_yes", label: "Yes – Cabling is already done",    value: "true",  position: 0 },
            { id: "fopt_wired_no",  label: "No – Full installation required",  value: "false", position: 1 },
          ]
        }
      ]
    },
    {
      id: "fallback_step9",
      title: "Timeline",
      description: "How soon do you need this system installed?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_timeline",
          question_text: "Select urgency:",
          position: 0,
          input_type: "single",
          is_required: true,
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
      id: "fallback_step10",
      title: "Brand",
      description: "Do you have a specific brand in mind?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_brand",
          question_text: "Select brand preference:",
          position: 0,
          input_type: "single",
          is_required: true,
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
      id: "fallback_step11",
      title: "Maintenance",
      description: "Would you like an Annual Maintenance Contract (AMC)?",
      position: 11,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_amc",
          question_text: "Select AMC option:",
          position: 0,
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

