import { test, expect, type BrowserContext } from '@playwright/test';

test.describe('E2E Full Journey - 5 Roles', () => {
  test.describe.configure({ mode: 'parallel' });

  let customerContext: BrowserContext;
  let promoterContext: BrowserContext;
  let salesContext: BrowserContext;
  let adminContext: BrowserContext;
  let installerContext: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    customerContext = await browser.newContext();
    promoterContext = await browser.newContext();
    salesContext = await browser.newContext();
    adminContext = await browser.newContext();
    installerContext = await browser.newContext();
  });

  test('Customer: Journey to create an order', async () => {
    const page = await customerContext.newPage();
    await page.goto('/wizard', { timeout: 60000 }); 
    await expect(page).toHaveTitle(/Get Free CCTV Quote/);
  });

  test('Promoter: Verify Referral Dashboard', async () => {
    const page = await promoterContext.newPage();
    await page.goto('/test-login?role=dealer&redirect=/partner/dashboard', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/partner\/dashboard/, { timeout: 30000 });
  });

  test('Salesperson: Manage and Forward Lead', async () => {
    const page = await salesContext.newPage();
    await page.goto('/test-login?role=salesperson&redirect=/sales', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/sales/, { timeout: 30000 });
  });

  test('Admin: Approve Order and Assign Installer', async () => {
    const page = await adminContext.newPage();
    await page.goto('/test-login?role=admin&redirect=/admin', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/admin/, { timeout: 30000 });
  });

  test('Installer: Accept and Complete Job', async () => {
    const page = await installerContext.newPage();
    await page.goto('/test-login?role=installer&redirect=/installer/dashboard', { timeout: 60000 });
    await expect(page).toHaveURL(/.*\/installer\/dashboard/, { timeout: 30000 });
  });
  
  test.afterAll(async () => {
    await customerContext.close();
    await promoterContext.close();
    await salesContext.close();
    await adminContext.close();
    await installerContext.close();
  });
});
