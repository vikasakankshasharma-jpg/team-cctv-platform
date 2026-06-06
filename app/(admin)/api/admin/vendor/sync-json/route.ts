import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import crypto from "crypto";
import { ApiResponse } from "@/lib/api-response";
import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "@/lib/vendor/ai-parser";
import { parseProductWithGemini } from "@/lib/vendor/gemini-parser";

export async function POST(request: NextRequest) {
  try {
    const { products, overrideCategory, vendorId, vendorPrefix } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return ApiResponse.badRequest("No products provided");
    }

    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    console.log(`[Smart Sync] Syncing ${products.length} pre-parsed items to DB...`);

    // Fetch Live Catalog
    const liveProductsSnapshot = await adminDb.collection('products').get();
    const liveCatalog = new Map();
    liveProductsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendor_product_id) {
            liveCatalog.set(data.vendor_product_id, { id: doc.id, ...data });
        }
        if (data.internal_sku) {
            liveCatalog.set(data.internal_sku, { id: doc.id, ...data });
        }
    });

    // Fetch Specification Knowledge Base
    const specKnowledgeSnapshot = await adminDb.collection('specification_knowledge').get();
    const learnedSpecs: { name: string, lowercaseName: string }[] = [];
    specKnowledgeSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.spec_name) {
            learnedSpecs.push({
                name: data.spec_name,
                lowercaseName: data.spec_name.toLowerCase()
            });
        }
    });

    const productsToStage: any[] = [];
    const productsToUpdate: any[] = [];

    for (const prod of products) {
        if (!prod.title) continue;
        const titleHash = crypto.createHash('md5').update(prod.title).digest('hex').substring(0, 8).toUpperCase();
        const generatedSku = (vendorPrefix || "VND") + "-" + titleHash;
        const internalSku = generatedSku;
        const vendorProductId = prod.vendorProductId || generatedSku;
        
        const existingProduct = liveCatalog.get(vendorProductId) || liveCatalog.get(internalSku);
        
        let finalCategory = "unidentified";
        
        // 1. AI Dynamic Learning (Check Live Catalog for similar past items)
        const titleWords = prod.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').slice(0, 3).join(' ');
        let learnedCategory = null;
        if (titleWords.length > 5) {
            for (const liveProd of Array.from(liveCatalog.values())) {
                if (liveProd.category && liveProd.display_name) {
                    const liveTitleWords = liveProd.display_name.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').slice(0, 3).join(' ');
                    if (titleWords === liveTitleWords) {
                        learnedCategory = liveProd.category;
                        break;
                    }
                }
            }
        }

        if (existingProduct) {
            let needsUpdate = false;
            const updatePayload: any = {};
            if (existingProduct.base_cost !== prod.baseCost) {
                updatePayload.base_cost = prod.baseCost;
                needsUpdate = true;
            }
            if (prod.inStock !== undefined && existingProduct.is_active !== prod.inStock) {
                updatePayload.is_active = prod.inStock;
                needsUpdate = true;
            }
            if (vendorId && existingProduct.vendor_id !== vendorId) {
                updatePayload.vendor_id = vendorId;
                needsUpdate = true;
            }
            if (!existingProduct.internal_sku) {
                updatePayload.internal_sku = internalSku;
                needsUpdate = true;
            }
            if (!existingProduct.vendor_product_id && prod.vendorProductId) {
                updatePayload.vendor_product_id = prod.vendorProductId;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                productsToUpdate.push({
                    id: existingProduct.id,
                    ...updatePayload,
                    updated_at: serverTimestamp()
                });
            }
        } else {
            // Compile Training Rules
            let trainingRules = "Past Learned Specs from Admin: " + learnedSpecs.map(s => s.name).join(", ") + ". ";
            if (learnedCategory) {
                trainingRules += `\nNote: A highly similar product was previously categorized as '${learnedCategory}'. Strongly consider this category.`;
            }
            if (overrideCategory && overrideCategory !== "unidentified") {
                trainingRules += `\nCRITICAL RULE: The Admin is strictly filtering for the '${overrideCategory}' category. If you are >70% confident this product is a '${overrideCategory}', categorize it as '${overrideCategory}'. If it is ANY other type of product, or if you are unsure, you MUST categorize it as 'unidentified'. Do NOT use any other categories.`;
            }

            // Call Multimodal Gemini AI
            const geminiResult = await parseProductWithGemini(prod.title, prod.imgUrl, trainingRules);

            productsToStage.push({
                status: "pending",
                raw_title: prod.title,
                vendor_product_id: vendorProductId,
                internal_sku: internalSku,
                vendor_id: vendorId || null,
                in_stock: prod.inStock !== false,
                category: geminiResult.category,
                brand: geminiResult.brand,
                base_cost: prod.baseCost || 0,
                technologies: geminiResult.technologies,
                resolution_mp: geminiResult.resolution_mp || null,
                channels: geminiResult.channels || null,
                rack_u_height: geminiResult.rack_u_height || null,
                cable_length_m: geminiResult.cable_length_m || null,
                power_voltage_v: geminiResult.power_voltage_v || null,
                power_amperage_a: geminiResult.power_amperage_a || null,
                power_wattage_w: geminiResult.power_wattage_w || null,
                ai_confidence_score: geminiResult.confidence_score,
                ai_reasoning: geminiResult.ai_reasoning,
                image_url: prod.imgUrl || "",
                created_at: serverTimestamp()
            });
        }
    }

    // Process Updates in Batches
    if (productsToUpdate.length > 0) {
        const updateBatches = [];
        let updateBatch = adminDb.batch();
        let count = 0;
        productsToUpdate.forEach((prod) => {
            const { id, ...payload } = prod;
            updateBatch.update(adminDb!.collection('products').doc(id), payload);
            count++;
            if (count === 500) {
                updateBatches.push(updateBatch.commit());
                updateBatch = adminDb!.batch();
                count = 0;
            }
        });
        if (count > 0) updateBatches.push(updateBatch.commit());
        await Promise.all(updateBatches);
    }

    // Always clear old staging area before processing a new upload batch
    const oldStaged = await adminDb.collection('staged_products').get();
    const deleteBatches = [];
    let deleteBatch = adminDb.batch();
    let deleteCount = 0;
    oldStaged.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
        deleteCount++;
        if (deleteCount === 500) {
            deleteBatches.push(deleteBatch.commit());
            deleteBatch = adminDb!.batch();
            deleteCount = 0;
        }
    });
    if (deleteCount > 0) deleteBatches.push(deleteBatch.commit());
    await Promise.all(deleteBatches);

    // Process Staging in Batches
    if (productsToStage.length > 0) {
        // Upload new staging
        const writeBatches = [];
        let writeBatch = adminDb.batch();
        let writeCount = 0;
        productsToStage.forEach((product) => {
            const ref = adminDb!.collection('staged_products').doc();
            writeBatch.set(ref, product);
            writeCount++;
            if (writeCount === 500) {
                writeBatches.push(writeBatch.commit());
                writeBatch = adminDb!.batch();
                writeCount = 0;
            }
        });
        if (writeCount > 0) writeBatches.push(writeBatch.commit());
        await Promise.all(writeBatches);
    }

    return ApiResponse.success({
      message: "Sync completed",
      totalParsed: products.length,
      stagedCount: productsToStage.length,
      updatedCount: productsToUpdate.length
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return ApiResponse.error("Upload failed", "INTERNAL_ERROR", 500, error.message);
  }
}
