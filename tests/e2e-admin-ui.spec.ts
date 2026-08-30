import { test, expect } from '@playwright/test';

test.describe.serial('Phase 5C: Admin Pricing UI Thin Client', () => {

  test('1. RBAC UI Guard: Installers are blocked from /admin', async ({ page, context }) => {
    // Inject mock installer cookie
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_installer_UID_inst1',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/sys-admin/pricing');
    expect(page.url()).toContain('/unauthorized');
  });

  test('2. Admin can access Pricing Dashboard & sees Immutability Warning', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_super_admin_UID_admin1',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock API responses
    await page.route('/api/admin/pricing/products', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [{ id: "CAM-1", base_cost: 1500, stock_status: "in_stock" }] } });
    });
    await page.route('/api/admin/pricing/config', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: { site_preparation: { ladderArrangementFee: 500 } } } });
    });
    await page.route('/api/admin/audit', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [{ action: "price_or_status_updated", actor: "super_admin", entity_id: "CAM-1", created_at: Date.now() }] } });
    });

    await page.goto('/sys-admin/pricing');
    
    // Ensure warning renders
    await expect(page.locator('text=Critical Immutability Warning')).toBeVisible();
    await expect(page.locator('text=Existing quotes and invoices are immutable')).toBeVisible();

    // Ensure product master renders
    await expect(page.locator('text=Product Master')).toBeVisible();
    await expect(page.locator('text=CAM-1')).toBeVisible();
  });

  test('3. Admin updates Product -> Validation & Audit', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_super_admin_UID_admin1',
      domain: 'localhost',
      path: '/',
    }]);

    let alertText = "";
    // Handle `window.confirm` automatically
    page.on('dialog', dialog => {
      alertText = dialog.message();
      dialog.accept();
    });

    // Mock APIs
    await page.route('/api/admin/pricing/products', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [{ id: "CAM-1", base_cost: 1500, stock_status: "in_stock" }] } });
    });
    await page.route('/api/admin/pricing/config', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: {} } });
    });
    await page.route('/api/admin/audit', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    let updatePayload: any = null;
    await page.route('/api/admin/pricing/products/CAM-1', async route => {
      updatePayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto('/sys-admin/pricing');
    
    // Attempt invalid negative value update
    await page.fill('input[id="cost-CAM-1"]', '-500');
    await page.locator('button:has-text("Update")').click();
    await page.waitForTimeout(100);
    expect(alertText).toContain("Base cost must be positive");
    
    // Attempt valid update
    await page.fill('input[id="cost-CAM-1"]', '1600');
    await page.selectOption('select[id="status-CAM-1"]', 'ON_DEMAND');
    await page.locator('button:has-text("Update")').click();

    await page.waitForTimeout(500);
    expect(updatePayload).not.toBeNull();
    expect(updatePayload.base_cost).toBe(1600);
    expect(updatePayload.stock_status).toBe('ON_DEMAND');
  });

  test('4. Admin updates Global Config -> API hits', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_super_admin_UID_admin1',
      domain: 'localhost',
      path: '/',
    }]);

    page.on('dialog', dialog => {
      dialog.accept(); // accept confirmation
    });

    // Mock APIs
    await page.route('/api/admin/pricing/products', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [] } });
    });
    await page.route('/api/admin/pricing/config', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, json: { success: true, data: { site_preparation: { ladderArrangementFee: 500 } } } });
      }
    });
    await page.route('/api/admin/audit', async route => {
      await route.fulfill({ status: 200, json: { success: true, data: [] } });
    });

    let configPayload: any = null;
    await page.route('/api/admin/pricing/config', async route => {
      if (route.request().method() === 'POST') {
        configPayload = route.request().postDataJSON();
        await route.fulfill({ status: 200, json: { success: true } });
      } else {
        await route.fallback();
      }
    });

    await page.goto('/sys-admin/pricing');
    
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('800');

    await page.locator('button:has-text("Save Global Rules")').click();
    await page.waitForTimeout(500);
    
    expect(configPayload).not.toBeNull();
    expect(configPayload.site_preparation.ladderArrangementFee).toBe(800);
  });
});
