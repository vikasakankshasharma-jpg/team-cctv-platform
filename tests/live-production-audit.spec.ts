import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PROD_SCREENSHOTS_DIR = path.join(__dirname, '..', 'test-results', 'live-prod-screenshots');

test.describe('Live Production Website Verification', () => {
  test.setTimeout(90000);

  test('Check live production screens on www.cctvquotation.com', async ({ page }) => {
    if (!fs.existsSync(PROD_SCREENSHOTS_DIR)) {
      fs.mkdirSync(PROD_SCREENSHOTS_DIR, { recursive: true });
    }

    await page.goto('https://www.cctvquotation.com');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(PROD_SCREENSHOTS_DIR, '01-live-home.png'), fullPage: true });

    await page.goto('https://www.cctvquotation.com/wizard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(PROD_SCREENSHOTS_DIR, '02-live-wizard-start.png'), fullPage: true });

    await page.getByRole('button', { name: /Guided Setup/i }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(PROD_SCREENSHOTS_DIR, '03-live-step1.png'), fullPage: true });

    await page.goto('https://www.cctvquotation.com/quote/mock-e2e-lead');
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(PROD_SCREENSHOTS_DIR, '04-live-quote-page.png'), fullPage: true });
  });
});
