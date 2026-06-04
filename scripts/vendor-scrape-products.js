const { chromium } = require('playwright');
const readline = require('readline');
const admin = require('firebase-admin');

require('dotenv').config({ path: '.env.local' });
if (!process.env.FIREBASE_PROJECT_ID) {
  console.log("⚠️  Could not find FIREBASE_PROJECT_ID in .env.local");
  process.exit(1);
}
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

function askQuestion(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans); }));
}

/**
 * AI Data Normalization Engine (Simulated)
 * In production, you would connect this to OpenAI (gpt-4o) or Google Gemini API.
 */
async function normalizeProductWithAI(rawTitle, rawDescription) {
    console.log(`🧠 AI Engine analyzing: "${rawTitle}"...`);
    
    // Simple heuristic simulation of what an LLM would do
    const titleLower = rawTitle.toLowerCase();
    
    let category = "accessory";
    if (titleLower.includes("camera") || titleLower.includes("dome") || titleLower.includes("bullet")) category = "camera";
    else if (titleLower.includes("dvr") || titleLower.includes("nvr")) category = "recorder";

    const technologies = [];
    if (titleLower.includes("5mp") || titleLower.includes("5 mp")) technologies.push({ id: "5MP", group_id: null });
    if (titleLower.includes("2mp") || titleLower.includes("2 mp")) technologies.push({ id: "2MP", group_id: null });
    if (titleLower.includes("ip") || titleLower.includes("network")) technologies.push({ id: "IP", group_id: null });
    if (titleLower.includes("ahd") || titleLower.includes("hd")) technologies.push({ id: "HD", group_id: null });

    return {
        category,
        technologies,
        is_active: true,
        base_cost: 0,
        margin_percentage: 25,
        unit_price: 0,
    };
}

(async () => {
  console.log("==========================================");
  console.log("  MegaJaipur Product Extraction & Staging");
  console.log("==========================================\n");

  const targetUrl = await askQuestion("Enter the Category/Filter URL you want to scrape: ");
  if (!targetUrl) process.exit(0);

  const userDataDir = './.playwright-session';
  const context = await chromium.launchPersistentContext(userDataDir, { headless: false });
  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  console.log(`🌐 Navigating to ${targetUrl} ...`);
  await page.goto(targetUrl);

  console.log("🔎 Extracting products from page...");
  
  // Generic extraction - needs adjusting for exact DOM
  const scrapedProducts = await page.evaluate(() => {
      const productCards = Array.from(document.querySelectorAll('.product-card, .grid-item, .product-item'));
      
      return productCards.map(card => {
          const titleEl = card.querySelector('.product-title, .title, h3, h2, a');
          const priceEl = card.querySelector('.price, .amount, .money, .special-price');
          const imgEl = card.querySelector('img');
          const linkEl = card.querySelector('a');

          let priceText = priceEl ? priceEl.innerText.replace(/[^0-9.]/g, '') : "0";
          
          return {
              raw_title: titleEl ? titleEl.innerText.trim() : "Unknown Product",
              price: parseFloat(priceText) || 0,
              image_url: imgEl ? imgEl.src : "",
              // Use the URL path as a pseudo-SKU if actual SKU is hidden
              vendor_product_id: linkEl ? linkEl.href.split('/').pop() : `unknown-${Date.now()}` 
          };
      }).filter(p => p.raw_title !== "Unknown Product");
  });

  console.log(`✅ Extracted ${scrapedProducts.length} raw products.`);

  if (scrapedProducts.length > 0) {
      console.log("\n⚙️  Sending to AI Normalization Engine & Staging Area...");
      
      const batch = db.batch();
      
      for (const p of scrapedProducts) {
          const aiData = await normalizeProductWithAI(p.raw_title, "");
          
          const stagedProduct = {
              vendor_id: "megajaipur",
              vendor_product_id: p.vendor_product_id,
              raw_title: p.raw_title,
              image_url: p.image_url,
              status: "pending",
              
              // AI Inferred fields
              display_name: p.raw_title,
              category: aiData.category,
              technologies: aiData.technologies,
              base_cost: p.price,
              unit_price: p.price * 1.25, // Quick 25% margin
              is_active: true,
              created_at: admin.firestore.FieldValue.serverTimestamp()
          };

          const ref = db.collection('staged_products').doc();
          batch.set(ref, stagedProduct);
      }

      await batch.commit();
      console.log(`\n🎉 Successfully staged ${scrapedProducts.length} products!`);
      console.log("👉 Go to your Admin Panel > Vendor Import Engine to approve them.");
  } else {
      console.log("⚠️ Could not find any products. The DOM selectors may need adjusting for this specific category page.");
  }

  await context.close();
  process.exit(0);
})();
