import { test, expect, request } from '@playwright/test';
import { adminDb } from '../lib/firebase-admin';

test.describe.serial('Phase 4C: Operations & Job State Machine', () => {
  const jobId1 = `JOB-OPS-1-${Date.now()}`;
  const jobId2 = `JOB-OPS-2-${Date.now()}`;
  
  const installerA = "mock-installerA-id";
  const installerB = "mock-installerB-id";

  test.beforeAll(async () => {
    // Seed Jobs
    await adminDb.collection("jobs").doc(jobId1).set({
      id: jobId1,
      lead_id: "L1",
      status: "PENDING_DISPATCH",
      created_at: new Date().toISOString()
    });

    await adminDb.collection("jobs").doc(jobId2).set({
      id: jobId2,
      lead_id: "L2",
      status: "ASSIGNED",
      installer_id: installerB,
      created_at: new Date().toISOString()
    });
  });

  test('1. RBAC Isolation: Installer only sees their own jobs', async ({ request }) => {
    const res = await request.get('/api/operations/jobs', {
      headers: { cookie: 'admin_session=mock_session_installer_UID_mock-installerB-id' }
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBe(true);
    
    // InstallerB should only see jobs assigned to them
    const allAssignedCorrectly = json.data.every((j: any) => j.installer_id === installerB);
    expect(allAssignedCorrectly).toBe(true);
    expect(json.data.some((j: any) => j.id === jobId2)).toBe(true);
  });

  test('2. RBAC Isolation: Admin sees all jobs', async ({ request }) => {
    const res = await request.get('/api/operations/jobs', {
      headers: { cookie: 'admin_session=mock_session_super_admin' }
    });
    const json = await res.json();
    
    // Admin sees both jobs (at least)
    const job1Found = json.data.find((j: any) => j.id === jobId1);
    const job2Found = json.data.find((j: any) => j.id === jobId2);
    expect(job1Found).toBeDefined();
    expect(job2Found).toBeDefined();
  });

  test('3. State Machine: Valid Transitions (PENDING -> ASSIGNED -> IN_PROGRESS)', async ({ request }) => {
    // 3A: PENDING_DISPATCH -> ASSIGNED
    const resAssign = await request.post(`/api/operations/jobs/${jobId1}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_mock-installerA-id' },
      data: { status: "ASSIGNED" } // installerA claims it
    });
    expect(resAssign.ok()).toBeTruthy();

    const jobDoc1 = await adminDb.collection("jobs").doc(jobId1).get();
    expect(jobDoc1.data()?.status).toBe("ASSIGNED");
    expect(jobDoc1.data()?.installer_id).toBe(installerA);

    // 3B: ASSIGNED -> IN_PROGRESS
    const resInProgress = await request.post(`/api/operations/jobs/${jobId1}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_mock-installerA-id' },
      data: { status: "IN_PROGRESS" }
    });
    expect(resInProgress.ok()).toBeTruthy();
    
    const jobDoc2 = await adminDb.collection("jobs").doc(jobId1).get();
    expect(jobDoc2.data()?.status).toBe("IN_PROGRESS");
  });

  test('4. State Machine: Prevent Invalid Transitions (PENDING -> COMPLETED)', async ({ request }) => {
    const freshJobId = `JOB-OPS-FAIL-${Date.now()}`;
    await adminDb.collection("jobs").doc(freshJobId).set({
      id: freshJobId, status: "PENDING_DISPATCH", created_at: new Date().toISOString()
    });

    const res = await request.post(`/api/operations/jobs/${freshJobId}/transition`, {
      headers: { cookie: 'admin_session=mock_session_super_admin' },
      data: { status: "COMPLETED" }
    });
    
    expect(res.status()).toBe(400); // Bad Request due to invalid transition
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toContain("Invalid transition");
  });

  test('5. RBAC Auth: Prevent mutation on unassigned job', async ({ request }) => {
    // InstallerA tries to mutate Job2 (assigned to InstallerB)
    const res = await request.post(`/api/operations/jobs/${jobId2}/transition`, {
      headers: { cookie: 'admin_session=mock_session_installer_UID_mock-installerA-id' },
      data: { status: "IN_PROGRESS" }
    });
    
    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json.message).toContain("Unauthorized to mutate unassigned job");
  });
});
