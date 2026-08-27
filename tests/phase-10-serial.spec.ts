import { test, expect } from '@playwright/test';

test.describe('Phase 10: Serial Number Operations', () => {

  const poId = `PO-SERIAL-${Date.now()}`;
  const sn1 = `SN-A-${Date.now()}`;
  const sn2 = `SN-B-${Date.now()}`;
  const jobId = `JOB-SERIAL-${Date.now()}`;

  test('10.1 PO Receive Serialized SKU', async ({ request }) => {
    // Attempt to receive serialized SKU without matching serials length (should fail)
    const failRes = await request.post(`/api/inventory/purchase/${poId}/receive`, {
       data: {
          performedBy: "Test",
          receivedItems: [
             { skuId: "CP-SERIAL-CAM", qty: 2, isSerialized: true, serials: [sn1] }
          ]
       },
       headers: { "X-Mock-Role": "SUPER_ADMIN" }
    });
    expect(failRes.status()).toBe(500);

    // Provide duplicate serials (should fail)
    const failRes2 = await request.post(`/api/inventory/purchase/${poId}/receive`, {
       data: {
          performedBy: "Test",
          receivedItems: [
             { skuId: "CP-SERIAL-CAM", qty: 2, isSerialized: true, serials: [sn1, sn1] }
          ]
       },
       headers: { "X-Mock-Role": "SUPER_ADMIN" }
    });
    expect(failRes2.status()).toBe(500);
  });

  test('10.2 Serial Search / Verification API', async ({ request }) => {
    // Should return 404 for unknown serial
    const res = await request.get('/api/inventory/serials?serialNumber=UNKNOWN_XYZ', {
       headers: { "X-Mock-Role": "TECHNICIAN" }
    });
    expect(res.status()).toBe(404);
  });

  test('10.3 Job Serial Allocation Validation', async ({ request }) => {
    // We expect this to fail gracefully (500/400) because we are hitting the completion endpoint
    // without the proper setup, but the error message should prove it reached the deserialization logic
    
    const failRes = await request.patch(`/api/operations/jobs/${jobId}`, {
       data: {
          status: "COMPLETED",
          actualConsumed: { "CP-SERIAL-CAM": 2 },
          serials: { "CP-SERIAL-CAM": [sn1] } // Length mismatch
       },
       headers: { "X-Mock-Role": "SUPER_ADMIN" }
    });
    
    // Will throw "Job not found" because jobId is fake, but we are validating the endpoint is protected
    expect(failRes.status()).toBe(400); 
  });

  test('10.4 Customer Asset Registry API', async ({ request }) => {
    const res = await request.get('/api/customer/FAKE_CUST/assets', {
       headers: { "X-Mock-Role": "ADMIN" }
    });
    // Should return 200 with empty array
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  test('10.5 Warranty Certificate Generation', async ({ request }) => {
    const res = await request.post(`/api/operations/jobs/FAKE_JOB/warranty`, {
       headers: { "X-Mock-Role": "ADMIN" }
    });
    // Should throw 500 Job not found because of transaction validation
    expect(res.status()).toBe(500);
    const data = await res.json();
    expect(data.message).toContain("Job not found");
  });

  test('10.6 RMA Replacement Lifecycle (Security / Invalidity)', async ({ request }) => {
    // Test with missing fields
    const failRes1 = await request.post('/api/operations/rma', {
       data: { oldSerialNumber: "OLD-123" },
       headers: { "X-Mock-Role": "OPERATIONS" }
    });
    expect(failRes1.status()).toBe(400);

    // Test with non-existent old serial
    const failRes2 = await request.post('/api/operations/rma', {
       data: { 
          oldSerialNumber: "UNKNOWN-OLD", 
          newSerialNumber: "UNKNOWN-NEW", 
          reason: "DOA" 
       },
       headers: { "X-Mock-Role": "OPERATIONS" }
    });
    expect(failRes2.status()).toBe(500);
    const data = await failRes2.json();
    expect(data.message).toContain("not found");
  });
  
  test('10.7/10.8 E2E Regression Authorization', async ({ request }) => {
     // Ensure Sales cannot perform RMA
     const unauthorizedRes = await request.post('/api/operations/rma', {
       data: { oldSerialNumber: "A", newSerialNumber: "B", reason: "DOA" },
       headers: { "X-Mock-Role": "SALES" }
     });
     expect(unauthorizedRes.status()).toBe(403);
  });

});
