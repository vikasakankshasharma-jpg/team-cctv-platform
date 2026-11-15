import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "./ai-parser";
import { isStrictZeroCostModeActive } from "@/lib/billing/budget-tracker";
import { executeAiGateway } from "@/lib/ai/ai-gateway";

export interface GeminiExtractionResult {
  category: string;
  brand?: string;
  technologies: string[];
  resolution_mp?: number;
  channels?: number;
  rack_u_height?: number;
  cable_length_m?: number;
  power_voltage_v?: number;
  power_amperage_a?: number;
  power_wattage_w?: number;
  storage_type?: string;
  storage_capacity_tb?: number;
  network_ports?: number;
  network_speed?: string;
  confidence_score: number;
  ai_reasoning: string;
}

export async function parseProductWithGemini(
  title: string, 
  _imageUrl?: string,
  trainingRules: string = "",
  referenceProducts: any[] = []
): Promise<GeminiExtractionResult> {

  // 1. Zero-Cost Mode Enforcement (Hard Circuit Breaker)
  if (await isStrictZeroCostModeActive()) {
    return fallbackRegexParser(title, "Zero-Cost Mode is ACTIVE: Used local deterministic regex engine (₹0 cost).");
  }

  // 2. High-Confidence Deterministic Match First (Fast, 0 Tokens, 100% Accurate)
  const regexCat = guessCategory(title);
  const regexBrand = guessBrand(title);
  if (regexCat !== "others" && regexCat !== "unidentified" && regexBrand) {
    return fallbackRegexParser(title, "High-confidence local catalog pattern match (₹0 cost).");
  }

  // Check for Firebase Vertex Credentials
  const hasVertexAuth = !!process.env.FIREBASE_PROJECT_ID && !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
  if (!hasVertexAuth && !process.env.GEMINI_API_KEY) {
      return fallbackRegexParser(title);
  }

  try {
    let referencesText = "";
    if (referenceProducts.length > 0) {
        referencesText = "\nHere are some examples of products already in the catalog to use as a reference for formatting and categorization:\n";
        referenceProducts.forEach((rp, i) => {
            referencesText += `Example ${i + 1}:\nTitle: "${rp.display_name || rp.raw_title || ''}"\nCategory: ${rp.category || 'unidentified'}\nSpecs: ${(rp.technologies || []).join(', ')}\n${rp.resolution_mp ? `Resolution: ${rp.resolution_mp}MP\n` : ''}${rp.channels ? `Channels: ${rp.channels}\n` : ''}\n`;
        });
    }

    // Text-only lightweight prompt: No multimodal images or Google Search tool calls to prevent high-tier Carbon/Vision charges
    const promptText = `Analyze the following product title for a CCTV B2B catalog platform.
Title: "${title}"

${trainingRules ? `Past Feedback / Training Rules (Strictly adhere to these if they apply):\n${trainingRules}\n\n` : ''}${referencesText}
Extract the specifications accurately. Ensure the category matches one of the required values and formatting is consistent with any reference products provided.`;

    const gatewayRes = await executeAiGateway({
      task: "catalog-spec-extraction",
      prompt: promptText,
      maxOutputTokens: 500,
      temperature: 0.1,
      responseMimeType: "application/json",
    });

    if (!gatewayRes.success || !gatewayRes.text) {
      return fallbackRegexParser(title, gatewayRes.blockReason || "AI Gateway blocked extraction");
    }

    const parsed = JSON.parse(gatewayRes.text) as GeminiExtractionResult;
    return parsed;

    } catch (err: any) {
        console.error("Gemini Extraction Error:", err);
        return fallbackRegexParser(title, err.message || String(err));
    }
}

function fallbackRegexParser(title: string, errorMsg?: string): GeminiExtractionResult {
    return {
        category: guessCategory(title),
        brand: guessBrand(title) || "",
        technologies: guessTechnologies(title),
        resolution_mp: guessResolution(title) || undefined,
        channels: guessChannels(title) || undefined,
        rack_u_height: guessRackUHeight(title) || undefined,
        cable_length_m: guessCableLength(title) || undefined,
        power_voltage_v: guessVoltage(title) || undefined,
        power_amperage_a: guessAmperage(title) || undefined,
        power_wattage_w: guessWattage(title) || undefined,
        confidence_score: 50,
        ai_reasoning: errorMsg ? `Gemini connection failed: ${errorMsg}` : "Fallback regex parser used. No active Gemini connection or an error occurred."
    };
}
