import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// Path to save screenshots - directly in the artifacts directory
const SCREENSHOTS_DIR = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\8c22ab33-d2d1-47d3-b968-bb8e91be9fb2\\visual_screenshots';

// Ensure the directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('E2E Visual Screen-by-Screen Scanner', () => {
  
  test.beforeEach(async ({ page }, testInfo) => {
    // Set viewport to a standard laptop resolution
    await page.setViewportSize({ width: 1440, height: 900 });
    // Set a generous timeout of 2 minutes for on-demand compilation
    testInfo.setTimeout(120000);
  });

  test('1. Customer Flow - Scan Home, Wizard, Configurator, Review', async ({ page }) => {
    // ---- 1. VISIT HOME PAGE ----
    console.log('Navigating to Home Page...');
    await page.goto('/');
    await page.waitForTimeout(2000); // Allow animations to settle
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-home.png') });
    console.log('Saved 01-home.png');

    // ---- 2. VISIT WIZARD PAGE ----
    console.log('Navigating to Wizard...');
    await page.goto('/wizard');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-wizard-step1.png') });
    console.log('Saved 02-wizard-step1.png');

    // ---- 3. VISIT CONFIGURATOR PAGE ----
    console.log('Navigating to Configurator...');
    await page.goto('/quote/mock-lead?name=E2E+Visual+Client&mobile=9988776655');
    await page.waitForSelector('text=Compare Featured Systems', { timeout: 15000 });
    await page.waitForTimeout(3000); // Allow data fetch and pricing rendering
    
    // Screenshot 3a: Landing & Comparison Cards
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-quote-landing.png') });
    console.log('Saved 03-quote-landing.png');

    // Screenshot 3b: Spec Comparison Table
    // Scroll to the SpecCompareTable
    const specTable = page.locator('text=Show Differences Only');
    if (await specTable.isVisible()) {
      await specTable.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-quote-compare-table.png') });
      console.log('Saved 04-quote-compare-table.png');
    }

    // Screenshot 3c: Full Page customer flow (includes Addons & Summary)
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '05-quote-fullpage.png'),
      fullPage: true 
    });
    console.log('Saved 05-quote-fullpage.png');

    // Screenshot 3d: Build Your Own Kit Panel
    const customizerPanel = page.locator('text=Build Your Own Kit');
    if (await customizerPanel.isVisible()) {
      await customizerPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-quote-customizer-sidebar.png') });
      console.log('Saved 06-quote-customizer-sidebar.png');
    }

    // ---- 4. VISIT QUOTE REVIEW PAGE ----
    console.log('Navigating to Quote Review...');
    await page.goto('/quote/mock-lead/review/mock-quote');
    await page.waitForSelector('text=Quotation', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '07-quote-review.png'),
      fullPage: true
    });
    console.log('Saved 07-quote-review.png');
  });

  test('2. Admin Flow - Authenticate and Scan Dashboard & CRUD Operations', async ({ context, page }) => {
    // ---- 1. SET BYPASS COOKIE ----
    console.log('Setting Admin Bypass Cookie...');
    await context.addCookies([
      {
        name: 'admin_session',
        value: 'mock-admin-session',
        domain: 'localhost',
        path: '/',
      }
    ]);

    // ---- 2. VISIT ADMIN LOGIN PAGE ----
    console.log('Navigating to Admin Login page (with cookie)...');
    await page.goto('/admin/login');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-admin-login.png') });
    console.log('Saved 08-admin-login.png');

    // ---- 3. VISIT ADMIN DASHBOARD ----
    console.log('Navigating to Admin Dashboard...');
    await page.goto('/admin');
    await page.waitForSelector('text=Dashboard|Overview|Analytics', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-admin-dashboard.png') });
    console.log('Saved 09-admin-dashboard.png');

    // ---- 4. VISIT ADMIN PRODUCTS ----
    console.log('Navigating to Admin Products...');
    await page.goto('/admin/products');
    await page.waitForSelector('text=Hardware Specifications|Catalog', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-admin-products.png') });
    console.log('Saved 10-admin-products.png');

    // ---- 5. VISIT ADMIN LEADS ----
    console.log('Navigating to Admin Leads...');
    await page.goto('/admin/leads');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-admin-leads.png') });
    console.log('Saved 11-admin-leads.png');

    // ---- 6. VISIT ADMIN BOOKINGS ----
    console.log('Navigating to Admin Bookings...');
    await page.goto('/admin/bookings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-admin-bookings.png') });
    console.log('Saved 12-admin-bookings.png');

    // ---- 7. VISIT ADMIN ADDONS ----
    console.log('Navigating to Admin Addons...');
    await page.goto('/admin/addons');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-admin-addons.png') });
    console.log('Saved 13-admin-addons.png');

    // ---- 8. VISIT ADMIN COMMISSION ----
    console.log('Navigating to Admin Commission...');
    await page.goto('/admin/commission');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-admin-commission.png') });
    console.log('Saved 14-admin-commission.png');

    // ---- 9. VISIT ADMIN PROMOTERS ----
    console.log('Navigating to Admin Promoters...');
    await page.goto('/admin/promoters');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-admin-promoters.png') });
    console.log('Saved 15-admin-promoters.png');

    // ---- 10. VISIT ADMIN SALESPERSONS ----
    console.log('Navigating to Admin Salespersons...');
    await page.goto('/admin/salespersons');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-admin-salespersons.png') });
    console.log('Saved 16-admin-salespersons.png');

    // ---- 11. VISIT ADMIN SETTINGS ----
    console.log('Navigating to Admin Settings...');
    await page.goto('/admin/settings');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-admin-settings.png') });
    console.log('Saved 17-admin-settings.png');
  });

  test('3. Salesperson Flow - Authenticate and Scan Dashboard', async ({ context, page }) => {
    console.log('Setting Salesperson Bypass Cookie...');
    await context.addCookies([
      {
        name: 'admin_session',
        value: 'mock-salesperson-session',
        domain: 'localhost',
        path: '/',
      }
    ]);
    console.log('Navigating to Salesperson Dashboard...');
    await page.goto('/salesperson/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18-salesperson-dashboard.png') });
    console.log('Saved 18-salesperson-dashboard.png');

    console.log('Navigating to Salesperson Leads...');
    await page.goto('/salesperson/leads');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '18b-salesperson-leads.png') });
    console.log('Saved 18b-salesperson-leads.png');
  });

  test('4. Dealer Flow - Authenticate and Scan Dashboard', async ({ context, page }) => {
    console.log('Setting Dealer Bypass Cookie...');
    await context.addCookies([
      {
        name: 'dealer_session',
        value: 'mock-dealer-session',
        domain: 'localhost',
        path: '/',
      }
    ]);
    console.log('Navigating to Dealer Dashboard...');
    await page.goto('/dealer/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '19-dealer-dashboard.png'),
      fullPage: true 
    });
    console.log('Saved 19-dealer-dashboard.png');

    console.log('Navigating to Dealer Leads...');
    await page.goto('/dealer/leads');
    await page.waitForTimeout(3000);
    await page.screenshot({ 
      path: path.join(SCREENSHOTS_DIR, '19b-dealer-leads.png'),
      fullPage: true 
    });
    console.log('Saved 19b-dealer-leads.png');
  });
});
