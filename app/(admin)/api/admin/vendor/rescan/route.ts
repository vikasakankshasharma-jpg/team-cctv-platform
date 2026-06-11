import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseProductWithGemini } from "@/lib/vendor/gemini-parser";
import {
  guessCategory,
  guessBrand,
  guessTechnologies,
  guessResolution,
  guessChannels,
  guessRackUHeight,
  guessCableLength,
  guessVoltage,
  guessAmperage,
  guessWattage,
} from "@/lib/vendor/ai-parser";

export async function POST(request: Request) {
    try {
        const { raw_title, image_url, action = "deep_ai" } = await request.json();
        if (!raw_title) {
            return NextResponse.json({ success: false, error: "Missing raw_title" }, { status: 400 });
        }

        // 1. Fetch live catalog to use as SCHEMA REFERENCES only (not for copying values)
        const liveProductsSnapshot = await adminDb.collection("products").limit(50).get();
        const referenceProducts: any[] = [];

        const titleWords = raw_title
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .split(" ")
            .filter((w: string) => w.length > 2)
            .slice(0, 3);

        liveProductsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.display_name && data.category) {
                const liveTitleLower = data.display_name.toLowerCase();
                if (titleWords.some((w: string) => liveTitleLower.includes(w))) {
                    if (referenceProducts.length < 5) {
                        referenceProducts.push(data);
                    }
                }
            }
        });

        // Fallback: grab first 3 as general format examples
        if (referenceProducts.length === 0) {
            let count = 0;
            liveProductsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.display_name && data.category && count < 3) {
                    referenceProducts.push(data);
                    count++;
                }
            });
        }

        // 2. Fetch Knowledge Base for extra rules
        const specKnowledgeSnapshot = await adminDb.collection("specification_knowledge").get();
        let trainingRules = "";
        specKnowledgeSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.spec_name) {
                trainingRules += `- Recognize "${data.spec_name}" as a valid technology/specification.\n`;
            }
        });

        if (action === "internal_match") {
            // ─────────────────────────────────────────────────────────────────────
            // FAST MATCH — Internal Catalog Match
            //
            // DESIGN PRINCIPLE:
            //   The catalog is a SCHEMA TEACHER, not a value source.
            //   • Use the best-matched catalog product to infer: category, technologies schema.
            //   • Extract ALL actual attribute values (size, resolution, channels, etc.)
            //     from the RAW INPUT TITLE — never copy them from the matched product.
            //
            // WHY: A 24" monitor matched to a 27" catalog entry must still be 24",
            //      because the title says 24". The catalog just taught us "monitors have a size field."
            // ─────────────────────────────────────────────────────────────────────

            // Find the best category-match from catalog
            let bestMatch: any = null;
            let highestScore = 0;

            liveProductsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.display_name && data.category) {
                    const liveTitleLower = data.display_name.toLowerCase();
                    let score = 0;
                    titleWords.forEach((w: string) => {
                        if (liveTitleLower.includes(w)) score++;
                    });
                    if (score > highestScore) {
                        highestScore = score;
                        bestMatch = data;
                    }
                }
            });

            // Always extract values FROM the raw_title (source of truth)
            const rawBrand  = guessBrand(raw_title)  || bestMatch?.brand  || "";
            const rawCategory = bestMatch?.category
                ? (guessCategory(raw_title) !== "others" && guessCategory(raw_title) !== "unidentified"
                    ? guessCategory(raw_title)   // prefer raw-title category if detectable
                    : bestMatch.category)          // fall back to catalog match category
                : guessCategory(raw_title);

            // Technologies: merge catalog schema fields with what we detect in the raw title
            const rawTechs   = guessTechnologies(raw_title);
            const matchTechs: string[] = bestMatch?.technologies || [];
            // Add catalog techs that are also present in the raw title (cross-reference, not blindly copy)
            const mergedTechs = [...new Set([
                ...rawTechs,
                ...matchTechs.filter((t: string) => raw_title.toLowerCase().includes(t.toLowerCase()))
            ])];

            // ALL numeric specs extracted from the raw title — NEVER from bestMatch
            const rawResolution     = guessResolution(raw_title)    || undefined;
            const rawChannels       = guessChannels(raw_title)       || undefined;
            const rawRackU          = guessRackUHeight(raw_title)    || undefined;
            const rawCableLength    = guessCableLength(raw_title)    || undefined;
            const rawVoltage        = guessVoltage(raw_title)        || undefined;
            const rawAmperage       = guessAmperage(raw_title)       || undefined;
            const rawWattage        = guessWattage(raw_title)        || undefined;

            const matchedName = bestMatch?.display_name || "N/A";
            const confidenceScore = highestScore > 0 ? Math.min(highestScore * 20, 75) : 10;
            const schemaSource = highestScore > 0
                ? `Learned field schema from catalog match (${matchedName}), but ALL values extracted from your raw product title.`
                : "No catalog match found. Values extracted purely from your raw product title using regex parsers.";

            return NextResponse.json({
                success: true,
                data: {
                    category:         rawCategory,
                    brand:            rawBrand,
                    technologies:     mergedTechs,
                    resolution_mp:    rawResolution    ?? null,
                    channels:         rawChannels       ?? null,
                    rack_u_height:    rawRackU          ?? null,
                    cable_length_m:   rawCableLength    ?? null,
                    power_voltage_v:  rawVoltage        ?? null,
                    power_amperage_a: rawAmperage       ?? null,
                    power_wattage_w:  rawWattage        ?? null,
                    confidence_score: confidenceScore,
                    ai_reasoning:     schemaSource,
                },
            });
        }

        // 3. Call Gemini for deep_ai action
        const geminiResult = await parseProductWithGemini(raw_title, image_url, trainingRules, referenceProducts);

        return NextResponse.json({
            success: true,
            data: geminiResult,
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
