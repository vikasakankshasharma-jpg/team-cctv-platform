const { chromium } = require('playwright');
const fs = require('fs');

const OTP_FILE = 'otp.txt';

(async () => {
  if (fs.existsSync(OTP_FILE)) {
    fs.unlinkSync(OTP_FILE);
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  async function clickText(text) {
    await page.waitForTimeout(500); // Wait a bit for React to render
    await page.evaluate((textToFind) => {
      const elements = Array.from(document.querySelectorAll('button, div, span'));
      const target = elements.find(el => el.textContent && el.textContent.includes(textToFind) && !el.children.length);
      if (target) {
        target.closest('button').click();
      } else {
        const btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes(textToFind));
        if (btn) btn.click();
      }
    }, text);
  }

  console.log("Navigating to live website wizard...");
  await page.goto('https://cctvquotation.com/wizard?city=Jaipur&pincode=302012&served=true');

  console.log("Step 0: Guided Setup");
  await clickText("Guided Setup");

  console.log("Step 1: Property Type");
  await clickText("Completely New System");

  console.log("Step 2: Cameras");
  await clickText("Confirm Cameras");

  console.log("Step 3: Storage");
  await clickText("Confirm Recording");

  console.log("Step 4: Site Preferences");
  await clickText("Standard");
  await clickText("Concrete");
  await clickText("Surveillance");
  await clickText("Concealed");
  await clickText("No Limit");
  await clickText("Confirm Details");

  console.log("Step 5: Contact Details");
  await page.waitForTimeout(1000);
  await page.locator('input[placeholder="e.g. Rahul Kumar"]').fill('Vijay');
  await page.locator('input[placeholder="10-digit mobile number"]').fill('9772699395');

  console.log("Submitting details to get OTP...");
  await clickText("View My CCTV Options");

  // Wait for OTP input
  console.log("Waiting for OTP screen or error...");
  try {
    let success = false;
    for (let i = 0; i < 30; i++) {
      const isError = await page.isVisible('ol li[role="status"]');
      if (isError) {
        const errorText = await page.locator('ol li[role="status"]').textContent();
        console.error("❌ Error Toast Appeared:", errorText);
        await page.screenshot({ path: 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\689dacce-cf36-4a97-8543-7d5eba62c379\\scratch\\error.png' });
        await browser.close();
        process.exit(1);
      }
      
      const isOtpScreen = await page.isVisible('text="Enter Verification Code"');
      if (isOtpScreen) {
        success = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    
    if (!success) throw new Error("Timeout");

    console.log("✅ OTP requested successfully! Waiting for you to provide it...");
    console.log("AGENT_ACTION_REQUIRED: OTP_REQUESTED");
  } catch (error) {
    console.error("❌ Timeout waiting for OTP screen or error.");
    await page.screenshot({ path: 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\689dacce-cf36-4a97-8543-7d5eba62c379\\scratch\\timeout.png' });
    await browser.close();
    process.exit(1);
  }

  // Poll for otp.txt
  console.log(`Polling for ${OTP_FILE} ...`);
  let otp = null;
  while (!otp) {
    if (fs.existsSync(OTP_FILE)) {
      otp = fs.readFileSync(OTP_FILE, 'utf8').trim();
      if (otp.length === 6) {
        console.log(`Found OTP: ${otp}. Entering it now...`);
        break;
      } else {
        otp = null; 
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // Enter OTP
  const otpInputs = await page.locator('input[inputmode="numeric"]').all();
  if (otpInputs.length === 6) {
    for (let i = 0; i < 6; i++) {
      await otpInputs[i].fill(otp[i]);
    }
  }

  console.log("Clicking Verify...");
  await clickText("Verify");

  // Wait for quote generation
  console.log("Waiting for Quote to generate...");
  try {
    let done = false;
    for (let i = 0; i < 60; i++) {
      const hasQuote = await page.isVisible('text="Configuration Summary"') || await page.isVisible('text="Compare Top Brands"');
      if (hasQuote) {
        done = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    if (!done) throw new Error("Timeout");
    
    console.log("✅ Quote generated successfully!");
    
    if (fs.existsSync(OTP_FILE)) {
      fs.unlinkSync(OTP_FILE);
    }
    
    console.log("✅ FULL CYCLE TEST SUCCESSFUL!");
    await browser.close();
  } catch (error) {
    console.error("❌ Failed to generate quote after OTP.");
    await browser.close();
    process.exit(1);
  }
})();
