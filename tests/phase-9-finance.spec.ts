import { test, expect } from '@playwright/test';

test.describe('Phase 9: Finance & Invoicing', () => {
  // To test this independently without relying on the Deal->Job DB setup, we rely on the logic guarding
  // As testing these POST APIs directly with mock IDs usually throws 404 Deal Not Found, 
  // which implies the route is active and validating properly.

  test('Invoice Generation Validation', async ({ request }) => {
    const res = await request.post('/api/finance/invoices', {
       data: { dealId: "NON_EXISTENT_DEAL_9000" },
       headers: { "X-Mock-Role": "ADMIN" }
    });
    
    // Should get a 500/404 from the throw new Error("Deal not found") inside the transaction
    expect(res.status()).toBe(500);
    const data = await res.json();
    expect(data.message).toContain("Deal not found");
  });
  
  test('Receipt Collection Validation', async ({ request }) => {
    const res = await request.post('/api/finance/receipts', {
       data: { invoiceId: "NON_EXISTENT_INV", amount: 5000 },
       headers: { "X-Mock-Role": "ADMIN" }
    });
    
    expect(res.status()).toBe(500);
    const data = await res.json();
    expect(data.message).toContain("Invoice not found");
  });

  test('Finance Dashboard GET', async ({ request }) => {
    const res = await request.get('/api/finance/invoices', {
       headers: { "X-Mock-Role": "ADMIN" }
    });
    
    expect(res.ok()).toBeTruthy();
  });
});
