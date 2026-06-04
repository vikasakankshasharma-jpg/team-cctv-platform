import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import * as cheerio from "cheerio";
import { ApiResponse } from "@/lib/api-response";

// AI Normalization logic mapping (heuristic)
function guessCategory(title: string) {
    const t = title.toLowerCase();
    if (t.includes('camera') || t.includes('ptz') || t.includes('bullet') || t.includes('dome')) return 'camera';
    if (t.includes('dvr') || t.includes('nvr') || t.includes('recorder')) return 'recorder';
    if (t.includes('hard disk') || t.includes('hdd') || t.includes('micro sd') || t.includes('ssd') || t.includes('purple')) return 'storage';
    if (t.includes('power supply') || t.includes('smps') || t.includes('adapter')) return 'power_device';
    if (t.includes('cable') || t.includes('wire') || t.includes('cat6') || t.includes('hdmi') || t.includes('vga')) return 'cable';
    if (t.includes('connector') || t.includes('rj45') || t.includes('bnc') || t.includes('dc pin')) return 'connector';
    if (t.includes('mount') || t.includes('junction box') || t.includes('bracket')) return 'mount';
    if (t.includes('rack') || t.includes('cabinet') || t.includes('server rack')) return 'rack';
    if (t.includes('switch') || t.includes('router') || t.includes('poe switch')) return 'network';
    if (t.includes('installation') || t.includes('service') || t.includes('labour')) return 'installation';
    if (t.includes('amc') || t.includes('maintenance')) return 'amc';
    if (t.includes('display') || t.includes('monitor') || t.includes('tv') || t.includes('lcd')) return 'display';
    return 'accessory';
}

function guessTechnologies(title: string) {
    const t = title.toLowerCase();
    const techs: string[] = [];
    
    // Connectivity
    if (t.includes('ip ') || t.includes('network')) techs.push('IP');
    if (t.includes('ahd') || t.includes('cvi') || t.includes('tvi') || t.includes('analog')) techs.push('Analog');
    if (t.includes('wifi') || t.includes('wi-fi') || t.includes('wireless')) techs.push('WiFi');
    if (t.includes('4g') || t.includes('lte')) techs.push('4G');
    if (t.includes('poe')) techs.push('PoE');

    // Features
    if (t.includes('colorvu') || t.includes('full color') || t.includes('night color')) techs.push('ColorVu');
    
    if (t.includes('two way audio') || t.includes('two-way audio') || t.includes('2-way audio') || t.includes('two way talk') || t.includes('two-way talk') || t.includes('2-way talk')) {
        techs.push('Two-Way Audio');
    } else if (t.includes('audio') || t.includes('mic')) {
        techs.push('Audio');
    }

    if (t.includes('ptz') || t.includes('pan tilt zoom')) {
        techs.push('PTZ');
    } else if (/\bpt\b/.test(t) || t.includes('pan-tilt') || t.includes('pan tilt')) {
        techs.push('PT');
    }

    // Form Factor & Environment
    if (t.includes('dome')) techs.push('Dome');
    if (t.includes('bullet')) techs.push('Bullet');
    if (t.includes('indoor')) techs.push('Indoor');
    if (t.includes('outdoor')) techs.push('Outdoor');
    
    // Resolution guesses
    if (t.includes('2mp') || t.includes('2.4mp') || t.includes('1080p')) techs.push('2MP');
    if (t.includes('3mp')) techs.push('3MP');
    if (t.includes('4mp')) techs.push('4MP');
    if (t.includes('5mp')) techs.push('5MP');
    if (t.includes('8mp') || t.includes('4k')) techs.push('8MP');

    return Array.from(new Set(techs)); // unique
}

function guessResolution(title: string) {
    const t = title.toLowerCase();
    if (t.includes('2.4mp')) return 2.4;
    if (t.includes('2mp') || t.includes('1080p')) return 2;
    if (t.includes('3mp')) return 3;
    if (t.includes('4mp') && !t.includes('2.4mp')) return 4;
    if (t.includes('5mp')) return 5;
    if (t.includes('6mp')) return 6;
    if (t.includes('8mp') || t.includes('4k')) return 8;
    return null;
}

