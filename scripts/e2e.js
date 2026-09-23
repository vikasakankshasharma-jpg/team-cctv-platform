const { chromium } = require('playwright');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const baseUrl = 'http://localhost:3000';
  const outDir = './artifacts/screenshots/e2e';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('1. Homepage');
  await page.goto(`${baseUrl}/wizard`);
  await page.screenshot({ path: `${outDir}/1_wizard.png` });

  await browser.close();
}
main();
