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
    const stepsSnapshot = await adminDb
      .collection("wizard_steps")
      .where("is_active", "==", true)
      .orderBy("position", "asc")
      .get();

    if (stepsSnapshot.empty) {
      console.warn("⚠️ Wizard Intelligence: No active steps found in Firestore. Triggering emergency fallback.");
      return NextResponse.json({ steps: getDefaultFallbackWizard() });
    }

    // Parallel fetch subcollections for deep hierarchy
    const stepPromises = stepsSnapshot.docs.map(async (stepDoc) => {
      const stepData = stepDoc.data() as Omit<WizardStep, "id" | "questions">;
      const stepId = stepDoc.id;

      // Fetch questions for this step
      const questionsSnapshot = await stepDoc.ref
        .collection("questions")
        .orderBy("position", "asc")
        .get();

      const questionsPromises = questionsSnapshot.docs.map(async (qDoc) => {
        const qData = qDoc.data() as Omit<WizardQuestion, "id" | "options">;
        
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

      return {
        id: stepId,
        ...stepData,
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
 * Emergency Fallback Strategy: Professional CCTV Base blueprint 
 */
function getDefaultFallbackWizard(): WizardStep[] {
  return [
    {
      id: "fallback_step1",
      title: "Property Type",
      description: "Where do you want to install your cameras?",
      position: 0,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_prop_type_f",
          question_text: "Where is the site?",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_home", label: "Home", value: "home", position: 0, pricing_tags: [] },
            { id: "fopt_shop", label: "Shop", value: "shop", position: 1, pricing_tags: [] },
            { id: "fopt_office", label: "Office", value: "office", position: 2, pricing_tags: [] },
            { id: "fopt_factory", label: "Factory / Warehouse", value: "factory", position: 3, pricing_tags: [] },
          ]
        }
      ]
    },
    {
      id: "fallback_step2",
      title: "Property Size",
      description: "How big is the area you want to secure?",
      position: 1,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_prop_size_f",
          question_text: "How much space do we need to cover?",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_small", label: "Small Area", value: "small", position: 0, pricing_tags: [] },
            { id: "fopt_med", label: "Medium Area", value: "medium", position: 1, pricing_tags: [] },
            { id: "fopt_large", label: "Large Area", value: "large", position: 2, pricing_tags: [] },
          ]
        }
      ]
    },
    {
      id: "fallback_step3",
      title: "Technology Type",
      description: "Choose the type of cameras you prefer.",
      position: 2,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_tech_f",
          question_text: "Which technology would you like?",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "fopt_hd", label: "Standard HD Cameras", value: "HD", position: 0, pricing_tags: ["hd_standard"] },
            { id: "fopt_ip", label: "Smart Digital (IP) Cameras", value: "IP", position: 1, pricing_tags: ["ip_pro"] },
          ]
        }
      ]
    }
  ];
}
