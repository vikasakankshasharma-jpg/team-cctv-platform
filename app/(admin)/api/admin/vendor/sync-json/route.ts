import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import crypto from "crypto";
import { ApiResponse } from "@/lib/api-response";
import { guessCategory, guessBrand, guessTechnologies, guessResolution, guessChannels, guessRackUHeight, guessCableLength, guessVoltage, guessAmperage, guessWattage } from "@/lib/vendor/ai-parser";
import { classifyCCTVProduct, calculateReverseGST, analyzePriceDrift } from "@/lib/vendor/cctv-domain-filter";


export async function POST(request: NextRequest) {
  try {
    const { products, overrideCategory, vendorId, vendorPrefix, syncMode = "all", matchBy = "auto" } = await request.json();

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
    const liveCatalogBySku = new Map();
    const liveCatalogByTitle = new Map();
    liveProductsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendor_product_id) liveCatalog.set(data.vendor_product_id, { id: doc.id, ...data });
        if (data.internal_sku) {
            liveCatalog.set(data.internal_sku, { id: doc.id, ...data });
            liveCatalogBySku.set(data.internal_sku, { id: doc.id, ...data });
        }
        if (data.display_name) {
            liveCatalogByTitle.set(data.display_name.trim().toLowerCase(), { id: doc.id, ...data });
        }
    });

    // Fetch Staged Catalog for Deduplication
    const stagedProductsSnapshot = await adminDb.collection('staged_products').get();
    const stagedCatalog = new Set();
    const stagedCatalogBySku = new Set();
    const stagedCatalogByTitle = new Set();
    stagedProductsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendor_product_id) stagedCatalog.add(data.vendor_product_id);
        if (data.internal_sku) {
            stagedCatalog.add(data.internal_sku);
            stagedCatalogBySku.add(data.internal_sku);
        }
        if (data.raw_title) {
            stagedCatalogByTitle.add(data.raw_title.trim().toLowerCase());
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
        const internalSku = (vendorPrefix || "VND") + "-" + titleHash;
        const vendorProductId = prod.vendorProductId || "";
        
        let existingProduct;
        let isAlreadyStaged = false;
        
        if (matchBy === "vendor_id") {
            existingProduct = vendorProductId ? liveCatalog.get(vendorProductId) : undefined;
            isAlreadyStaged = vendorProductId ? stagedCatalog.has(vendorProductId) : false;
        } else if (matchBy === "internal_sku") {
            existingProduct = liveCatalogBySku.get(internalSku);
            isAlreadyStaged = stagedCatalogBySku.has(internalSku);
        } else if (matchBy === "title") {
            const titleKey = prod.title.trim().toLowerCase();
            existingProduct = liveCatalogByTitle.get(titleKey);
            isAlreadyStaged = stagedCatalogByTitle.has(titleKey);
        } else {
            // "auto" mode
            existingProduct = (vendorProductId ? liveCatalog.get(vendorProductId) : undefined) || liveCatalogBySku.get(internalSku);
            isAlreadyStaged = (vendorProductId ? stagedCatalog.has(vendorProductId) : false) || stagedCatalogBySku.has(internalSku);
        }

        // SUPREME GROUND TRUTH INVARIANT:
        // If product is already in our inventory, it is ALWAYS allowed & sovereign (admin-approved).
        // For new unlisted items, the CCTV domain filter shields against non-surveillance consumer clutter.
        const cctvClassification = classifyCCTVProduct(
            prod.title,
            prod.sourceUrl || "",
            overrideCategory,
            existingProduct ? { isListedInInventory: true, inventoryCategory: existingProduct.category, matchedId: existingProduct.id } : undefined
        );

        if (!existingProduct && !cctvClassification.is_cctv_eligible && !overrideCategory) {
            continue;
        }
        
        if (existingProduct) {
            if (syncMode === 'new_only') continue;

            let needsUpdate = false;
            const updatePayload: any = {};
            const liveVendorPrice = Number(prod.baseCost || 0);

            if (liveVendorPrice > 0) {
                const currentPrice = Number(existingProduct.unit_price || existingProduct.base_cost || 0);
                const drift = analyzePriceDrift(currentPrice, liveVendorPrice, prod.inStock !== undefined && existingProduct.is_active !== prod.inStock);

                if (drift.drift_amount !== 0) {
                    updatePayload.unit_price = liveVendorPrice;
                    updatePayload.last_price_drift_percent = drift.drift_percent;
                    updatePayload.has_significant_price_drift = drift.has_significant_drift;
                    if (drift.has_significant_drift) {
                        updatePayload.price_drift_alert = drift.alert_message;
                    }

                    // Statutory Reverse GST (18% inclusive standard) & Margin Maintenance
                    const margin = Number(existingProduct.margin_percentage || 20);
                    updatePayload.base_cost = Math.round(liveVendorPrice / (1 + margin / 100));
                    updatePayload.taxable_base = drift.reverse_gst.taxable_base;
                    updatePayload.cgst_9 = drift.reverse_gst.cgst_9;
                    updatePayload.sgst_9 = drift.reverse_gst.sgst_9;
                    updatePayload.total_gst = drift.reverse_gst.total_gst;
                    updatePayload.is_gst_reconciled = drift.reverse_gst.is_reconciled;

                    needsUpdate = true;
                }
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
            if (syncMode === 'updates_only') continue;
            if (isAlreadyStaged) continue;

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

            productsToStage.push({
                prod,
                internalSku,
                vendorProductId,
                learnedCategory
            });
        }
    }

    // Fast synchronous parsing using CCTV Domain Filter and reverse GST calculator.
    const stagedResults = productsToStage.map((item) => {
        const gstBreakup = calculateReverseGST(item.prod.baseCost || 0);
        const classification = classifyCCTVProduct(item.prod.title, item.prod.sourceUrl || "", overrideCategory || item.learnedCategory);

        return {
            status: "pending",
            raw_title: item.prod.title,
            vendor_product_id: item.vendorProductId,
            internal_sku: item.internalSku,
            vendor_id: vendorId || null,
            in_stock: item.prod.inStock !== false,
            is_cctv_eligible: classification.is_cctv_eligible,
            category: overrideCategory || classification.category || item.learnedCategory || guessCategory(item.prod.title) || "unidentified",
            brand: classification.metadata.brand || guessBrand(item.prod.title) || null,
            technology: classification.metadata.technology || null,
            form_factor: classification.metadata.form_factor || null,
            technologies: guessTechnologies(item.prod.title) || [],
            resolution_mp: classification.metadata.resolution_mp || guessResolution(item.prod.title) || null,
            channels: classification.metadata.channels || guessChannels(item.prod.title) || null,
            storage_capacity: classification.metadata.storage_capacity || null,
            is_surveillance_grade: classification.metadata.is_surveillance_grade || false,
            weatherproof_rating: classification.metadata.weatherproof_rating || null,
            audio_feature: classification.metadata.audio_feature || null,
            rack_u_height: guessRackUHeight(item.prod.title) || null,
            cable_length_m: classification.metadata.cable_specs.length_m || guessCableLength(item.prod.title) || null,
            power_voltage_v: classification.metadata.power_specs.voltage_v || guessVoltage(item.prod.title) || null,
            power_amperage_a: classification.metadata.power_specs.amperage_a || guessAmperage(item.prod.title) || null,
            power_wattage_w: classification.metadata.power_specs.wattage_w || guessWattage(item.prod.title) || null,
            unit_price: item.prod.baseCost || 0, // 18% GST-inclusive customer retail price
            base_cost: Math.round((item.prod.baseCost || 0) / 1.20), // 20% default wholesale margin
            margin_percentage: 20,
            taxable_base: gstBreakup.taxable_base,
            cgst_9: gstBreakup.cgst_9,
            sgst_9: gstBreakup.sgst_9,
            total_gst: gstBreakup.total_gst,
            is_gst_reconciled: gstBreakup.is_reconciled,
            ai_confidence_score: classification.confidence_score,
            ai_reasoning: classification.is_cctv_eligible ? "Verified CCTV Installation Hardware" : null,
            image_url: item.prod.imgUrl || "",
            created_at: serverTimestamp()
        };
    });

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

    // Staging clear should happen client side before chunking, removed here to prevent wiping out chunks

    // Process Staging in Batches
    if (productsToStage.length > 0) {
        // Upload new staging
        const writeBatches = [];
        let writeBatch = adminDb.batch();
        let writeCount = 0;
        productsToStage.forEach(() => {}); // Removed, processing stagedResults instead

        stagedResults.forEach((product) => {
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
