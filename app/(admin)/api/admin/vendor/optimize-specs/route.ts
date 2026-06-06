import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseProductWithGemini } from "@/lib/vendor/gemini-parser";

export async function GET(request: Request) {
  try {
    const db = adminDb;
    
    // 1. Fetch live products that haven't been AI optimized yet
    // We'll fetch 20 and pick the first 5 that don't have the flag
    const productsSnapshot = await db.collection("products").where("is_deleted", "==", false).limit(20).get();
    
    const productsToOptimize: any[] = [];
    productsSnapshot.forEach(doc => {
        const product = doc.data();
        if (product.display_name && !product._ai_optimized) {
            if (productsToOptimize.length < 5) {
                productsToOptimize.push({ id: doc.id, ...product });
            }
        }
    });

    if (productsToOptimize.length === 0) {
        return NextResponse.json({ success: true, suggestions: [] });
    }

    // 2. Fetch Knowledge Base for extra rules
    const specKnowledgeSnapshot = await db.collection('specification_knowledge').get();
    let trainingRules = "";
    specKnowledgeSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.spec_name) {
            trainingRules += `- Recognize "${data.spec_name}" as a valid technology/specification.\n`;
        }
    });

    const suggestions: any[] = [];

    // 3. Process in parallel using Gemini
    const promises = productsToOptimize.map(async (product) => {
        try {
            const rawTitle = product.raw_title || product.display_name;
            const geminiResult = await parseProductWithGemini(rawTitle, product.image_url, trainingRules);
            
            // Compare existing technologies with suggested ones to find what's new
            const existingTechs = product.technologies || [];
            const suggestedTechs = geminiResult.technologies || [];
            
            const missingTechs = suggestedTechs.filter(t => !existingTechs.some((et: string) => et.toLowerCase() === t.toLowerCase()));

            // Even if no missing techs, we might have found new deep specs (voltage, etc.)
            // So we'll suggest it if anything new is found
            const hasNewDeepSpecs = 
              (geminiResult.power_voltage_v && !product.power_voltage_v) ||
              (geminiResult.power_wattage_w && !product.power_wattage_w) ||
              (geminiResult.network_ports && !product.network_ports) ||
              (geminiResult.storage_capacity_tb && !product.storage_capacity_tb) ||
              (geminiResult.resolution_mp && !product.resolution_mp);

            if (missingTechs.length > 0 || hasNewDeepSpecs) {
                suggestions.push({
                    id: product.id,
                    display_name: product.display_name,
                    category: product.category,
                    existing_technologies: existingTechs,
                    suggested_technologies: missingTechs,
                    image_url: product.image_url,
                    deep_specs: geminiResult // Attach the full result to save later
                });
            } else {
                // If nothing new, just mark it as optimized so we don't scan it again
                await db.collection("products").doc(product.id).update({
                    _ai_optimized: true,
                    updated_at: new Date().toISOString()
                });
            }
        } catch (e) {
            console.error("Failed to parse product with Gemini:", e);
        }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("Error fetching optimization suggestions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body; 
    const db = adminDb;

    if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json({ success: false, error: "No updates provided" });
    }

    const batches = [];
    let batch = db.batch();
    let count = 0;

    for (const update of updates) {
        const ref = db.collection("products").doc(update.id);
        
        // Build the update payload dynamically to include all the deep specs Gemini found
        const payload: any = {
            technologies: update.technologies,
            _ai_optimized: true,
            updated_at: new Date().toISOString()
        };

        if (update.deep_specs) {
            if (update.deep_specs.resolution_mp) payload.resolution_mp = update.deep_specs.resolution_mp;
            if (update.deep_specs.channels) payload.channels = update.deep_specs.channels;
            if (update.deep_specs.power_voltage_v) payload.power_voltage_v = update.deep_specs.power_voltage_v;
            if (update.deep_specs.power_wattage_w) payload.power_wattage_w = update.deep_specs.power_wattage_w;
            if (update.deep_specs.power_amperage_a) payload.power_amperage_a = update.deep_specs.power_amperage_a;
            if (update.deep_specs.network_ports) payload.network_ports = update.deep_specs.network_ports;
            if (update.deep_specs.network_speed) payload.network_speed = update.deep_specs.network_speed;
            if (update.deep_specs.storage_capacity_tb) payload.storage_capacity_tb = update.deep_specs.storage_capacity_tb;
            if (update.deep_specs.storage_type) payload.storage_type = update.deep_specs.storage_type;
            if (update.deep_specs.rack_u_height) payload.rack_u_height = update.deep_specs.rack_u_height;
        }

        batch.update(ref, payload);
        
        count++;
        if (count === 500) {
            batches.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error: any) {
    console.error("Error applying spec optimizations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
