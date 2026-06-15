const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  const artifactDir = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\8065dd9e-74df-42bd-87f1-557bb171f119';

  try {
    console.log("Navigating to Landing Page...");
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    console.log("Dismissing modal...");
    await page.click('button:has-text("English")', { force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // 1. Landing Page Full
    await page.screenshot({ path: path.join(artifactDir, '01_landing_full.png'), fullPage: true });
    
    // Fill pincode
    console.log("Entering pincode...");
    await page.fill('input[type="text"]', '302017');
    await page.click('button:has-text("Check Area")');
    await page.waitForTimeout(3000);
    
    // 2. Catalog Page Full
    await page.screenshot({ path: path.join(artifactDir, '02_catalog_full.png'), fullPage: true });

    console.log("Navigating to Review Page via Mock Lead...");
    await page.goto('http://localhost:3000/quote/mock-lead/review/mock-quote', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 3. Review Page Full
    await page.screenshot({ path: path.join(artifactDir, '03_review_full.png'), fullPage: true });

    console.log("All E2E full page screenshots taken.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await browser.close();
  }
})();
