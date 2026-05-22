import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SETTINGS_DOC_ID } from "@/lib/constants";
import type { WizardStep, WizardOption } from "@/types";

export async function getSettingsConfig() {
  try {
    const docSnap = await adminDb
      .collection(COLLECTIONS.SETTINGS)
      .doc(SETTINGS_DOC_ID)
      .get();

    if (!docSnap.exists) return null;

    const data = docSnap.data();
    return {
      ...data,
      created_at: data?.created_at?.toDate?.()?.toISOString() || null,
      updated_at: data?.updated_at?.toDate?.()?.toISOString() || null,
    };
  } catch (err) {
    console.error("Error fetching settings:", err);
    return null;
  }
}

export async function getWizardConfig() {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID === "your_project_id_here") {
      return { steps: getDefaultFallbackWizard(), error: "Mock Environment Detected" };
    }

    const stepsSnapshot = await adminDb
      .collection("wizard_steps")
      .where("is_active", "==", true)
      .get();

    if (stepsSnapshot.empty) {
      return { steps: getDefaultFallbackWizard() };
    }

    const sortedDocs = [...stepsSnapshot.docs].sort((a, b) => 
      (a.data().position || 0) - (b.data().position || 0)
    );

    const stepPromises = sortedDocs.map(async (stepDoc) => {
      const stepId = stepDoc.id;

      const questionsSnapshot = await stepDoc.ref
        .collection("questions")
        .orderBy("position", "asc")
        .get();

      const questionsPromises = questionsSnapshot.docs.map(async (qDoc) => {
        const qData = qDoc.data();
        
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
    
    const sortedResolutions = Array.from(availableResolutions).sort((a, b) => a - b);
    
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
        title: "Image Resolution",
        description: "What image quality do you need?",
        position: 11,
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

      wizardSteps = wizardSteps.map(step => {
        if (step.position >= 1) {
          return { ...step, position: step.position + 1 };
        }
        return step;
      });

      wizardSteps.push(resolutionStep);
      wizardSteps.sort((a, b) => (a.position || 0) - (b.position || 0));
    }

    return { steps: wizardSteps };
  } catch (error) {
    const err = error as Error;
    console.error("Wizard SSR Error:", err.message);
    return { steps: getDefaultFallbackWizard(), error: err.message };
  }
}

export function getDefaultFallbackWizard(): WizardStep[] {
  return [
    {
      id: "step_prop_type",
      title: "Property Type",
      description: "What type of property are you securing?",
      position: 1,
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
            { id: "opt_shop", label: "Shop / Retail", value: "shop", position: 1 },
            { id: "opt_office", label: "Office / Commercial", value: "office", position: 2 },
            { id: "opt_factory", label: "Factory / Warehouse", value: "factory", position: 3 },
            { id: "opt_society", label: "Society / Apartment", value: "society", position: 4 },
          ]
        }
      ]
    },
    {
      id: "step_cam_count",
      title: "Camera Count",
      description: "How many cameras do you need?",
      position: 2,
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
      id: "step_placement",
      title: "Camera Placement",
      description: "Where will the cameras be installed?",
      position: 3,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_placement",
          question_text: "Select placement:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "opt_in_out", label: "Mix of Indoor & Outdoor", value: "both", position: 0 },
            { id: "opt_indoor", label: "Mostly Indoor", value: "indoor", position: 1 },
            { id: "opt_outdoor", label: "Mostly Outdoor", value: "outdoor", position: 2 },
          ]
        }
      ]
    },
    {
      id: "step_technology",
      title: "Camera Technology",
      description: "What level of quality and features do you expect?",
      position: 4,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_tech",
          question_text: "Select security level:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "opt_ip", label: "IP Network Camera (Smart Digital)", value: "IP", position: 0 },
            { id: "opt_hd", label: "HD Analog Camera (Basic Budget)", value: "HD", position: 1 },
            { id: "opt_wifi", label: "WiFi Camera (Wireless Smart)", value: "WiFi", position: 2 },
            { id: "opt_4g", label: "4G Sim Camera (No WiFi Needed)", value: "4G", position: 3 },
            { id: "opt_solar", label: "Solar Camera (100% Wire-Free)", value: "Solar", position: 4 },
          ]
        }
      ]
    },
    {
      id: "step_install_type",
      title: "Setup Type",
      description: "Is this a brand new installation or an upgrade?",
      position: 4.5,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_install_type",
          question_text: "Select setup type:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "opt_ins_new", label: "New Installation", value: "new", position: 0 },
            { id: "opt_ins_upg", label: "Upgrade Existing System", value: "upgrade", position: 1 },
          ]
        }
      ]
    },
    {
      id: "step_priorities",
      title: "Top Priorities",
      description: "What are the most important features for you? (Select all that apply)",
      position: 5,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_priorities",
          question_text: "Aapko CCTV se kya chahiye?",
          position: 0,
          input_type: "multi",
          is_required: true,
          options: [
            { id: "basic",       label: "Basic monitoring",           value: "basic",        position: 0, icon: "👁",  tier_hint: "value" },
            { id: "face_id",     label: "Chehra clearly pehchanna",   value: "face_id",      position: 1, icon: "👤",  tier_hint: "professional" },
            { id: "number_plate",label: "Number plate padhna",        value: "number_plate", position: 2, icon: "🚗",  tier_hint: "elite" },
            { id: "large_area",  label: "Bada area cover karna",      value: "large_area",   position: 3, icon: "📡",  tier_hint: "elite" },
            { id: "color_night", label: "Color night vision",         value: "color_night",  position: 4, icon: "🌙",  tier_hint: "professional" },
            { id: "stqc",        label: "STQC / Govt Certified",      value: "stqc",         position: 5, icon: "🏛️",  tier_hint: "elite" },
          ]
        }
      ]
    },
    {
      id: "step_budget",
      title: "Budget Range",
      description: "What is your approximate budget for this project?",
      position: 6,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_budget",
          question_text: "Select budget range:",
          position: 0,
          input_type: "single",
          is_required: false,
          options: [
            { id: "opt_bud_low", label: "Budget Friendly (Value for money)", value: "budget", position: 0 },
            { id: "opt_bud_mid", label: "Standard (Performance balanced)",  value: "standard", position: 1 },
            { id: "opt_bud_high", label: "Premium (Best quality & features)", value: "premium", position: 2 },
          ]
        }
      ]
    },
    {
      id: "step_night_vision",
      title: "Night Vision",
      description: "How important is night-time clarity?",
      position: 7,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_night_vision",
          question_text: "Select night vision preference:",
          position: 0,
          input_type: "single",
          is_required: true,
          options: [
            { id: "nv_color", label: "24/7 Full Color (Smart Dual Light)", value: "color", position: 0 },
            { id: "nv_ir", label: "Standard IR (Black & White at night)", value: "ir", position: 1 },
          ]
        }
      ]
    }
  ];
}
