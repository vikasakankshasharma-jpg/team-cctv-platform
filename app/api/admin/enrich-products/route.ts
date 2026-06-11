import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { requireAdmin } from "@/lib/auth-server";

const ai = new GoogleGenAI({});

// ─── Types ──────────────────────────────────────────────────────────────────

interface EnrichRequest {
  product_ids: string[];
  category: "cctv_camera" | "recorder";
}

export interface EnrichedField {
  key: string;
  label: string;
  current: string | number | null;
  proposed: string | number | null;
  confidence: "high" | "medium" | "low";
}

export interface EnrichmentRow {
  product_id: string;
  display_name: string;
  technical_name?: string;
  fields: EnrichedField[];
}

// ─── Gemini AI Extractor ─────────────────────────────────────────────────────

async function extractCameraSpecs(products: any[]): Promise<Record<string, any>> {
  const productList = products.map(p => ({
    id: p.id,
    display_name: p.display_name || "",
    technical_name: p.technical_name || "",
  }));

  const prompt = `You are a CCTV product specification expert. Extract technical specs from product names.

For each product below, extract these fields. Return null if you cannot determine the value with confidence.

Products:
${JSON.stringify(productList, null, 2)}

Return a JSON object where keys are product IDs and values are extracted specs:
{
  "PRODUCT_ID": {
    "resolution_mp": <number: 2/4/5/8/12, null if unknown>,
    "night_vision_type": <"ir" | "color" | "dual_light" | "starlight" | null>,
    "form_factor": <"bullet" | "dome" | "ptz" | "turret" | "fisheye" | "box" | null>,
    "ip_rating": <"IP66" | "IP67" | "IP68" | "IP65" | null>,
    "lens_mm": <number: 2.8/3.6/4.0/6.0/etc, null if unknown>,
    "has_audio": <true | false | null>,
    "camera_model": <string: model number from technical_name, null if same as display_name>,
    "max_resolution_label": <"1080p" | "4MP" | "5MP" | "4K" | "8MP" | null>,
    "confidence": <"high" | "medium" | "low">
  }
}

Rules:
- "Color" in name → night_vision_type = "color" 
- "IR" or no night vision mention → night_vision_type = "ir" (most common default)
- "Dual Light" → night_vision_type = "dual_light"
- "Starlight" → night_vision_type = "starlight"  
- "Bullet" in name → form_factor = "bullet"
- "Dome" → form_factor = "dome"
- "PTZ" → form_factor = "ptz"
- "Turret" → form_factor = "turret"
- Resolution: "2MP"=2, "4MP"=4, "5MP"=5, "8MP"=8, "2K"=4, "4K"=8, "1080P"=2
- Outdoor cameras are typically IP66
- confidence: "high" if 3+ fields determinable, "medium" if 1-2, "low" if only 0-1

Return ONLY valid JSON. No explanation text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    const raw = response.text?.trim() || "{}";
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function extractRecorderSpecs(products: any[]): Promise<Record<string, any>> {
  const productList = products.map(p => ({
    id: p.id,
    display_name: p.display_name || "",
    technical_name: p.technical_name || "",
  }));

  const prompt = `You are a CCTV recorder specification expert. Extract technical specs from product names.

Products:
${JSON.stringify(productList, null, 2)}

Return a JSON object where keys are product IDs and values are extracted specs:
{
  "PRODUCT_ID": {
    "recorder_type": <"DVR" | "NVR" | "XVR" | "HVR" | null>,
    "channels": <number: 4/8/16/32/64, null if unknown>,
    "compression": <"H.265+" | "H.265" | "H.264" | null>,
    "max_resolution_rec": <"4K" | "5MP" | "1080p" | "4MP" | null>,
    "hdd_slots": <number: 1/2/4/8, null if unknown>,
    "recorder_model": <string: model number from technical_name, null if empty>,
    "has_audio": <true | false | null>,
    "confidence": <"high" | "medium" | "low">
  }
}

Rules:
- "NVR" in name → recorder_type = "NVR" (IP cameras)
- "DVR" or "AHD" or "TVI" or "CVI" → recorder_type = "DVR" (HD cameras)
- "XVR" or "Penta" or "5-in-1" → recorder_type = "XVR"
- Channel count: look for "04CH", "08CH", "16CH", "4 CH", "8-Channel" etc. → number
- "H.265+" or "H265+" → compression = "H.265+"
- "H.265" without plus → compression = "H.265"
- "H.264" → compression = "H.264"
- hdd_slots: "1 SATA" = 1, "2 SATA" = 2, "4 SATA" = 4
- confidence: "high" if recorder_type + channels both determinable

Return ONLY valid JSON. No explanation text.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  try {
    const raw = response.text?.trim() || "{}";
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

// ─── Build enrichment rows ────────────────────────────────────────────────────

function buildCameraRows(products: any[], aiResults: Record<string, any>): EnrichmentRow[] {
  return products.map(p => {
    const ai = aiResults[p.id] || {};
    const fields: EnrichedField[] = [
      {
        key: "camera_model",
        label: "Camera Model",
        current: p.camera_model || p.technical_name || null,
        proposed: ai.camera_model || p.technical_name || null,
        confidence: ai.confidence || "low",
      },
      {
        key: "resolution_mp",
        label: "Resolution (MP)",
        current: p.resolution_mp ?? null,
        proposed: ai.resolution_mp ?? null,
        confidence: ai.resolution_mp != null ? (ai.confidence || "medium") : "low",
      },
      {
        key: "night_vision_type",
        label: "Night Vision",
        current: p.night_vision_type || null,
        proposed: ai.night_vision_type || null,
        confidence: ai.night_vision_type ? (ai.confidence || "medium") : "low",
      },
      {
        key: "form_factor",
        label: "Form Factor",
        current: p.form_factor || null,
        proposed: ai.form_factor || null,
        confidence: ai.form_factor ? (ai.confidence || "medium") : "low",
      },
      {
        key: "ip_rating",
        label: "IP Rating",
        current: p.ip_rating || null,
        proposed: ai.ip_rating || null,
        confidence: ai.ip_rating ? "medium" : "low",
      },
      {
        key: "lens_mm",
        label: "Lens (mm)",
        current: p.lens_mm ?? null,
        proposed: ai.lens_mm ?? null,
        confidence: ai.lens_mm != null ? "medium" : "low",
      },
      {
        key: "has_audio",
        label: "Built-in Audio",
        current: p.features?.includes("mic") || p.features?.includes("audio") ? true : (p.has_audio ?? null),
        proposed: ai.has_audio ?? null,
        confidence: ai.has_audio != null ? "medium" : "low",
      },
    ].filter(f => f.proposed !== null && f.proposed !== f.current);

    return {
      product_id: p.id,
      display_name: p.display_name,
      technical_name: p.technical_name,
      fields,
    };
  }).filter(r => r.fields.length > 0);
}

function buildRecorderRows(products: any[], aiResults: Record<string, any>): EnrichmentRow[] {
  return products.map(p => {
    const ai = aiResults[p.id] || {};
    const fields: EnrichedField[] = [
      {
        key: "recorder_model",
        label: "Recorder Model",
        current: p.recorder_model || p.technical_name || null,
        proposed: ai.recorder_model || p.technical_name || null,
        confidence: ai.confidence || "low",
      },
      {
        key: "recorder_type",
        label: "Type (DVR/NVR)",
        current: p.recorder_type || null,
        proposed: ai.recorder_type || null,
        confidence: ai.recorder_type ? "high" : "low",
      },
      {
        key: "channels",
        label: "Channels",
        current: p.channels ?? null,
        proposed: ai.channels ?? null,
        confidence: ai.channels != null ? "high" : "low",
      },
      {
        key: "compression",
        label: "Compression",
        current: p.compression || null,
        proposed: ai.compression || null,
        confidence: ai.compression ? "high" : "low",
      },
      {
        key: "max_resolution_rec",
        label: "Max Resolution",
        current: p.max_resolution_rec || null,
        proposed: ai.max_resolution_rec || null,
        confidence: ai.max_resolution_rec ? "medium" : "low",
      },
      {
        key: "hdd_slots",
        label: "HDD Slots",
        current: p.hdd_slots ?? null,
        proposed: ai.hdd_slots ?? null,
        confidence: ai.hdd_slots != null ? "high" : "low",
      },
    ].filter(f => f.proposed !== null && f.proposed !== f.current);

    return {
      product_id: p.id,
      display_name: p.display_name,
      technical_name: p.technical_name,
      fields,
    };
  }).filter(r => r.fields.length > 0);
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body: EnrichRequest = await req.json();
    const { product_ids, category } = body;

    if (!product_ids?.length || !category) {
      return NextResponse.json({ error: "product_ids and category are required" }, { status: 400 });
    }

    // Fetch products from Firestore in batches of 10 (Firestore 'in' limit)
    const allProducts: any[] = [];
    const batches: string[][] = [];
    for (let i = 0; i < product_ids.length; i += 10) {
      batches.push(product_ids.slice(i, i + 10));
    }
    for (const batch of batches) {
      const snap = await adminDb.collection("products").where("__name__", "in", batch).get();
      snap.docs.forEach(d => allProducts.push({ id: d.id, ...d.data() }));
    }

    if (allProducts.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    // Run AI in batches of 20 to stay within token limits
    const BATCH_SIZE = 20;
    let allAiResults: Record<string, any> = {};

    for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
      const batchProducts = allProducts.slice(i, i + BATCH_SIZE);
      const results = category === "cctv_camera"
        ? await extractCameraSpecs(batchProducts)
        : await extractRecorderSpecs(batchProducts);
      allAiResults = { ...allAiResults, ...results };
    }

    const rows = category === "cctv_camera"
      ? buildCameraRows(allProducts, allAiResults)
      : buildRecorderRows(allProducts, allAiResults);

    return NextResponse.json({ rows, total_analyzed: allProducts.length });
  } catch (error: any) {
    console.error("Enrich products error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze products" }, { status: 500 });
  }
}

// Apply approved enrichments to Firestore
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body: { approvals: { product_id: string; fields: Record<string, any> }[] } = await req.json();
    const { approvals } = body;

    if (!approvals?.length) {
      return NextResponse.json({ error: "No approvals provided" }, { status: 400 });
    }

    const batch = adminDb.batch();
    let updatedCount = 0;

    for (const approval of approvals) {
      if (!approval.product_id || !approval.fields || Object.keys(approval.fields).length === 0) continue;
      const ref = adminDb.collection("products").doc(approval.product_id);
      batch.update(ref, {
        ...approval.fields,
        updated_at: new Date().toISOString(),
        enriched_by_ai: true,
        enriched_at: new Date().toISOString(),
      });
      updatedCount++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      updated: updatedCount,
      message: `Updated ${updatedCount} products successfully.`,
    });
  } catch (error: any) {
    console.error("Apply enrichment error:", error);
    return NextResponse.json({ error: error.message || "Failed to apply enrichments" }, { status: 500 });
  }
}
