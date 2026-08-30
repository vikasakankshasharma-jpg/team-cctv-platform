import { test, expect, request } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe.serial('Phase 4A: CRM Follow-up Engine', () => {
  const hotLeadId = `LEAD-HOT-${Date.now()}`;
  const failLeadId = `LEAD-FORCE_FAIL-${Date.now()}`; // Custom marker to force failure in mock
  const coldLeadId = `LEAD-COLD-${Date.now()}`;
  let hotTaskId = "";
  let failTaskId = "";

  const headers = { 'authorization': 'Bearer test_cron_secret' };

  test('1. Enqueue HOT Lead (Idempotent execution)', async ({ request }) => {
    const res1 = await request.post('/api/crm/tasks/generate', {
      data: { lead_id: hotLeadId, timeline: "Immediately" }
    });
    expect(res1.ok()).toBeTruthy();
    const json1 = await res1.json();
    expect(json1.success).toBe(true);
    expect(json1.exists).toBe(false);
    hotTaskId = json1.taskId;

    // Verify task properties (HOT SLA = 1 hr)
    const taskDoc = await adminDb.collection("followup_tasks").doc(hotTaskId).get();
    const taskData = taskDoc.data();
    expect(taskData?.priority).toBe("HOT");
    expect(taskData?.status).toBe("pending");
    
    // Idempotency: Duplicate call should return exists=true
    const res2 = await request.post('/api/crm/tasks/generate', {
      data: { lead_id: hotLeadId, timeline: "Immediately" }
    });
    const json2 = await res2.json();
    expect(json2.exists).toBe(true);
  });

  test('2. Enqueue COLD Lead with Nurture SLA', async ({ request }) => {
    const res = await request.post('/api/crm/tasks/generate', {
      data: { lead_id: coldLeadId, timeline: "Just looking around" }
    });
    const json = await res.json();
    expect(json.success).toBe(true);
    const coldTaskId = json.taskId;

    const taskDoc = await adminDb.collection("followup_tasks").doc(coldTaskId).get();
    expect(taskDoc.data()?.priority).toBe("COLD");
    
    // Check SLA (Cold = +7 days)
    const dueAt = new Date(taskDoc.data()?.due_at);
    const now = new Date();
    const diffDays = Math.round((dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });

  test('3. Cron: Successful Delivery', async ({ request }) => {
    // Manually force due_at to past so cron picks it up
    await adminDb.collection("followup_tasks").doc(hotTaskId).update({ due_at: new Date(Date.now() - 10000).toISOString() });

    const res = await request.post('/api/cron/followups', { headers });
    expect(res.ok()).toBeTruthy();

    const taskDoc = await adminDb.collection("followup_tasks").doc(hotTaskId).get();
    expect(taskDoc.data()?.status).toBe("sent");
    expect(taskDoc.data()?.attempt_count).toBe(1);
    
    // Verify Audit
    const auditSnap = await adminDb.collection("audit_logs")
      .where("entity_id", "==", hotTaskId)
      .where("action", "==", "message_sent")
      .get();
    expect(auditSnap.empty).toBe(false);
  });

  test('4. Cron: Delivery Failure -> Retry Pending', async ({ request }) => {
    // Generate failing lead
    const res = await request.post('/api/crm/tasks/generate', {
      data: { lead_id: failLeadId, timeline: "Immediately" }
    });
    failTaskId = (await res.json()).taskId;
    
    // Force due_at to past
    await adminDb.collection("followup_tasks").doc(failTaskId).update({ due_at: new Date(Date.now() - 10000).toISOString() });

    // Run Cron
    await request.post('/api/cron/followups', { headers });

    const taskDoc = await adminDb.collection("followup_tasks").doc(failTaskId).get();
    expect(taskDoc.data()?.status).toBe("retry_pending");
    expect(taskDoc.data()?.attempt_count).toBe(1);
    
    // Ensure due_at was pushed to future (approx +4 hours)
    const newDueAt = new Date(taskDoc.data()?.due_at).getTime();
    expect(newDueAt).toBeGreaterThan(Date.now());
  });

  test('5. Cron: Exhausted Retries -> Needs Manual Follow-up', async ({ request }) => {
    // Force task to attempt_count = 2 (max is 3) and due_at to past
    await adminDb.collection("followup_tasks").doc(failTaskId).update({ 
      attempt_count: 2,
      due_at: new Date(Date.now() - 10000).toISOString() 
    });

    // Run Cron (3rd attempt fails)
    await request.post('/api/cron/followups', { headers });

    const taskDoc = await adminDb.collection("followup_tasks").doc(failTaskId).get();
    expect(taskDoc.data()?.status).toBe("needs_manual_followup");
    expect(taskDoc.data()?.attempt_count).toBe(3);
  });

  test('6. Concurrent Cron Saftey (Simulated)', async ({ request }) => {
    // Generate a fresh task
    const concLeadId = `LEAD-CONC-${Date.now()}`;
    const res = await request.post('/api/crm/tasks/generate', {
      data: { lead_id: concLeadId, timeline: "Immediately" }
    });
    const concTaskId = (await res.json()).taskId;
    await adminDb.collection("followup_tasks").doc(concTaskId).update({ due_at: new Date(Date.now() - 10000).toISOString() });

    // Simulate Race Condition: manually set status to 'sending' before cron hits it
    await adminDb.collection("followup_tasks").doc(concTaskId).update({ status: "sending" });

    // Run Cron
    const cronRes = await request.post('/api/cron/followups', { headers });
    const json = await cronRes.json();
    
    // The cron should process 0 tasks because 'sending' tasks are ignored by the query (only pending/retry_pending are fetched)
    expect(json.processed).toBe(0);
  });

});
