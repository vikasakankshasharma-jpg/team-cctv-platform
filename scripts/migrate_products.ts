import * as admin from 'firebase-admin';
import * as path from 'path';

// Note: To run this, you need a service account key at the root of the project
// named serviceAccountKey.json, and run with `npx ts-node scripts/migrate_products.ts`

try {
  const serviceAccount = require(path.resolve(__dirname, '../serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.warn("⚠️  Could not load serviceAccountKey.json. Make sure you have one to run this script against your production DB.");
  // Don't crash immediately in case this is just a dry run check
}

const db = admin.firestore();

/**
 * Infer resolution from technical_name
 */
function inferResolutionFromName(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("8mp") || lower.includes("4k")) return 8;
  if (lower.includes("6mp")) return 6;
  if (lower.includes("5mp")) return 5;
  if (lower.includes("4mp")) return 4;
  if (lower.includes("3mp")) return 3;
  if (lower.includes("2mp") || lower.includes("1080p")) return 2;
  return 2; // Default
}

/**
 * Infer night vision type from technical_name
 */
function inferNightVisionFromName(name: string): "ir" | "color" | "dual_light" | "starlight" {
  const lower = name.toLowerCase();
  if (lower.includes("starlight")) return "starlight";
  if (lower.includes("dual") && lower.includes("light")) return "dual_light";
  if (lower.includes("colorvu") || lower.includes("color")) return "color";
  return "ir"; 
}

/**
 * Main migration function
 */
async function migrateProducts() {
  console.log("Starting product spec migration...");
  
  const productsRef = db.collection('products');
  const snapshot = await productsRef.where('category', '==', 'camera').get();
  
  if (snapshot.empty) {
    console.log("No cameras found to migrate.");
    return;
  }
  
  console.log(`Found ${snapshot.size} cameras to evaluate.`);
  
  let updatedCount = 0;
  const batch = db.batch();
  let currentBatchSize = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const name = data.technical_name || "";
    const features = data.features || [];
    
    // Check if it already has the new fields
    if (data.resolution_mp !== undefined && data.night_vision_type !== undefined) {
      continue; // Already migrated
    }

    // Determine specs
    const mp = inferResolutionFromName(name);
    const nvType = inferNightVisionFromName(name);
    
    const hasAudio = features.some((f: string) => f.toLowerCase().includes("mic") || f.toLowerCase().includes("audio")) || 
                     name.toLowerCase().includes("mic") || 
                     name.toLowerCase().includes("audio");

    const wdr = name.toLowerCase().includes("wdr");
    
    let formFactor = "dome";
    if (name.toLowerCase().includes("bullet")) formFactor = "bullet";
    else if (name.toLowerCase().includes("ptz")) formFactor = "ptz";
    else if (name.toLowerCase().includes("turret")) formFactor = "turret";
    else if (name.toLowerCase().includes("fisheye")) formFactor = "fisheye";

    const updates: any = {
      resolution_mp: mp,
      night_vision_type: nvType,
      has_audio: hasAudio,
      wdr: wdr,
      form_factor: formFactor,
      is_focus_product: false, // Default
    };

    console.log(`Migrating [${name}]: ${mp}MP, ${nvType}, Audio:${hasAudio}, WDR:${wdr}, Form:${formFactor}`);
    
    batch.update(doc.ref, updates);
    updatedCount++;
    currentBatchSize++;

    // Firestore batch limits to 500 writes
    if (currentBatchSize === 490) {
      await batch.commit();
      console.log(`Committed batch of 490...`);
      currentBatchSize = 0;
    }
  }

  if (currentBatchSize > 0) {
    await batch.commit();
  }

  console.log(`Migration complete! Updated ${updatedCount} cameras.`);
}

if (require.main === module) {
  migrateProducts().catch(console.error);
}
