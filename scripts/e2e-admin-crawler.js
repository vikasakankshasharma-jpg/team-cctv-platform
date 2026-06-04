const { chromium } = require('playwright');
const fs = require('fs');

const routes = [
  '/admin/addons',
  '/admin/bookings',
  '/admin/campaigns',
  '/admin/card-layouts',
  '/admin/catalog-manager',
  '/admin/commission',
  '/admin/compatibility',
  '/admin/dispatch',
  '/admin/expansion',
  '/admin/hubs',
  '/admin/installers',
  '/admin/leads',
  '/admin/payouts',
  '/admin/pricing',
  '/admin/pricing/geo-rules',
  '/admin/pricing/logs',
  '/admin/pricing/matrices',
  '/admin/products',
  '/admin/products/bulk',
  '/admin/products/health',
  '/admin/promoters',
  '/admin/reports',
  '/admin/reports/logs',
  '/admin/rules',
  '/admin/salespersons',
  '/admin/settings',
  '/admin/wizard'
];

(async () => {
  console.log('Launching crawler...');
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

  for (const route of routes) {
    console.log('\nVisiting ' + route + '...');
    try {
      const response = await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      if (response && response.status() >= 400 && response.status() !== 404) {
        console.error('  --> HTTP ERROR ' + response.status());
        errorReport.push({ route, type: 'HTTP', msg: 'Status ' + response.status() });
      }

      const bodyText = await page.innerText('body');
      if (bodyText.includes('Application Error') || bodyText.includes('Manifest Loading Failure') || bodyText.includes('TypeError')) {
         console.error('  --> BOUNDARY ERROR DETECTED');
         errorReport.push({ route, type: 'BOUNDARY', msg: 'React Error Boundary Triggered' });
      }

      const pageErrors = errorReport.filter(e => e.route === undefined);
      for (const e of pageErrors) {
         e.route = route;
      }
      
      if (pageErrors.length > 0) {
         console.error('  --> ' + pageErrors.length + ' ERRORS CAUGHT ON THIS PAGE');
         totalErrors += pageErrors.length;
      } else {
         console.log('  --> OK');
      }
      
    } catch (e) {
      console.error('  --> NAVIGATION FAILED: ' + e.message);
      errorReport.push({ route, type: 'NAVIGATION', msg: e.message });
    }
  }

  await browser.close();
  
  console.log('\n--- FINAL REPORT ---');
  if (errorReport.length === 0) {
    console.log('ALL ROUTES PASSED.');
  } else {
    console.log(errorReport.length + ' total issues found.');
    fs.writeFileSync('admin-crawler-report.json', JSON.stringify(errorReport, null, 2));
    console.log('Saved details to admin-crawler-report.json');
  }
})();
