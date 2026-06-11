const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('https://upload.wikimedia.org/wikipedia/commons/7/77/Dahua_Technology_logo.svg');
  const svgContent = await page.evaluate(() => document.documentElement.outerHTML);
  
  fs.writeFileSync('public/partners/dahua.svg', svgContent);
  
  // also get hikvision properly
  await page.goto('https://upload.wikimedia.org/wikipedia/commons/a/ae/Hikvision_logo.svg');
  const hikContent = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('public/partners/hikvision.svg', hikContent);
  
  await browser.close();
  console.log('done');
})();
