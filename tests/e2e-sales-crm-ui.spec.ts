import { test, expect } from '@playwright/test';

test.describe.serial('Phase 5A: Sales CRM UI Thin Client', () => {

  test('1. RBAC UI Guard: Customers are blocked from /sales', async ({ page, context }) => {
    // Inject mock customer cookie
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_customer_UID_cust1',
      domain: 'localhost',
      path: '/',
    }]);

    const res = await page.goto('/sales');
    // In our layout, unauthorized roles get redirected to /unauthorized
    expect(page.url()).toContain('/unauthorized');
  });

  test('2. Sales Staff can access Dashboards & view HOT queue', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_sales_staff_UID_sales1',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock the API response so we don't rely on DB state
    await page.route('/api/crm/tasks?filter=hot', async route => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: [
            { id: "task1", lead_id: "LEAD-123", priority: "HOT", status: "needs_manual_followup", due_at: new Date().toISOString() }
          ]
        }
      });
    });

    await page.goto('/sales');
    await expect(page.locator('h2')).toContainText('Follow-up Queues');
    
    // Ensure the task renders
    await expect(page.locator('tbody')).toContainText('LEAD-123');
    await expect(page.locator('tbody')).toContainText('HOT');
  });

  test('3. Lead 360 & Manual Action persists via API', async ({ page, context }) => {
    await context.addCookies([{
      name: 'admin_session',
      value: 'mock_session_sales_staff_UID_sales1',
      domain: 'localhost',
      path: '/',
    }]);

    // Mock Lead 360 API
    await page.route('/api/crm/leads/LEAD-123', async route => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          data: {
            lead: { id: "LEAD-123", timeline: "immediately" },
            tasks: [{ id: "task1", status: "needs_manual_followup", priority: "HOT", due_at: new Date().toISOString() }],
            quotes: [{ id: "QT-1", total_payable: 15000, status: "draft" }],
            jobs: [],
            invoices: []
          }
        }
      });
    });

    // Mock Action POST API
    let actionPayload: any = null;
    await page.route('/api/crm/tasks/task1/action', async route => {
      actionPayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, json: { success: true } });
    });

    await page.goto('/sales/lead/LEAD-123');
    
    // Verify 360 data renders
    await expect(page.locator('text=Wizard Snapshot')).toBeVisible();
    await expect(page.locator('text=immediately')).toBeVisible();
    await expect(page.locator('text=Quote QT-1')).toBeVisible();
    await expect(page.locator('text=₹15000')).toBeVisible();

    // Trigger Action Modal
    await page.click('button:has-text("Log Manual Action")');
    await expect(page.locator('text=Log Sales Action')).toBeVisible();

    // Fill form
    await page.selectOption('select', 'MARK_CONTACTED');
    await page.fill('textarea', 'Customer is interested in 4 cameras.');
    await page.click('button:has-text("Save Action")');

    // Wait for the modal to close / state to reset (or check payload)
    await page.waitForTimeout(500);
    
    expect(actionPayload).not.toBeNull();
    expect(actionPayload.action).toBe('MARK_CONTACTED');
    expect(actionPayload.note).toBe('Customer is interested in 4 cameras.');
  });
});
