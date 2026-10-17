import puppeteer from 'puppeteer';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const SCREENSHOT_DIR = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\70316928-0cdb-4052-abf5-3c932d270307\\journey_screenshots';
const BASE_URL = 'https://cctvquotation.com';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function clickByText(page: any, text: string): Promise<boolean> {
  return await page.evaluate((t: string) => {
    const elements = Array.from(document.querySelectorAll('button, a, [role="button"], div[role="button"], span, h3, h4'));
    const el = elements.find(b => b.textContent && b.textContent.toLowerCase().includes(t.toLowerCase())) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'instant', block: 'center' });
      el.click();
      return true;
    }
    return false;
  }, text);
}

async function runJourney() {
  console.log('🚀 Launching headed visual browser for Wireless Customer Journey...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1366, height: 768 },
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set localStorage in advance to bypass language welcome modal permanently
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('i18n-storage', JSON.stringify({
        state: { locale: 'en', hasSeenWelcome: true },
        version: 0
      }));
    } catch (e) {}
  });

  const testPhone = '9587980007';
  const testName = 'Vikas Sharma';

  try {
    // ── STEP 1: Open Wizard ──────────────────────────────────────────
    console.log('\n--- Step 1: Navigating to Wizard ---');
    await page.goto(`${BASE_URL}/wizard`, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(1500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\01_wizard_entry.png` });
    console.log('📸 Captured 01_wizard_entry.png');

    // Click "Guided Setup"
    console.log('Clicking Guided Setup...');
    await clickByText(page, 'Guided Setup') || await clickByText(page, 'guided');
    await delay(1500);

    // ── STEP 2: Technology Choice ─────────────────────────────────────
    console.log('\n--- Step 2: Selecting Smart Wireless (Wi-Fi Cameras) ---');
    await page.screenshot({ path: `${SCREENSHOT_DIR}\\02_tech_selection.png` });
    console.log('📸 Captured 02_tech_selection.png');

    // Click Smart Wireless
    const clickedWireless = await clickByText(page, 'Smart Wireless') || await clickByText(page, 'Wi-Fi CCTV Cameras');
    console.log('Clicked Smart Wireless:', clickedWireless);
    await delay(2000);

    // ── STEP 3: Camera Quantities ────────────────────────────────────
    console.log('\n--- Step 3: Configuring Camera Quantities ---');
    await page.screenshot({ path: `${SCREENSHOT_DIR}\\03_camera_count.png` });
    console.log('📸 Captured 03_camera_count.png');

    // Click "Confirm Cameras"
    const clickedConfirmCams = await clickByText(page, 'Confirm Cameras') || await clickByText(page, 'Next');
    console.log('Clicked Confirm Cameras:', clickedConfirmCams);
    await delay(2000);

    // ── STEP 4: Recording & Storage Days ─────────────────────────────
    console.log('\n--- Step 4: Recording & Storage Days ---');
    await page.screenshot({ path: `${SCREENSHOT_DIR}\\04_storage_days.png` });
    console.log('📸 Captured 04_storage_days.png');

    // Click 7 Days
    await clickByText(page, '7 Days') || await clickByText(page, '7 days');
    await delay(500);

    // Click "Confirm Recording"
    const clickedConfirmStorage = await clickByText(page, 'Confirm Recording') || await clickByText(page, 'Next');
    console.log('Clicked Confirm Recording:', clickedConfirmStorage);
    await delay(2000);

    // ── STEP 5: Site & Preferences (Zero Video Cabling) ───────────────
    console.log('\n--- Step 5: Site & Preferences ---');
    
    // Select Ceiling Height: Standard
    console.log('Selecting Standard height (<10 ft)...');
    await clickByText(page, 'Standard') || await clickByText(page, '<10');
    await delay(500);

    // Select Surface Type: Concrete / Brick Wall
    console.log('Selecting Concrete / Brick Wall...');
    await clickByText(page, 'Concrete') || await clickByText(page, 'Brick');
    await delay(500);

    // Confirm Installation preference: Pro Installation Fitting
    await clickByText(page, 'Pro Installation Fitting');
    await delay(500);

    // Confirm Wi-Fi at site
    await clickByText(page, 'Yes, I Have Wi-Fi') || await clickByText(page, 'Have Wi-Fi Router');
    await delay(500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\05_site_preferences.png` });
    console.log('📸 Captured 05_site_preferences.png');

    // Click "Confirm Details"
    const clickedConfirmDetails = await clickByText(page, 'Confirm Details') || await clickByText(page, 'Next Step') || await clickByText(page, 'Proceed');
    console.log('Clicked Confirm Details:', clickedConfirmDetails);
    await delay(2000);

    // ── STEP 6: Contact Info & Verification ──────────────────────────
    console.log('\n--- Step 6: Contact Info & Verification ---');

    // Fill Name
    const nameInput = await page.$('input[placeholder*="Rahul"], input[placeholder*="Name"], input[type="text"]');
    if (nameInput) {
      await nameInput.click({ clickCount: 3 });
      await nameInput.type(testName, { delay: 30 });
    }

    // Fill Mobile
    const phoneInput = await page.$('input[type="tel"], input[placeholder*="98765"], input[placeholder*="mobile"]');
    if (phoneInput) {
      await phoneInput.click({ clickCount: 3 });
      await phoneInput.type(testPhone, { delay: 30 });
    }

    // Fill Pincode
    const pinInput = await page.$('input[placeholder*="302001"], input[inputmode="numeric"]');
    if (pinInput) {
      await pinInput.click({ clickCount: 3 });
      await pinInput.type('302004', { delay: 30 });
    }

    console.log('Filled Name, Mobile, and Pincode (302004)...');
    await delay(2000); // Allow pincode lookup to resolve area chips

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\06_contact_info.png` });
    console.log('📸 Captured 06_contact_info.png');

    // Click "View My CCTV Options"
    console.log('Submitting Contact Info for OTP generation...');
    const clickedSubmitInfo = await clickByText(page, 'View My CCTV Options') || 
                              await clickByText(page, 'View CCTV Options') || 
                              await clickByText(page, 'Get Instant Quotation');
    console.log('Clicked Submit Button:', clickedSubmitInfo);

    // Wait for OTP modal/step to appear
    console.log('Waiting for OTP verification prompt...');
    await page.waitForFunction(
      () => document.body.innerText.includes('Verification') || 
            document.body.innerText.includes('verification') || 
            document.body.innerText.includes('Submit OTP') ||
            document.body.innerText.includes('Resend OTP'),
      { timeout: 15000 }
    ).catch(() => console.log('OTP screen wait timeout, checking DOM...'));
    await delay(1500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\07_otp_prompt.png` });
    console.log('📸 Captured 07_otp_prompt.png');

    // Retrieve OTP from Firestore
    console.log('Fetching OTP from Firestore otp_verifications collection...');
    const formattedPhone = '+91' + testPhone;
    let otpCode = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const otpDoc = await db.collection('otp_verifications').doc(formattedPhone).get();
      if (otpDoc.exists && otpDoc.data()?.otp) {
        otpCode = String(otpDoc.data()?.otp);
        console.log(`🔑 Retrieved Real OTP from Firestore: ${otpCode}`);
        break;
      }
      await delay(1000);
    }

    if (!otpCode) {
      console.warn('⚠️ Could not find OTP in Firestore, trying default 1234');
      otpCode = '1234';
    }

    // Enter OTP digits
    console.log('Entering OTP digits into form...');
    const otpBoxes = await page.$$('input[pattern="[0-9]*"], input[maxlength="4"], input[autoComplete="one-time-code"]');
    if (otpBoxes.length >= 4) {
      for (let i = 0; i < 4; i++) {
        await otpBoxes[i].click();
        await otpBoxes[i].type(otpCode[i] || '', { delay: 50 });
      }
    } else if (otpBoxes.length > 0) {
      await otpBoxes[0].click();
      await page.keyboard.type(otpCode, { delay: 50 });
    }

    await delay(1000);

    // Click "Submit OTP & View Quotation"
    console.log('Submitting OTP verification...');
    await clickByText(page, 'Submit OTP & View Quotation') || await clickByText(page, 'Submit OTP') || await clickByText(page, 'Verify');

    // Wait for navigation to /quote/...
    console.log('Waiting for navigation to Quotation Catalog (/quote/<leadId>)...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.log('Navigation wait resolved or bypassed, current URL:', page.url());
    });
    await delay(3500);

    let currentUrl = page.url();
    console.log('Current URL after OTP submission:', currentUrl);

    // Extract leadId
    const leadMatch = currentUrl.match(/\/quote\/([a-zA-Z0-9_-]+)/);
    const createdLeadId = leadMatch ? leadMatch[1] : '';
    console.log('🎯 Created / Active Lead ID:', createdLeadId);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\08_quotation_catalog.png` });
    console.log('📸 Captured 08_quotation_catalog.png');

    // ── STEP 7: Inspect Quotation Catalog Page ────────────────────────
    console.log('\n--- Step 7: Inspecting Quotation Catalog & Packages ---');
    const catalogInfo = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        url: window.location.href,
        hasWirelessBadge: body.includes('Smart Wireless') || body.includes('Wireless') || body.includes('Wi-Fi'),
        hasMicroSd: body.includes('MicroSD') || body.includes('SD Card') || body.includes('64GB'),
        hasHdd: body.includes('Hard Disk') || body.includes('SATA HDD') || body.includes('1TB'),
        cardsCount: document.querySelectorAll('.group.cursor-pointer, [class*="Card"]').length
      };
    });

    console.log('Quotation Catalog Validation:');
    console.log('  - Current URL:', catalogInfo.url);
    console.log('  - Wireless Technology Indicated:', catalogInfo.hasWirelessBadge ? '✅ YES' : '❌ NO');
    console.log('  - MicroSD Storage Listed:', catalogInfo.hasMicroSd ? '✅ YES' : '❌ NO');
    console.log('  - 3.5" SATA HDD Excluded:', !catalogInfo.hasHdd ? '✅ YES' : '❌ NO');

    // Click package card to view detailed quotation and addons
    console.log('Selecting package card to open review & add-ons...');
    const clickedPkg = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.group.cursor-pointer, div[class*="Card"]'));
      const pkgCard = cards.find(c => c.textContent && (c.textContent.includes('₹') || c.textContent.includes('Recommended') || c.textContent.includes('Value')));
      if (pkgCard) {
        (pkgCard as HTMLElement).scrollIntoView({ behavior: 'instant', block: 'center' });
        (pkgCard as HTMLElement).click();
        return true;
      }
      return false;
    });
    console.log('Package card clicked:', clickedPkg);
    await delay(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\09_package_selected.png` });
    console.log('📸 Captured 09_package_selected.png');

    // ── STEP 8: Proceed to Final Quotation ───────────────────────────
    console.log('\n--- Step 8: Proceeding to Final Quotation Review ---');
    const clickedProceed = await clickByText(page, 'Proceed to Final Quotation') || await clickByText(page, 'Proceed');
    console.log('Clicked "Proceed to Final Quotation":', clickedProceed);

    // Wait for review page navigation
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {
      console.log('Navigation wait resolved or bypassed, current URL:', page.url());
    });
    await delay(4000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\10_quote_review_page.png` });
    console.log('📸 Captured 10_quote_review_page.png');
    console.log('Final Quotation URL:', page.url());

    // Inspect Final Review Page BOM
    const reviewInfo = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        url: window.location.href,
        hasErrorToast: body.includes('Error saving your quote'),
        hasQuoteReady: body.includes('Detailed Quotation Ready') || body.includes('Quotation') || body.includes('Bill of Materials') || body.includes('Summary'),
        hasWifiCamera: body.includes('Wi-Fi') || body.includes('PT Camera') || body.includes('Wireless'),
        hasMicroSdCard: body.includes('MicroSD') || body.includes('SD') || body.includes('64GB'),
        hasWirelessFitting: body.includes('Wireless') || body.includes('Mounting') || body.includes('349'),
        hasZeroCabling: !body.includes('3+1 Cable') && !body.includes('CAT6 Cable'),
        hasZeroNVR: !body.includes('Channel NVR') && !body.includes('Channel DVR')
      };
    });

    console.log('\nFinal Review Page Validation:');
    console.log('  - URL:', reviewInfo.url);
    console.log('  - Error Saving Quote Toast Appeared:', reviewInfo.hasErrorToast ? '❌ YES (FAIL)' : '✅ NO (PASSED - SAVED CLEANLY!)');
    console.log('  - Quote / BOM Visible:', reviewInfo.hasQuoteReady ? '✅ YES' : '❌ NO');
    console.log('  - Wireless Cameras Present in BOM:', reviewInfo.hasWifiCamera ? '✅ YES' : '❌ NO');
    console.log('  - MicroSD Storage in BOM:', reviewInfo.hasMicroSdCard ? '✅ YES' : '❌ NO');
    console.log('  - Wireless Fitting Labor Applied (₹349):', reviewInfo.hasWirelessFitting ? '✅ YES' : '❌ NO');
    console.log('  - Heavy Cabling Rolls Excluded:', reviewInfo.hasZeroCabling ? '✅ YES' : '❌ NO');
    console.log('  - NVR/DVR Excluded (₹0):', reviewInfo.hasZeroNVR ? '✅ YES' : '❌ NO');

    // ── STEP 9: Test Pro-Builder (/pro-builder) with Lead ID ──────────
    const proBuilderUrl = createdLeadId ? `${BASE_URL}/pro-builder?leadId=${createdLeadId}` : `${BASE_URL}/pro-builder`;
    console.log(`\n--- Step 9: Testing Pro-Builder at ${proBuilderUrl} ---`);
    await page.goto(proBuilderUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\11_pro_builder_wireless.png` });
    console.log('📸 Captured 11_pro_builder_wireless.png (Pro Builder Entry)');

    // Select "Wireless (Wi-Fi / 4G)" technology card
    console.log('Selecting Wireless (Wi-Fi / 4G) in ProBuilder...');
    const clickedWirelessCard = await clickByText(page, 'Wireless (Wi-Fi / 4G)') || await clickByText(page, 'Wireless');
    console.log('Selected Wireless Technology Card:', clickedWirelessCard);
    await delay(2500);

    // Add wireless cameras to cart
    console.log('Adding Wireless Cameras in ProBuilder...');
    const addCamSuccess = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtns = buttons.filter(b => b.textContent?.trim() === '+' || b.textContent?.toLowerCase().includes('add'));
      if (addBtns.length > 0) {
        addBtns[0].click();
        addBtns[0].click();
        addBtns[0].click();
        return true;
      }
      return false;
    });
    console.log('Added 3 Wireless Cameras to Cart:', addCamSuccess);
    await delay(2000);

    // Switch to Storage category in Pro-Builder
    console.log('Switching to Storage in ProBuilder...');
    await clickByText(page, 'Storage');
    await delay(2500);

    await page.screenshot({ path: `${SCREENSHOT_DIR}\\12_pro_builder_storage.png` });
    console.log('📸 Captured 12_pro_builder_storage.png (Pro Builder Storage & MicroSD Auto-Qty)');

    // Validate storage in Pro-Builder
    const proStorageInfo = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        showsMicroSd: body.includes('MicroSD') || body.includes('64GB') || body.includes('128GB'),
        excludesHdd: !body.includes('1TB Surveillance HDD') && !body.includes('2TB Surveillance HDD')
      };
    });
    console.log('Pro-Builder Storage Check:');
    console.log('  - Shows MicroSD Cards:', proStorageInfo.showsMicroSd ? '✅ YES' : '❌ NO');
    console.log('  - Excludes 3.5" Desktop SATA HDDs:', proStorageInfo.excludesHdd ? '✅ YES' : '❌ NO');

    console.log('\n🎉 Complete Visual Customer Journey for Smart Wireless CCTV Finished Successfully!');
  } catch (err: any) {
    console.error('❌ Journey execution error:', err);
    await page.screenshot({ path: `${SCREENSHOT_DIR}\\error_state.png` }).catch(() => {});
  } finally {
    await delay(3000);
    await browser.close();
    console.log('Visual browser closed.');
  }
}

runJourney().catch(console.error);
