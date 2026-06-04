const { chromium } = require('playwright');
const fs = require('fs');

const routes = [
  '/admin/catalog-manager',
  '/admin/wizard',
  '/admin/pricing',
  '/admin/leads',
  '/admin/settings'
];

(async () => {
  console.log('Launching Interactive Click-Crawler...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  await context.addCookies([{
    name: 'admin_session',
    value: 'mock-admin-session',
    domain: 'localhost',
    path: '/'
  }]);

  const page = await context.newPage();
  
  let totalErrors = 0;
  const errorReport = [];

  page.on('console', msg => {
    if(msg.type() === 'error' && !msg.text().includes('violates the following Content Security Policy') && !msg.text().includes('404')) {
      errorReport.push({ type: 'CONSOLE', msg: msg.text() });
    }
  });
  page.on('pageerror', err => {
    errorReport.push({ type: 'CRASH', msg: err.message });
  });
  
  page.on('response', async res => {
    if (res.status() >= 500) {
      errorReport.push({ type: 'HTTP_500', msg: `API Failed: ${res.url()} with ${res.status()}` });
    }
  });

  for (const route of routes) {
    console.log(`\nTesting Interactive Elements on ${route}...`);
    try {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Find all buttons
      const buttons = await page.$$('button');
      console.log(`Found ${buttons.length} buttons on ${route}. Clicking them...`);
      
      for (let i = 0; i < buttons.length; i++) {
         try {
             // Only click if it's visible and doesn't submit a destructive form that navigates away
             const isVisible = await buttons[i].isVisible();
             if (isVisible) {
                 await buttons[i].click({ timeout: 1000, noWaitAfter: true });
                 await page.waitForTimeout(300); // Give UI time to react
             }
         } catch (e) {
             // Ignore buttons that are unclickable (e.g. disabled, hidden by overlay)
         }
      }

      await page.waitForTimeout(1000);

      const pageErrors = errorReport.filter(e => e.route === undefined);
      for (const e of pageErrors) {
         e.route = route;
      }
      
      if (pageErrors.length > 0) {
         console.error(`  --> ${pageErrors.length} ERRORS CAUGHT ON THIS PAGE`);
         totalErrors += pageErrors.length;
      } else {
         console.log('  --> OK');
      }
      
    } catch (e) {
      console.error(`  --> NAVIGATION FAILED: ${e.message}`);
      errorReport.push({ route, type: 'NAVIGATION', msg: e.message });
    }
  }

  await browser.close();
  
  console.log('\n--- FINAL INTERACTIVE REPORT ---');
  if (errorReport.length === 0) {
    console.log('ALL ROUTES PASSED.');
  } else {
    console.log(`${errorReport.length} total issues found.`);
    fs.writeFileSync('admin-interactive-report.json', JSON.stringify(errorReport, null, 2));
    console.log('Saved details to admin-interactive-report.json');
  }
})();
