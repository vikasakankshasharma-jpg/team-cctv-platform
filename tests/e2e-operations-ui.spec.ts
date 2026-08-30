import { test, expect } from '@playwright/test';

test.describe.serial('Phase 5B: Operations / Installer UI Thin Client', () => {

  test('1. RBAC UI Guard: Non-installers are blocked from /operations', async ({ page, context }) => {
    // Inject mock customer cookie
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_customer_UID_cust1',
      domain: 'localhost',
      path: '/',
    }]);

    await page.goto('/operations');
    expect(page.url()).toContain('/unauthorized');
  });

  test('2. Installer can access Dashboard & view assigned jobs', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_installer_UID_inst1',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock API response
    await page.route('/api/operations/jobs', async route => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: [
            { id: "JOB-123", status: "ASSIGNED", address: { city: "Jaipur" }, scheduled_at: new Date().toISOString() },
            { id: "JOB-456", status: "BACKORDERED", address: { city: "Jaipur" } }
          ]
        }
      });
    });

    await page.goto('/operations');
    await expect(page.locator('h2')).toContainText('Assigned Jobs');
    
    // Ensure jobs render
    await expect(page.getByText('JOB-123')).toBeVisible();
    await expect(page.getByText('ASSIGNED', { exact: true })).toBeVisible();
    await expect(page.getByText('JOB-456')).toBeVisible();
    await expect(page.getByText('INVENTORY ALERT: Check Backorder Status')).toBeVisible();
  });

  test('3. Job Card renders Site Survey & Materials, enforces Completion Checklist', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_installer_UID_inst1',
      domain: 'localhost',
      path: '/',
    }]);

    let currentStatus = "IN_PROGRESS";

    await page.route('/api/operations/jobs/JOB-123', async route => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            job: { 
              id: "JOB-123", 
              status: currentStatus,
              site_survey: { mounting_height: "Very High", ladder_required: true, surface_type: "Marble" }
            },
            materials: [
              { display_name: "4MP IP Camera", qty: 4, product_id: "cam1" },
              { display_name: "surcharge_ladder", qty: 1, product_id: "surcharge_ladder" }
            ]
          }
        }
      });
    });

    let transitionPayload: any = null;
    await page.route('/api/operations/jobs/JOB-123/transition', async route => {
      transitionPayload = route.request().postDataJSON();
      currentStatus = transitionPayload.status;
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto('/operations/jobs/JOB-123');
    
    // Verify Job Card data renders
    await expect(page.locator('text=Site Survey Snapshot')).toBeVisible();
    await expect(page.locator('text=Very High')).toBeVisible();
    await expect(page.locator('text=Yes (Bring 15ft+)')).toBeVisible();
    await expect(page.locator('text=4MP IP Camera')).toBeVisible();
    await expect(page.locator('text=x4')).toBeVisible();

    // Verify Completion Checklist UI
    await expect(page.locator('text=Completion Checklist')).toBeVisible();
    
    const finishBtn = page.locator('button:has-text("Finish Job")');
    await expect(finishBtn).toBeDisabled();

    // Check off items
    await page.locator('text=All cameras and DVR installed').click();
    await page.locator('text=Site cleaned up').click();
    await expect(finishBtn).toBeDisabled(); // Still missing one
    
    await page.locator('text=Customer app configured').click();
    await expect(finishBtn).toBeEnabled();

    // Submit
    await finishBtn.click();
    
    await page.waitForTimeout(500);
    expect(transitionPayload.status).toBe("COMPLETED");
  });
});
