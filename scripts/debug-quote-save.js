const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to live quote page...');
  await page.goto('https://cctvquotation.com/quote/276gQ5K232tHPJ0hXx0e', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("View Full Quotation")', { timeout: 15000 });

  // Click on the CP Plus card
  const cardBtn = page.locator('button:has-text("View Full Quotation")').nth(1);
  await cardBtn.click();
  await page.waitForTimeout(2000);

  const summaryEl = page.locator('text=Grand Total Payable:');
  await summaryEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'live-bom-summary-verified.png' });
  console.log('Saved live-bom-summary-verified.png');

  console.log('Clicked Proceed to Final Quotation. Waiting for navigation or network response...');
  
  try {
    const response = await page.waitForResponse(res => res.url().includes('/api/quotes') && res.request().method() === 'POST', { timeout: 10000 });
    console.log('POST /api/quotes status:', response.status());
    const body = await response.text();
    console.log('POST /api/quotes response body:', body);
  } catch (e) {
    console.log('Failed waiting for /api/quotes response:', e.message);
  }

  await page.waitForTimeout(3000);
  console.log('Current URL now:', page.url());
  await page.screenshot({ path: 'live-step4-debug.png', fullPage: false });

  await browser.close();
})();
