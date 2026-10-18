import puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

const ARTIFACT_DIR = path.resolve('C:/Users/hp/.gemini/antigravity/brain/70316928-0cdb-4052-abf5-3c932d270307/wireless_case_study');
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVisualCaseStudy() {
  console.log('🚀 Launching Puppeteer for Visual Case Study...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,1000'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1.5 });

    // Set English language preference in localStorage
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('i18n-storage', JSON.stringify({
        state: { locale: 'en', hasSeenWelcome: true, isManuallySet: true },
        version: 0
      }));
    });

    const leadUrl = 'http://localhost:3000/quote/xEb70qdrBEbsbaObKxGR';
    console.log(`Navigating to ${leadUrl}...`);
    await page.goto(leadUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await sleep(2500);

    // ==========================================
    // SITUATION 1: Catalog with Smart Wireless
    // ==========================================
    console.log('\n--- Capturing Situation 1: Catalog Smart Wireless Tab ---');
    // Find and click the Smart Wireless tab
    const wirelessTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Smart Wireless') || b.textContent?.includes('Zero Wiring'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Smart Wireless tab:', wirelessTabClicked);
    await sleep(2000);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '01_catalog_smart_wireless_tab.png'),
    });
    console.log('📸 Saved 01_catalog_smart_wireless_tab.png');

    // ==========================================
    // SITUATION 2: Instant Quotation Review (Power Socket Nearby / ₹0)
    // ==========================================
    console.log('\n--- Capturing Situation 2: Wireless Review (Zero Wire / Socket Included) ---');
    // Click the first package card to open review
    const cardClicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.cursor-pointer'));
      const packageCard = cards.find(c => c.textContent?.includes('₹') && (c.textContent?.includes('MP') || c.textContent?.includes('Resolution')));
      if (packageCard) {
        (packageCard as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Clicked Package Card for Review:', cardClicked);
    await sleep(2500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '02_wireless_quote_power_socket_included.png'),
    });
    console.log('📸 Saved 02_wireless_quote_power_socket_included.png');

    // ==========================================
    // SITUATION 3: Wireless with Need Electrical Wire (@ ₹10/m)
    // ==========================================
    console.log('\n--- Capturing Situation 3: Selecting Need Electrical Wire ---');
    const wireSelected = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const wireBtn = buttons.find(b => b.textContent?.includes('Need Electrical Wire') || b.textContent?.includes('₹10/m'));
      if (wireBtn) {
        wireBtn.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Need Electrical Wire button:', wireSelected);
    await sleep(2000);

    // Scroll slightly to capture the Power options and the BOM
    await page.evaluate(() => {
      window.scrollBy({ top: 300, behavior: 'instant' });
    });
    await sleep(1000);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '03_wireless_quote_with_2core_electrical_wire.png'),
    });
    console.log('📸 Saved 03_wireless_quote_with_2core_electrical_wire.png');

    // ==========================================
    // SITUATION 4: Full Customizer Panel in Wireless Mode
    // ==========================================
    console.log('\n--- Capturing Situation 4: Full Customizer Panel ---');
    // Scroll back up and click Customize System / Advanced Customizer
    await page.evaluate(() => {
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await sleep(500);

    const customizerOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent?.includes('Customize') || b.textContent?.includes('Advanced Hardware'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Opened Customizer:', customizerOpened);
    await sleep(1500);

    // Click the Accessories / Add-ons tab in Customizer
    const addonsTabClicked = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tab = tabs.find(b => b.textContent?.includes('Accessories') || b.textContent?.includes('Add-ons'));
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Accessories tab in customizer:', addonsTabClicked);
    await sleep(1500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '04_customizer_wireless_power_options.png'),
    });
    console.log('📸 Saved 04_customizer_wireless_power_options.png');

    // ==========================================
    // SITUATION 5: Pro Builder Step 5 (Cables) in Wireless Mode
    // ==========================================
    console.log('\n--- Capturing Situation 5: Pro Builder Wireless Cables Step ---');
    await page.goto('http://localhost:3000/pro-builder', { waitUntil: 'networkidle2', timeout: 35000 });
    await sleep(2000);

    // Select Wireless architecture button
    const wirelessBuilderSelected = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const wirelessBtn = buttons.find(b => b.textContent?.includes('Wireless (Wi-Fi / 4G)'));
      if (wirelessBtn) {
        wirelessBtn.click();
        return true;
      }
      return false;
    });
    console.log('Selected Wireless in Pro Builder:', wirelessBuilderSelected);
    await sleep(2000);

    // Navigate to step 5 (Cables)
    const step5Clicked = await page.evaluate(() => {
      const stepButtons = Array.from(document.querySelectorAll('button'));
      const cableStep = stepButtons.find(s => s.textContent?.includes('Cables') || s.textContent?.includes('5. Cables'));
      if (cableStep) {
        cableStep.click();
        return true;
      }
      return false;
    });
    console.log('Navigated to Cables step in Pro Builder:', step5Clicked);
    await sleep(2500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '05_pro_builder_wireless_cables_step.png'),
    });
    console.log('📸 Saved 05_pro_builder_wireless_cables_step.png');

    console.log('\n✨ All visual case study screenshots successfully captured and verified!');

  } catch (err) {
    console.error('Error during visual capture:', err);
  } finally {
    await browser.close();
  }
}

runVisualCaseStudy().catch(console.error);
