const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('https://cctvquotation.com/admin/salespersons', { waitUntil: 'networkidle2' });
  
  // Wait for the district to load, let's just observe the console for 10 seconds
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
})();
