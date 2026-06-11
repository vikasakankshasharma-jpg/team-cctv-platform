const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set a standard desktop User-Agent
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
  
  let response = await page.goto('https://upload.wikimedia.org/wikipedia/commons/7/77/Dahua_Technology_logo.svg');
  let buffer = await response.buffer();
  fs.writeFileSync('public/partners/dahua.svg', buffer);
  
  response = await page.goto('https://upload.wikimedia.org/wikipedia/commons/a/ae/Hikvision_logo.svg');
  buffer = await response.buffer();
  fs.writeFileSync('public/partners/hikvision.svg', buffer);
  
  await browser.close();
  console.log('done downloading buffers');
})();
