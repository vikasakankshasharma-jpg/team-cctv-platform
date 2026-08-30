import { test, expect, request } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe.serial('Phase 4B: Sales CRM API Authorization & Integration', () => {
  const leadId = `LEAD-CRM-${Date.now()}`;
  const taskId = `FU-${leadId}-INITIAL`;
  const quoteId = `QT-CRM-${Date.now()}`;

  test.beforeAll(async () => {
    // Seed a lead, quote, and a hot task
    await adminDb.collection("leads").doc(leadId).set({
      id: leadId,
      name: "CRM Test User",
      mobile: "9999999999",
      timeline: "Immediately"
    });

    await adminDb.collection("quotes").doc(quoteId).set({
      id: quoteId,
      lead_id: leadId,
      status: "GENERATED"
    });

    await adminDb.collection("followup_tasks").doc(taskId).set({
      id: taskId,
      lead_id: leadId,
      priority: "HOT",
      status: "pending",
      due_at: new Date().toISOString()
    });
  });

  test('1. RBAC Isolation: Prevent unauthorized access to CRM views', async ({ request }) => {
    // No auth
    const res1 = await request.get('/api/crm/tasks');
    expect(res1.status()).toBe(403); // or 401 based on how Error is caught

    // Customer auth
    const res2 = await request.get('/api/crm/tasks', {
      headers: { cookie: 'admin_session=mock_session_customer' }
    });
    expect(res2.status()).toBe(403);

    // Sales auth -> Success
    const res3 = await request.get('/api/crm/tasks', {
      headers: { cookie: 'admin_session=mock_session_sales_staff' }
    });
    expect(res3.ok()).toBeTruthy();
    const json3 = await res3.json();
    expect(json3.success).toBe(true);
    expect(json3.role).toBe("sales_staff");
  });

  test('2. CRM Filter: Hot Leads Queue', async ({ request }) => {
    const res = await request.get('/api/crm/tasks?filter=hot', {
      headers: { cookie: 'admin_session=mock_session_sales_staff' }
    });
    const json = await res.json();
    expect(json.success).toBe(true);
    
    // The task we seeded should be in the list
    const found = json.data.find((t: any) => t.id === taskId);
    expect(found).toBeDefined();
    
    // Aggregation check (it should have stitched the lead)
    expect(found.lead).toBeDefined();
    expect(found.lead.id).toBe(leadId);
  });

  test('3. CRM Filter: Needs Manual Follow-up', async ({ request }) => {
    const manualTaskId = `FU-MANUAL-${Date.now()}`;
    await adminDb.collection("followup_tasks").doc(manualTaskId).set({
      id: manualTaskId,
      lead_id: leadId,
      priority: "HOT",
      status: "needs_manual_followup",
      due_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const res = await request.get('/api/crm/tasks?filter=manual', {
      headers: { cookie: 'admin_session=mock_session_sales_staff' }
    });
    const json = await res.json();
    expect(json.success).toBe(true);
    
    const found = json.data.find((t: any) => t.id === manualTaskId);
    expect(found).toBeDefined();
  });

  test('4. CRM Action: Manual Follow-up -> Mark Contacted', async ({ request }) => {
    const res = await request.post(`/api/crm/tasks/${taskId}/action`, {
      headers: { cookie: 'admin_session=mock_session_sales_staff' },
      data: { action: "MARK_CONTACTED", note: "Spoke to customer, sending new quote" }
    });
    expect(res.ok()).toBeTruthy();

    const taskDoc = await adminDb.collection("followup_tasks").doc(taskId).get();
    expect(taskDoc.data()?.status).toBe("sent");
    expect(taskDoc.data()?.last_outcome).toContain("sending new quote");

    // Verify audit log
    const auditSnap = await adminDb.collection("audit_logs")
      .where("entity_id", "==", taskId)
      .where("action", "==", "manual_sales_action")
      .get();
    expect(auditSnap.empty).toBe(false);
  });

  test('5. CRM Detail View: Comprehensive Lead Aggregation', async ({ request }) => {
    const res = await request.get(`/api/crm/leads/${leadId}`, {
      headers: { cookie: 'admin_session=mock_session_sales_staff' }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    
    expect(json.success).toBe(true);
    expect(json.data.lead.id).toBe(leadId);
    expect(json.data.quotes.length).toBeGreaterThanOrEqual(1);
    expect(json.data.tasks.length).toBeGreaterThanOrEqual(1);
    // Jobs/Invoices might be 0, but arrays should exist
    expect(Array.isArray(json.data.jobs)).toBe(true);
    expect(Array.isArray(json.data.invoices)).toBe(true);
  });
});
