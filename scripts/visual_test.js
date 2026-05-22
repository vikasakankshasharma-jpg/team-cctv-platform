const { chromium } = require('playwright');
const path = require('path');

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log("Navigating to local development server...");
  // Using localhost to test the latest code directly
  await page.goto('http://localhost:3000/wizard', { waitUntil: 'domcontentloaded' });
  
  // Wait for React to hydrate and the first step to be visible
  await page.waitForSelector('text="Home / Residential"', { state: 'visible', timeout: 15000 });

  // Directory for artifacts
  const outDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\8c22ab33-d2d1-47d3-b968-bb8e91be9fb2\\';

  try {
    console.log("Answering Q1: Property Type (Home)");
    await page.click('text="Home / Residential"');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q2: Setup Type (New Installation)");
    await page.click('text="New Installation"');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q3: Camera Count (4)");
    await page.fill('input[type="number"]', '4');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q4: Camera Technology (Smart Digital)");
    // Using a more generic selector in case labels changed
    const smartOption = await page.$('text="IP Network Camera"');
    if(smartOption) await smartOption.click();
    else await page.locator('button').filter({ hasText: /IP Network Camera/i }).click();
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q5: Storage (15 Days)");
    const storageOption = await page.$('text="15 Days"');
    if(storageOption) await storageOption.click();
    else await page.locator('button').filter({ hasText: /15 Days/i }).click();
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q6: Special Features (Color Night Vision)");
    await page.click('text="24/7 Color Night Vision"');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q7: General Addons (Monitor)");
    await page.click('text="Monitor Display (32-inch)"');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(500);

    console.log("Answering Q8: Site Overview (High Reach, Brick)");
    await page.click('text="High (10ft - 15ft)"');
    await page.click('text="Concrete / Brick Wall"');
    
    console.log("Submitting Wizard to generate quote...");
    await page.click('button:has-text("Generate Quote")');
    
    // Wait for quotation dashboard to load
    console.log("Waiting for Dashboard to load...");
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000); // Allow animations and price engine to settle

    console.log("Taking Dashboard screenshots...");
    
    // 1. Top View (Tabs and Recommended Packages)
    await page.screenshot({ path: path.join(outDir, 'live_test_01_tabs.png') });

    // 2. Scroll to System Summary
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'live_test_02_summary.png') });

    // 3. Scroll to Action Panel (Checkout)
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'live_test_03_actionpanel.png') });

    console.log("Visual Test Run Complete!");
    
  } catch (err) {
    console.error("Test encountered an error:", err);
    await page.screenshot({ path: path.join(outDir, 'live_test_error.png') });
  }

  await browser.close();
}

runTest();
