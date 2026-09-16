import { test, expect, type BrowserContext, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Emulate iPhone 13
const iPhone = devices['iPhone 13'];

test.describe('Mobile E2E Full Journey - 5 Roles', () => {
  test.describe.configure({ mode: 'parallel' });

  let customerContext: BrowserContext;
  let promoterContext: BrowserContext;
  let salesContext: BrowserContext;
  let adminContext: BrowserContext;
  let installerContext: BrowserContext;

  const screenshotsDir = path.join(process.cwd(), 'test-results', 'mobile-screenshots');

  test.beforeAll(async ({ browser }) => {
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Initialize contexts with mobile viewport and user agent
    const contextOptions = { ...iPhone };
    
    customerContext = await browser.newContext(contextOptions);
    promoterContext = await browser.newContext(contextOptions);
    salesContext = await browser.newContext(contextOptions);
    adminContext = await browser.newContext(contextOptions);
    installerContext = await browser.newContext(contextOptions);
  });

  test('Customer (Mobile): Journey to create an order', async () => {
    const page = await customerContext.newPage();
    await page.goto('/wizard', { timeout: 60000 }); 
    await expect(page).toHaveTitle(/Get Free CCTV Quote/);
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ path: path.join(screenshotsDir, '1-customer-wizard-mobile.png'), fullPage: true });
  });

  test('Promoter (Mobile): Verify Referral Dashboard', async () => {
    const page = await promoterContext.newPage();
    await page.goto('/test-login?role=dealer&redirect=/partner/dashboard', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/partner\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '2-promoter-dashboard-mobile.png'), fullPage: true });
  });

  test('Salesperson (Mobile): Manage and Forward Lead', async () => {
    const page = await salesContext.newPage();
    await page.goto('/test-login?role=salesperson&redirect=/sales', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/sales/, { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '3-salesperson-dashboard-mobile.png'), fullPage: true });
  });

  test('Admin (Mobile): Approve Order and Assign Installer', async () => {
    const page = await adminContext.newPage();
    await page.goto('/test-login?role=admin&redirect=/admin', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '4-admin-dashboard-mobile.png'), fullPage: true });
  });

  test('Installer (Mobile): Accept and Complete Job', async () => {
    const page = await installerContext.newPage();
    await page.goto('/test-login?role=installer&redirect=/installer/dashboard', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/installer\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '5-installer-dashboard-mobile.png'), fullPage: true });
  });
  
  test.afterAll(async () => {
    await customerContext.close();
    await promoterContext.close();
    await salesContext.close();
    await adminContext.close();
    await installerContext.close();
  });
});
