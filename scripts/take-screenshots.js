const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Create a mobile context to test the sticky UI properly
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12/13 size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await mobileContext.newPage();

  try {
    // 1. Landing Page
    console.log("Navigating to Landing Page...");
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000); 
    
    // Select language to dismiss modal
    console.log("Dismissing language modal...");
    await page.click('button:has-text("English")', { force: true }).catch(e => console.log("Modal already dismissed", e));
    await page.waitForTimeout(1000);
    
    // Type 6 digits in Pincode to see the Checkmark
    console.log("Testing Pincode validation...");
    // Pincode input has inputMode="numeric"
    await page.fill('input[inputMode="numeric"]', '302017');
    await page.waitForTimeout(1000); // wait for border transition and icon
    await page.screenshot({ path: 'screenshot_1_pincode_success.png' });

    // Click Check Area to go to wizard
    await page.click('button:has-text("Check Area")');
    await page.waitForTimeout(2000);
    
    console.log("Navigating to Quote Page Mobile View...");
    await page.goto('http://localhost:3000/quote/mock-lead/review/mock-quote', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => console.log("Goto timeout but might be loaded", e.message));
    await page.waitForTimeout(5000); // let it load the client components
    
    // Take a screenshot of the top of the quote
    await page.screenshot({ path: 'screenshot_2_quote_mobile_top.png' });
    
    // Scroll a bit to verify sticky bar stays at the bottom
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshot_3_quote_mobile_scrolled.png' });

  } catch (err) {
    console.error("Error taking screenshots:", err);
  } finally {
    await browser.close();
  }
})();