function guessBrand(title: string) {
    const t = title.toLowerCase();
    if (t.includes('cp-plus') || t.includes('cp plus') || t.includes('cpplus')) return 'CP-Plus';
    if (t.includes('hikvision')) return 'Hikvision';
    if (t.includes('dahua')) return 'Dahua';
    if (t.includes('prama')) return 'Prama';
    if (t.includes('godrej')) return 'Godrej';
    if (t.includes('trueview')) return 'Trueview';
    if (t.includes('consistent')) return 'Consistent';
    if (t.includes('seagate')) return 'Seagate';
    if (t.includes('western digital') || t.includes('wd purple')) return 'WD';
    if (t.includes('toshiba')) return 'Toshiba';
    if (t.includes('d-link') || t.includes('dlink')) return 'D-Link';
    if (t.includes('tp-link') || t.includes('tplink')) return 'TP-Link';
    return null;
}

function guessChannels(title: string) {
    const t = title.toLowerCase();
    const match = t.match(/(\d+)\s*(?:ch|channel|port)/);
    if (match) return parseInt(match[1]);
    return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return ApiResponse.badRequest("No files uploaded");
    }

    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    console.log(`[Smart Sync] Processing ${files.length} HTML files...`);

    // Fetch Live Catalog
    const liveProductsSnapshot = await adminDb.collection('products').get();
    const liveCatalog = new Map();
    liveProductsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.vendor_product_id) {
            liveCatalog.set(data.vendor_product_id, { id: doc.id, ...data });
        }
    });

    let totalParsed = 0;
    const productsToStage: any[] = [];
    const productsToUpdate: any[] = [];

    for (const file of files) {
      const htmlContent = await file.text();
      const $ = cheerio.load(htmlContent);
      
      const productElements = $('.product-thumb');
      if (productElements.length === 0) continue;
      
      productElements.each((index, element) => {
          const title = $(element).find('.name a').first().text().trim();
          if (!title) return; // Skip empty
          
          let priceText = $(element).find('.price').first().text().trim();
          let priceMatches = priceText.match(/₹([\d,]+)/);
          let baseCost = 0;
          if (priceMatches && priceMatches[1]) {
              baseCost = parseFloat(priceMatches[1].replace(/,/g, ''));
          }

          let imgUrl = "";
          const imgEl = $(element).find('img').first();
          
          const srcset = imgEl.attr('srcset') || imgEl.attr('data-srcset');
          if (srcset) {
              const parts = srcset.split(' ');
              if (parts.length > 0) imgUrl = parts[0];
          }
          if (!imgUrl) {
              imgUrl = imgEl.attr('data-src') || imgEl.attr('src') || "";
          }

          const vendorProductId = "MJ-" + Buffer.from(title).toString('base64').substring(0, 8).toUpperCase();

          const existingProduct = liveCatalog.get(vendorProductId);
          
          if (existingProduct) {
              if (existingProduct.base_cost !== baseCost) {
                  productsToUpdate.push({
                      id: existingProduct.id,
                      base_cost: baseCost,
                      updated_at: serverTimestamp()
                  });
              }
          } else {
              productsToStage.push({
                  status: "pending",
                  raw_title: title,
                  vendor_product_id: vendorProductId,
                  category: guessCategory(title),
                  brand: guessBrand(title),
                  base_cost: baseCost,
                  technologies: guessTechnologies(title),
                  resolution_mp: guessResolution(title),
                  channels: guessChannels(title),
                  image_url: imgUrl,
                  created_at: serverTimestamp()
              });
          }

          totalParsed++;
      });
    }

    // Process Updates in Batches
    if (productsToUpdate.length > 0) {
        const updateBatches = [];
        let updateBatch = adminDb.batch();
        let count = 0;
        productsToUpdate.forEach((prod) => {
            updateBatch.update(adminDb!.collection('products').doc(prod.id), {
                base_cost: prod.base_cost,
                updated_at: prod.updated_at
            });
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
      totalParsed,
      stagedCount: productsToStage.length,
      updatedCount: productsToUpdate.length
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return ApiResponse.error("Upload failed", "INTERNAL_ERROR", 500, error.message);
  }
}
