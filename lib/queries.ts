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

    // Deduplicate steps by title to prevent rendering duplicates if DB is messy
    const uniqueStepsMap = new Map();
    stepsSnapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const title = (data.title || "").trim().toLowerCase();
      if (title && !uniqueStepsMap.has(title)) {
        uniqueStepsMap.set(title, doc);
      } else if (!title) {
        uniqueStepsMap.set(doc.id, doc);
      }
    });

    const sortedDocs = Array.from(uniqueStepsMap.values()).sort((a, b) => 
      (a.data().position || 0) - (b.data().position || 0)
    );

    const stepPromises = sortedDocs.map(async (stepDoc) => {
      const stepId = stepDoc.id;

      const questionsSnapshot = await stepDoc.ref
        .collection("questions")
        .orderBy("position", "asc")
        .get();

      // Deduplicate questions by text
      const uniqueQMap = new Map();
      questionsSnapshot.docs.forEach((doc: any) => {
        const qData = doc.data();
        const qText = (qData.question_text || "").trim().toLowerCase();
        if (qText && !uniqueQMap.has(qText)) {
          uniqueQMap.set(qText, doc);
        } else if (!qText) {
          uniqueQMap.set(doc.id, doc);
        }
      });

      const questionsPromises = Array.from(uniqueQMap.values()).map(async (qDoc) => {
        const qData = qDoc.data();
        
        const optionsSnapshot = await qDoc.ref
          .collection("options")
          .orderBy("position", "asc")
          .get();

        // Deduplicate options by value (semantic meaning) instead of just label text
        const uniqueOptMap = new Map();
        optionsSnapshot.docs.forEach((doc: any) => {
          const oData = doc.data();
          let oValue = (oData.value || "").trim().toLowerCase();
          
          // Normalize overlapping tech values to ensure they merge
          if (oValue === "hd") oValue = "analog";
          if (oValue === "wireless") oValue = "wifi";

          const oLabel = (oData.label || "").trim().toLowerCase();
          
          const dedupKey = oValue || oLabel;
          
          if (dedupKey && !uniqueOptMap.has(dedupKey)) {
            uniqueOptMap.set(dedupKey, doc);
          } else if (!dedupKey) {
            uniqueOptMap.set(doc.id, doc);
          }
        });

        const options = Array.from(uniqueOptMap.values()).map(optDoc => ({
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

    const wizardSteps = await Promise.all(stepPromises);

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

    if (!hasResolutionStep) {
      const resOptions: WizardOption[] = [];
      const resLabels: Record<number, string> = {
        2: "2MP Standard HD",
        4: "4MP Pro HD",
        5: "5MP Ultra HD",
        6: "6MP Premium",
        8: "8MP Professional Grade"
      };
      
      const targetResolutions = sortedResolutions.length > 0 ? sortedResolutions : [2, 4, 6];

      targetResolutions.forEach((mp, index) => {
        resOptions.push({
          id: `opt_res_${mp}mp`,
          label: resLabels[mp] || `${mp}MP Camera`,
          value: `${mp}mp`,
          position: index
        });
      });

      // Insert resolution step immediately after technology step
      const techStep = wizardSteps.find(s => s.id === "step_technology");
      const techPos = techStep?.position ?? 2;

      const resolutionStep: WizardStep = {
        id: "dynamic_step_resolution",
        title: "Image Resolution",
        description: "What image quality do you need?",
        position: techPos + 0.5, // Will be normalized by sorting below
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

      wizardSteps.push(resolutionStep);
    }
    
    // Sort and normalize positions so they are clean sequential integers
    wizardSteps.sort((a, b) => (a.position || 0) - (b.position || 0));
    wizardSteps.forEach((step, idx) => {
      step.position = idx;
    });

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
      position: 0,
      is_active: true,
      created_at: null,
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
    {
      id: "step_install_type",
      title: "Setup Type",
      description: "Is this a brand new installation or an upgrade?",
      position: 1,
      is_active: true,
      created_at: null,
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
    {
      id: "step_cam_count",
      title: "Camera Count",
      description: "How many cameras do you need?",
      position: 4,
      is_active: true,
      created_at: null,
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
    {
      id: "step_technology",
      title: "Camera Technology",
      description: "What level of quality and features do you expect?",
      position: 2,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_tech",
          question_text: "Select security level:",
          input_type: "single",
          is_required: true,
          position: 0,
          options: [
            { id: "fopt_ip", label: "IP Network Camera (Premium Digital Quality & Smart AI)", value: "IP", position: 0 },
            { id: "fopt_hd", label: "HD Analog Camera (Cost-effective & Reliable)",   value: "Analog", position: 1 },
            { id: "opt_wifi", label: "Wireless Camera (WiFi enabled, minimizes cabling)", value: "WiFi", position: 2 },
            { id: "opt_4g", label: "4G Cellular Camera (For remote areas without internet, requires SIM)", value: "4G", position: 3 },
          ],
        },
      ],
    },
    {
      id: "step_storage",
      title: "Recording Storage",
      description: "How far back do you need to watch old recordings?",
      position: 5,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_storage",
          question_text: "Select recording duration:",
          input_type: "single",
          is_required: true,
          position: 0,
          options: [
            { id: "fopt_s_7",  label: "1 Week (Standard for residential homes)",  value: "7",  position: 0 },
            { id: "fopt_s_15", label: "15 Days (Recommended for small businesses)", value: "15", position: 1 },
            { id: "fopt_s_30", label: "1 Month (Required for strict security compliance)", value: "30", position: 2 },
          ],
        },
      ],
    },
    {
      id: "step_general_addons",
      title: "Accessories",
      description: "Would you like to include any extra accessories?",
      position: 8,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_general_addons",
          question_text: "Select additional hardware (Optional):",
          input_type: "multi",
          is_required: false,
          position: 0,
          options: [
            { id: "aopt_none",    label: "No extra accessories (View feeds on mobile/PC)", value: "none",    position: 0 },
            { id: "aopt_monitor", label: "Dedicated Monitor Display (For constant live viewing)",   value: "monitor", position: 1 },
            { id: "aopt_ups",     label: "Power Backup UPS (Keeps recording during power cuts)", value: "ups", position: 2 },
            { id: "aopt_rack",    label: "Server Rack (Secure, lockable equipment cabinet)", value: "rack", position: 3 },
          ],
        },
      ],
    },

    {
      id: "step_features",
      title: "Special Features",
      description: "Any special camera capabilities required?",
      position: 7,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_features",
          question_text: "Select features (Optional):",
          input_type: "multi",
          is_required: false,
          position: 0,
          options: [
            { id: "opt_feat_none",  label: "None (Standard Features Only)", value: "none", position: 0 },
            { id: "opt_feat_wdr",   label: "WDR (Clear faces against bright doors/windows)", value: "WDR", position: 1 },
            { id: "opt_feat_audio", label: "Built-in Mic (Audio Recording)", value: "Audio", position: 2 },
            { id: "opt_feat_2way",  label: "Two-Way Audio (Mic + Speaker)", value: "Two-Way Audio", position: 3 },
            { id: "opt_feat_colorvu",label: "Color Night Vision (ColorVu)", value: "ColorVu", position: 4 },
            { id: "opt_feat_duallight",label: "Smart Dual Light (Switches to color on motion)", value: "Dual Light", position: 5 },
            { id: "opt_feat_starlight",label: "Starlight Sensor (Excellent in very low light)", value: "Starlight", position: 6 },
            { id: "opt_feat_sdcard", label: "SD Card Storage (Backup recording)", value: "SD Card Slot", position: 7 },
            { id: "opt_feat_ptz",   label: "Pan-Tilt-Zoom (Optical Zoom & Motorized)", value: "PTZ", position: 8 },
            { id: "opt_feat_pt",    label: "Pan-Tilt (Motorized Rotation, No Optical Zoom)", value: "PT", position: 9 },
          ],
        },
      ],
    },
    {
      id: "step_site_overview",
      title: "Site Overview",
      description: "Help our installers prepare for your site.",
      position: 9,
      is_active: true,
      created_at: null,
      questions: [
        {
          id: "q_height",
          question_text: "What is the approximate mounting height?",
          input_type: "single",
          is_required: true,
          position: 0,
          options: [
            { id: "hopt_std",   label: "Standard (Up to 10ft)",        value: "standard",  position: 0 },
            { id: "hopt_high",  label: "High (10ft - 15ft)",           value: "high",      position: 1 },
            { id: "hopt_vhigh", label: "Very High (15ft+)",            value: "very_high", position: 2 },
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
  ];
}

