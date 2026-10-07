import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://127.0.0.1:3000/wizard?city=Jaipur&pincode=302012&served=true', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
  } catch (err) {
    console.log('Navigation error:', err);
  }
  
  await browser.close();
})();
