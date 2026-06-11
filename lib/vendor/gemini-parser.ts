import { VertexAI, SchemaType } from "@google-cloud/vertexai";
import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "./ai-parser";

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

const ProductSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      description: "Must be one of: cctv_camera, recorder, storage, connector, cable, power_device, display, camera_mount, rack, network, hdmi_cable, accessories, others, unidentified",
    },
    brand: {
      type: SchemaType.STRING,
      description: "The brand of the product (e.g. Dahua, Hikvision, CP Plus). Return empty string if unknown.",
    },
    technologies: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Array of specifications e.g. ['H.265', 'PoE', 'WDR', 'LED', 'IR']",
    },
    resolution_mp: { type: SchemaType.NUMBER, description: "Megapixel resolution (e.g. 2, 4, 8) if applicable." },
    channels: { type: SchemaType.NUMBER, description: "Number of channels (e.g. 4, 8, 16) if recorder." },
    rack_u_height: { type: SchemaType.NUMBER, description: "U-height (e.g. 4, 6, 9) if rack." },
    cable_length_m: { type: SchemaType.NUMBER, description: "Length in meters (e.g. 90, 305) if cable." },
    power_voltage_v: { type: SchemaType.NUMBER, description: "Output voltage (e.g. 12, 19, 24) if power device." },
    power_amperage_a: { type: SchemaType.NUMBER, description: "Amperage (e.g. 1.7, 5, 10) if power device." },
    power_wattage_w: { type: SchemaType.NUMBER, description: "Wattage (e.g. 60, 120) if power device." },
    storage_type: { type: SchemaType.STRING, description: "Storage drive type (e.g. HDD, SSD, MicroSD) if storage." },
    storage_capacity_tb: { type: SchemaType.NUMBER, description: "Storage capacity in TB (e.g. 1, 2, 4) if storage." },
    network_ports: { type: SchemaType.NUMBER, description: "Number of network ports (e.g. 4, 8, 16, 24) if switch/router." },
    network_speed: { type: SchemaType.STRING, description: "Speed of network ports (e.g. 10/100 Mbps, Gigabit) if network." },
    confidence_score: { type: SchemaType.NUMBER, description: "AI confidence score from 0 to 100 based on certainty." },
    ai_reasoning: { type: SchemaType.STRING, description: "Short explanation (max 2 sentences) of how AI reached this conclusion (e.g. 'Identified as dome camera from image, and 12V power supply inferred from model number using web search')." }
  },
  required: ["category", "technologies", "confidence_score", "ai_reasoning"]
};

// Simple fetch to convert image URL to base64 for Gemini
async function fetchImageAsBase64(url: string): Promise<{ mimeType: string, data: string } | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = resp.headers.get('content-type') || 'image/jpeg';
    return {
      mimeType,
      data: buffer.toString('base64')
    };
  } catch (e) {
    return null;
  }
}

export async function parseProductWithGemini(
  title: string, 
  imageUrl?: string,
  trainingRules: string = "",
  referenceProducts: any[] = []
): Promise<GeminiExtractionResult> {

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

    let promptText = `Analyze the following product for a CCTV B2B catalog platform.
Title: "${title}"

${trainingRules ? `Past Feedback / Training Rules (Strictly adhere to these if they apply):\n${trainingRules}\n\n` : ''}${referencesText}
Extract the specifications accurately. Ensure the category matches one of the required values and formatting is consistent with any reference products provided.
IMPORTANT: Please use your Google Search tool to look up the exact model number (if present in the title) to find its official datasheet. Your goal is to fetch the MAXIMUM possible exact specifications (Resolution, Channels, Voltage, Amperage, Wattage, Technologies, etc) to make the product catalog entry highly informative and accurate.`;

    const parts: any[] = [{ text: promptText }];

    // Multimodal support
    if (imageUrl) {
        const imgObj = await fetchImageAsBase64(imageUrl);
        if (imgObj) {
            parts.push({
                inlineData: {
                    mimeType: imgObj.mimeType,
                    data: imgObj.data
                }
            });
        }
    }

    let responseText = "";

    // Prefer Vertex AI over Standard API to utilize Enterprise Credits
    if (hasVertexAuth) {
        const vertex_ai = new VertexAI({
            project: process.env.FIREBASE_PROJECT_ID as string,
            location: 'us-central1',
            googleAuthOptions: {
                credentials: {
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }
            }
        });
        const model = vertex_ai.preview.getGenerativeModel({
            model: 'gemini-2.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: ProductSchema
            }
        });
        const response = await model.generateContent({
            contents: [{ role: 'user', parts: parts }]
        });
        responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
        // Fallback for purely local testing using GEMINI_API_KEY
        // Note: this assumes the fallback handles schema structure similarly.
        return fallbackRegexParser(title, "Standard Gemini API Key fallback has been retired. Please configure Vertex AI credentials.");
    }

    if (!responseText) throw new Error("Empty response from Gemini");
    
    const parsed = JSON.parse(responseText) as GeminiExtractionResult;
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
