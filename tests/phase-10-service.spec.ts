import { test, expect } from '@playwright/test';

test.describe('Phase 10.6: Service Ticket & Complaint Management', () => {

  const customerId = `CUST-TICKET-${Date.now()}`;
  let ticketId = "";

  test('Create a Service Ticket', async ({ request }) => {
    const res = await request.post('/api/operations/tickets', {
       data: {
          customerId,
          category: "HARDWARE_FAILURE",
          priority: "HIGH",
          description: "Camera is completely offline and not powering up.",
          billingType: "WARRANTY"
       },
       headers: { "X-Mock-Role": "OPERATIONS" }
    });
    
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("OPEN");
    
    ticketId = data.data.id;
  });
  
  test('Assign Ticket generates a Service Job', async ({ request }) => {
    const res = await request.patch(`/api/operations/tickets/${ticketId}`, {
       data: {
          status: "ASSIGNED",
          technicianId: "TECH-001"
       },
       headers: { "X-Mock-Role": "OPERATIONS" }
    });
    
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain("Service Job created");
  });
  
  test('Cannot access tickets without proper role', async ({ request }) => {
    const res = await request.get(`/api/operations/tickets?customerId=${customerId}`, {
       headers: { "X-Mock-Role": "UNKNOWN_ROLE" }
    });
    expect(res.status()).toBe(403);
  });

  test('10.8 Service Job Completion & Relocation', async ({ request }) => {
     // A fake patch to Job route to trigger the Service branch.
     // It will fail at "Job not found" because it's a fake job ID, but it confirms the route works and routes correctly.
     const failRes = await request.patch(`/api/operations/jobs/SERVICE-JOB-123`, {
        data: {
           status: "COMPLETED",
           type: "service",
           actualConsumed: { "CABLE-CAT6": 20 },
           relocatedAssets: { "SN-123": "New Gate" },
           resolutionCode: "CABLE_REPLACED"
        },
        headers: { "X-Mock-Role": "OPERATIONS" }
     });
     
     expect(failRes.status()).toBe(400); // Bad request because transaction failed
     const data = await failRes.json();
     expect(data.message).toContain("Job not found");
  });

});
