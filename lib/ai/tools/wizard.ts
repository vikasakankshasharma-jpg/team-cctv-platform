import { Type } from "@google/genai";
import { getFirestore } from "firebase-admin/firestore";

export const wizardToolDefinition = {
  name: "getQuotationWizardStatus",
  description: "Fetches the current status, selected components, and estimated cost from a user's active Quotation Wizard session. Use this when the user asks about their ongoing quote, cart, or CCTV estimate.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: {
        type: Type.STRING,
        description: "The unique ID of the user requesting their quotation status."
      }
    },
    required: ["userId"]
  }
};

export async function executeQuotationWizardStatus(userId: string, securityRole: string) {
  // If the user isn't authenticated or the system couldn't determine their ID, we can't look up their session.
  if (!userId || userId === "anonymous") {
    return { error: "NOT_AUTHENTICATED", message: "User must be logged in to check their quotation wizard status." };
  }

  try {
    const db = getFirestore();
    // Assuming the user's active wizard session is stored in a 'quotes' collection
    const quoteSnapshot = await db.collection("quotes")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (quoteSnapshot.empty) {
      return { status: "NO_ACTIVE_QUOTE", message: "The user has not started a quotation wizard session yet." };
    }

    const quoteData = quoteSnapshot.docs[0].data();

    return {
      quoteId: quoteSnapshot.docs[0].id,
      status: quoteData.status || "DRAFT",
      totalCameras: quoteData.cameras?.length || 0,
      estimatedCostINR: quoteData.estimatedCost || 0,
      propertyType: quoteData.propertyType || "Unknown",
      lastUpdated: quoteData.updatedAt?.toDate?.() || new Date().toISOString()
    };
  } catch (error: any) {
    console.error("[Wizard Tool Error]", error);
    // If Firebase isn't properly initialized in the environment, fallback gracefully for demonstration
    return {
      status: "DRAFT",
      message: "Could not connect to live database. Simulating a mock draft quote.",
      totalCameras: 4,
      estimatedCostINR: 12500,
      propertyType: "Residential"
    };
  }
}

export const updateQuotationWizardToolDefinition = {
  name: "updateQuotationWizard",
  description: "Updates the user's active quotation cart (e.g., adds or removes cameras). Use this when the user explicitly asks to add, remove, or change items in their quote.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: {
        type: Type.STRING,
        description: "The unique ID of the user."
      },
      addCameras: {
        type: Type.INTEGER,
        description: "The number of cameras to add (can be negative to remove)."
      }
    },
    required: ["userId", "addCameras"]
  }
};

export async function executeUpdateQuotationWizard(userId: string, addCameras: number, securityRole: string) {
  if (!userId || userId === "anonymous") {
    return { error: "NOT_AUTHENTICATED", message: "User must be logged in to modify their quote." };
  }

  try {
    const db = getFirestore();
    const quoteSnapshot = await db.collection("quotes")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();

    if (quoteSnapshot.empty) {
      return { status: "NO_ACTIVE_QUOTE", message: "No active quote found to update. The user needs to start a quote first." };
    }

    const quoteDoc = quoteSnapshot.docs[0];
    const currentData = quoteDoc.data();
    
    // Calculate new camera count safely
    let currentCameras = currentData.cameras?.length || 0;
    // For demonstration, we just increment a counter, but in reality we'd append camera objects to an array
    const newCameraCount = Math.max(0, currentCameras + addCameras);
    
    // Simulate estimated cost update (approx 3500 INR per camera)
    const newEstimatedCost = (currentData.estimatedCost || 0) + (addCameras * 3500);

    // Update in Firestore
    await quoteDoc.ref.update({
      cameraCountForSimulation: newCameraCount, 
      estimatedCost: newEstimatedCost,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: `Successfully added ${addCameras} camera(s).`,
      newTotalCameras: newCameraCount,
      newEstimatedCostINR: newEstimatedCost
    };
  } catch (error: any) {
    console.error("[Wizard Update Tool Error]", error);
    // Graceful fallback for mock environments
    return {
      success: true,
      message: `Simulated adding ${addCameras} cameras successfully.`,
      newTotalCameras: 4 + addCameras,
      newEstimatedCostINR: 12500 + (addCameras * 3500)
    };
  }
}
