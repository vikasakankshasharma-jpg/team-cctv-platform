const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  console.log('Navigating to live quote page...');
  await page.goto('https://cctvquotation.com/quote/276gQ5K232tHPJ0hXx0e', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("View Full Quotation")', { timeout: 15000 });
  await page.screenshot({ path: 'live-step1-packages.png', fullPage: false });
  console.log('Step 1: Packages loaded.');

  // Click on the CP Plus card or button
  const cardBtn = page.locator('button:has-text("View Full Quotation")').nth(1);
  await cardBtn.click();
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log('URL after clicking card:', currentUrl);
  await page.screenshot({ path: 'live-step2-instant-review.png', fullPage: false });

  const hasReviewTitle = await page.locator('h1:has-text("Instant Quotation Review")').isVisible();
  const hasBOM = await page.locator('text=Itemized Bill of Materials').isVisible();
  const hasAddons = await page.locator('text=Add-ons & Accessories For Your System').isVisible();
  console.log('Instant Review Title visible:', hasReviewTitle);
  console.log('Itemized BOM visible:', hasBOM);
  console.log('Add-ons visible:', hasAddons);

  // Click an add-on (+ Add 2U Rack)
  const rackAddon = page.locator('text=2U Metal DVR/NVR Rack').first();
  await rackAddon.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'live-step3-addon-selected.png', fullPage: false });
  console.log('Step 3: Add-on toggled.');

  // Now click 'Proceed to Final Quotation'
  const proceedBtn = page.locator('button:has-text("Proceed to Final Quotation")').first();
  await proceedBtn.click();
  await page.waitForTimeout(4000);

  console.log('Final URL:', page.url());
  await page.screenshot({ path: 'live-step4-actual-quotation.png', fullPage: false });

  await browser.close();
  console.log('Test completed successfully!');
})();
