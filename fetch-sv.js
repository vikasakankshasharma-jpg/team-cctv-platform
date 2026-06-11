const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://upload.wikimedia.org/wikipedia/commons/7/77/Dahua_Technology_logo.svg');
  const dahuaSvg = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('public/partners/dahua.svg', dahuaSvg);
  
  await page.goto('https://upload.wikimedia.org/wikipedia/commons/a/ae/Hikvision_logo.svg');
  const hikvisionSvg = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('public/partners/hikvision.svg', hikvisionSvg);
  
  await browser.close();
  console.log('done downloading svgs');
})();
