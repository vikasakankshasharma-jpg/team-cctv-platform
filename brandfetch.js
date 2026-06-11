const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('https://brandfetch.com/hikvision.com', { waitUntil: 'networkidle2' });
  // find the img src that contains the logo
  const hikvisionUrl = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const logoImg = imgs.find(img => img.src && img.src.includes('asset'));
    return logoImg ? logoImg.src : null;
  });
  console.log('Hikvision URL:', hikvisionUrl);
  
  await page.goto('https://brandfetch.com/dahuasecurity.com', { waitUntil: 'networkidle2' });
  const dahuaUrl = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const logoImg = imgs.find(img => img.src && img.src.includes('asset'));
    return logoImg ? logoImg.src : null;
  });
  console.log('Dahua URL:', dahuaUrl);
  
  await browser.close();
})();
