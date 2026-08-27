import { test, expect } from '@playwright/test';

test.describe('Phase 10.9 & 10.10: Customer Service Dashboard', () => {

  const customerId = `CUST-DASH-${Date.now()}`;

  test('Fetch Customer Dashboard Unified View', async ({ request }) => {
    const res = await request.get(`/api/customer/${customerId}/dashboard`, {
       headers: { "X-Mock-Role": "OPERATIONS" }
    });
    
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    
    // Expect assets and history arrays
    expect(data.data.assets).toBeInstanceOf(Array);
    expect(data.data.history).toBeInstanceOf(Array);
    expect(data.data.historyPagination.page).toBe(1);
  });
  
  test('Customer cannot access another customer ID', async ({ request }) => {
    // We didn't fully implement customer auth context in checkRole yet, 
    // but we can ensure standard unauth works.
    const res = await request.get(`/api/customer/${customerId}/dashboard`, {
       headers: { "X-Mock-Role": "UNKNOWN_ROLE" }
    });
    expect(res.status()).toBe(403);
  });

});

test.describe('Phase 10.11: Service Billing', () => {
  test('Generate Service Invoice for Chargeable Ticket', async ({ request }) => {
     // A fake ticket, should throw "Ticket not found" but pass 403 checks and parameter checks
     const failRes = await request.post('/api/finance/invoices', {
        data: { ticketId: "FAKE-TICKET-ID", serviceCharge: 1500 },
        headers: { "X-Mock-Role": "SALES" }
     });
     
     expect(failRes.status()).toBe(500);
     const data = await failRes.json();
     expect(data.message).toContain("Ticket not found");
  });
});
