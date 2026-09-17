const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to Live URL...');
  await page.goto('https://cctvquotation.com/quote/1r3rNLlARJlAiJEc3yIp/review/bpCHJ8udhNlpuTpb9y4i', { waitUntil: 'networkidle' });
  
  // Wait a moment for any animations
  await page.waitForTimeout(3000);
  
  // Try to find the section by scrolling down
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/live-test-desktop.png' });
  
  // Also test mobile view
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
  });
  
  const mobilePage = await mobileContext.newPage();
  console.log('Navigating to Mobile Live URL...');
  await mobilePage.goto('https://cctvquotation.com/quote/1r3rNLlARJlAiJEc3yIp/review/bpCHJ8udhNlpuTpb9y4i', { waitUntil: 'networkidle' });
  
  await mobilePage.waitForTimeout(3000);
  await mobilePage.evaluate(() => window.scrollBy(0, 1000));
  await mobilePage.waitForTimeout(1000);
  
  await mobilePage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/live-test-mobile.png' });
  
  await browser.close();
  console.log('Screenshots saved.');
})();
