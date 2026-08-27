import "dotenv/config";
import { adminDb } from "../lib/firebase-admin";

const db = adminDb;

async function checkCatalog() {
  console.log("=== CCTV PLATFORM: CATALOG READINESS CHECK ===");
  console.log("Fetching active products from Firebase...\n");

  const snapshot = await db.collection("products")
    .where("is_active", "==", true)
    .where("is_quotation_eligible", "==", true)
    .get();

  const products = snapshot.docs.map(doc => doc.data());
  console.log(`Found ${products.length} active and quotation-eligible products.\n`);

  let errors = 0;
  let warnings = 0;

  // 1. Recorders
  console.log("--- Checking Recorders ---");
  const recorders = products.filter(p => p.category === "recorder");
  const neededChannels = [4, 8, 16, 32];
  
  for (const ch of neededChannels) {
    const hasRecorder = recorders.some(r => r.channels === ch);
    if (!hasRecorder) {
      console.log(`❌ ERROR: No active ${ch}CH recorder found! Configurator will fail for ${ch} camera setups.`);
      errors++;
    } else {
      const validMeta = recorders.some(r => r.channels === ch && r.max_resolution_mp && r.base_cost);
      if (!validMeta) {
        console.log(`❌ ERROR: ${ch}CH Recorder found but missing 'max_resolution_mp' or 'base_cost' metadata.`);
        errors++;
      } else {
        console.log(`✅ ${ch}CH Recorder found with valid metadata.`);
      }
    }
  }
  console.log("");

  // 2. Storage
  console.log("--- Checking Storage (HDDs) ---");
  const storage = products.filter(p => p.category === "storage");
  const neededTB = [1, 2, 4, 8]; // Minimum common sizes

  for (const tb of neededTB) {
    const hasHDD = storage.some(s => s.storage_capacity_tb === tb);
    if (!hasHDD) {
      console.log(`⚠️ WARNING: No active ${tb}TB HDD found. Storage allocation may round up to higher capacities.`);
      warnings++;
    } else {
      console.log(`✅ ${tb}TB HDD found.`);
    }
  }
  if (storage.length === 0) {
    console.log(`❌ ERROR: No active storage products found at all!`);
    errors++;
  }
  console.log("");

  // 3. Cameras
  console.log("--- Checking Cameras ---");
  const cameras = products.filter(p => p.category === "cctv_camera");
  const neededTechs = ["IP", "HD", "WiFi"];
  
  for (const tech of neededTechs) {
    const matchingCams = cameras.filter(c => c.technologies && c.technologies.includes(tech));
    if (matchingCams.length === 0) {
      console.log(`❌ ERROR: No active ${tech} cameras found! Users selecting ${tech} will get a 400 rejection.`);
      errors++;
    } else {
      const validMeta = matchingCams.some(c => c.resolution_mp && c.recording_bitrate_kbps && c.base_cost);
      if (!validMeta) {
        console.log(`❌ ERROR: ${tech} cameras found but missing 'resolution_mp', 'recording_bitrate_kbps' or 'base_cost'.`);
        errors++;
      } else {
        console.log(`✅ ${tech} cameras found with valid metadata.`);
      }
    }
  }
  console.log("");

  // Summary
  console.log("=== SUMMARY ===");
  if (errors > 0) {
    console.log(`🚨 CATALOG NOT READY! Found ${errors} errors that will break the Configurator.`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`⚠️ Catalog is ready but has ${warnings} warnings. Configuration may be suboptimal.`);
    process.exit(0);
  } else {
    console.log("✅ Catalog is fully ready for Production/Staging!");
    process.exit(0);
  }
}

checkCatalog().catch(console.error);
