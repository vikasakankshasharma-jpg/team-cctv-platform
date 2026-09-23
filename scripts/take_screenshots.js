const { chromium, devices } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13 Pro Max'],
  });
  
  const baseUrl = 'http://localhost:3000';
  
  const routes = [
    { name: 'customer-home', path: '/' },
    { name: 'customer-wizard', path: '/wizard' },
    { name: 'admin-dashboard', path: '/admin' },
    { name: 'installer-dashboard', path: '/installer/dashboard' },
    { name: 'partner-dashboard', path: '/partner/dashboard' },
    { name: 'sales-dashboard', path: '/salesperson/dashboard' }
  ];

  if (!fs.existsSync('./artifacts/screenshots')) {
    fs.mkdirSync('./artifacts/screenshots', { recursive: true });
  }

  for (const route of routes) {
    console.log(`Navigating to ${route.path}...`);
    try {
      const page = await context.newPage();
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'load', timeout: 30000 });
      // wait a bit for any dynamic rendering
      await page.waitForTimeout(5000);
      await page.screenshot({ path: `./artifacts/screenshots/${route.name}.png`, fullPage: true });
      console.log(`Saved screenshot for ${route.name}`);
      await page.close();
    } catch (e) {
      console.error(`Failed to screenshot ${route.name}:`, e.message);
    }
  }

  await browser.close();
}

main();
