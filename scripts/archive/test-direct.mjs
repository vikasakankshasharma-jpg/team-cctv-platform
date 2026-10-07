import { generateConfiguration } from "./lib/quote-engine.js";
import { resolveSystem } from "./lib/product-resolver.js";
import { generatePricingSnapshot } from "./lib/pricing-engine-v2.js";
import { getAdminSettings, getActiveProducts } from "./lib/firebase-admin.js";

async function runTest() {
  console.log("Loading DB...");
  const settings = await getAdminSettings();
  const catalog = await getActiveProducts();
  console.log("DB Loaded.");
}
runTest();
