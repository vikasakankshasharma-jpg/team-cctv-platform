const { chromium, devices } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13 Pro Max'],
  });

  const baseUrl = 'http://localhost:3000';

  const routes = [
    { name: 'after-customer-home', path: '/' },
    { name: 'after-customer-wizard', path: '/wizard' },
    { name: 'after-admin-dashboard', path: '/admin' },
    { name: 'after-installer-dashboard', path: '/installer/dashboard' },
    { name: 'after-partner-dashboard', path: '/partner/dashboard' },
    { name: 'after-sales-dashboard', path: '/salesperson/dashboard' },
    { name: 'after-admin-login', path: '/admin/login' },
    { name: 'after-customer-build', path: '/build' },
  ];

  if (!fs.existsSync('./artifacts/screenshots')) {
    fs.mkdirSync('./artifacts/screenshots', { recursive: true });
  }

  for (const route of routes) {
    console.log(`Navigating to ${route.path}...`);
    try {
      const page = await context.newPage();
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'load', timeout: 30000 });
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
