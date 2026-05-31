const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => {
    console.log('🚨 CLIENT-SIDE PAGE ERROR:', err.toString());
  });

  console.log('Navigating to quote page...');
  await page.goto('http://localhost:3000/quote/hkq0Q9uPR0NtchfibYCd', { waitUntil: 'networkidle2' });

  console.log('Taking screenshot to check state...');
  await page.screenshot({ path: 'quote-debug.png' });
  
  console.log('Checking page content...');
  const text = await page.evaluate(() => document.body.innerText);
  if (text.includes('Manifest Loading Failure')) {
    console.log('❌ Error: Manifest Loading Failure detected in DOM!');
  } else {
    console.log('✅ Success: Quote page rendered successfully!');
  }

  await browser.close();
  process.exit(0);
})();
