const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let hasErrors = false;
  page.on('console', msg => {
    if(msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      hasErrors = true;
    }
  });
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
    hasErrors = true;
  });

  try {
    console.log('Navigating to Wizard...');
    await page.goto('http://localhost:3000/wizard');
    await page.waitForLoadState('networkidle');

    console.log('Selecting Options...');
    await page.click('text=Residential');
    await page.waitForTimeout(500);
    
    await page.click('text=IP Cameras');
    await page.waitForTimeout(500);
    
    await page.click('text=4 Cameras');
    await page.waitForTimeout(500);
    
    await page.click('text=Yes, cable is laid');
    await page.waitForTimeout(500);
    
    console.log('Filling Contact Form...');
    // We can just type directly if we find inputs
    const inputs = await page.$$('input');
    await inputs[0].fill('9876543210');
    await inputs[1].fill('Customer Test');
    await inputs[2].fill('302012');
    
    console.log('Submitting...');
    await page.click('button[type="submit"]');
    
    // Wait for the OTP modal
    console.log('Waiting for OTP...');
    await page.waitForTimeout(2000);
    
    // Since we don't have real OTP without Firebase interaction (or the test environment bypassing it),
    // let's just visit a predefined quote page instead to test the rest of the cycle.
    console.log('Navigating to predefined quote page...');
    await page.goto('http://localhost:3000/quote/TIZKBIOIa4oKFIh5UHsp');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const bodyText = await page.innerText('body');
    if (bodyText.includes('Manifest Loading Failure') || bodyText.includes('Application Error')) {
      console.log('ERROR: Found Error Boundary text on screen!');
      hasErrors = true;
    } else {
      console.log('Quote page loaded successfully.');
    }
    
    await page.screenshot({ path: 'artifacts/media__customer_flow.png' });
    console.log('Screenshot saved to artifacts/media__customer_flow.png');
    
  } catch (err) {
    console.error('SCRIPT ERROR:', err.message);
    hasErrors = true;
  } finally {
    await browser.close();
    console.log('RESULT:', hasErrors ? 'FAILED' : 'SUCCESS');
    process.exit(hasErrors ? 1 : 0);
  }
})();
