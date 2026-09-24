const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Setting up mock auth session...");
  await page.setCookie({
    name: 'admin_session',
    value: 'mock_session_super_admin',
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  const urls = [
    { name: 'step13_kyc_onboarding', url: 'http://localhost:3000/onboarding' },
    { name: 'step14_logistics_engine', url: 'http://localhost:3000/admin/logistics' },
    { name: 'step15_finance_exports', url: 'http://localhost:3000/admin/finance/exports' }
  ];

  for (const { name, url } of urls) {
    console.log("Navigating to " + url + "...");
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait for React to render and hydrate
      await new Promise(r => setTimeout(r, 4000));
      
      const savePath = "C:/Users/hp/.gemini/antigravity/brain/1be78992-3ad5-4b7e-a2e5-9353d047dbdf/" + name + ".png";
      await page.screenshot({ path: savePath, fullPage: true });
      console.log("Saved " + savePath);
    } catch (e) {
      console.error("Failed to capture " + name + ":", e);
    }
  }

  await browser.close();
  console.log("Done!");
})();
