const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  
  const page = await context.newPage();
  
  const languages = [
    { name: 'English', suffix: 'en' },
    { name: 'हिंदी (Hindi)', suffix: 'hi' },
    { name: 'मराठी (Marathi)', suffix: 'mr' },
    { name: 'ગુજરાતી (Gujarati)', suffix: 'gu' }
  ];

  try {
    for (const lang of languages) {
      console.log(`Navigating to Landing Page and selecting ${lang.name}...`);
      await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Select language
      console.log(`Dismissing language modal for ${lang.name}...`);
      await page.click(`button:has-text("${lang.name}")`, { force: true }).catch(e => console.log("Modal already dismissed"));
      await page.waitForTimeout(1000);
      
      // Take a screenshot of the hero section
      await page.screenshot({ path: `screenshot_landing_${lang.suffix}.png`, fullPage: false });
      
      // Clear cookies/localStorage to trigger the modal again on next load
      await context.clearCookies();
      await page.evaluate(() => window.localStorage.clear());
    }
    
    console.log("All screenshots taken successfully.");
    
  } catch (err) {
    console.error("Error taking screenshots:", err.message);
  } finally {
    await browser.close();
  }
})();
