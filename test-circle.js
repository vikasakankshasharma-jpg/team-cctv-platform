const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  
  const page = await browser.newPage();
  
  // Intercept logs
  page.on('console', msg => console.log('LOG:', msg.text()));
  
  console.log("Navigating to http://localhost:3000/test-map...");
  await page.goto('http://localhost:3000/test-map', { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log("Waiting 5 seconds for map to render circles...");
  await new Promise(r => setTimeout(r, 5000));
  
  // Let's take a screenshot to verify!
  await page.screenshot({ path: 'map-circle-test.png' });
  console.log("Screenshot saved to map-circle-test.png");
  
  await browser.close();
})();
