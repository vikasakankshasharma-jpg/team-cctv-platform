import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FollowUpTask } from "@/types";

// Mocking WhatsApp Delivery Service
async function sendWhatsAppMessage(leadId: string, _campaign: string): Promise<{ success: boolean; reason?: string }> {
  // In reality, calls WhatsApp Cloud API or WATI/Interakt
  // For E2E testing, we'll look at the leadId to force failures
  if (leadId.includes("FORCE_FAIL")) {
    return { success: false, reason: "Network Error" };
  }
  return { success: true };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'test_cron_secret'}`) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Find eligible tasks (Firestore index required on status + due_at)
    // For simplicity in emulator without strict composite index upfront, we fetch all pending and filter in memory if needed.
    // In production, composite index: status (ASC), due_at (ASC)
    const pendingSnap = await adminDb.collection("followup_tasks")
      .where("status", "in", ["pending", "retry_pending"])
      .where("due_at", "<=", now)
      .limit(10) // batch size
      .get();

    if (pendingSnap.empty) {
      return NextResponse.json({ success: true, message: "No tasks to process", processed: 0 });
    }

    let processedCount = 0;

    // Process each task sequentially to ensure isolated transactions
    for (const doc of pendingSnap.docs) {
      const taskId = doc.id;

      await adminDb.runTransaction(async (transaction) => {
        const taskRef = adminDb.collection("followup_tasks").doc(taskId);
        const taskDoc = await transaction.get(taskRef);
        
        if (!taskDoc.exists) return;
        const taskData = taskDoc.data() as FollowUpTask;

        // Concurrent cron protection (Idempotency)
        if (taskData.status !== "pending" && taskData.status !== "retry_pending") {
          return; // Someone else picked it up
        }

        // Lock task
        transaction.update(taskRef, { status: "sending", updated_at: new Date().toISOString() });

        // NOTE: In strict Firestore, writes execute at the END of the transaction.
        // Doing an async API call inside a transaction is generally discouraged due to transaction retries,
        // but since this is a queue processor, we lock, commit, then deliver, then update again in reality.
        // For E2E simplicity and atomic simulation, we'll keep it unified or split into two phases.
      });

      // --- PHASE 2: Delivery (Outside transaction) ---
      // Re-fetch to ensure we hold the lock
      const lockedTaskDoc = await adminDb.collection("followup_tasks").doc(taskId).get();
      const taskData = lockedTaskDoc.data() as FollowUpTask;
      if (taskData.status !== "sending") continue;

      const deliveryResult = await sendWhatsAppMessage(taskData.lead_id, taskData.campaign_type);

      // --- PHASE 3: Update Outcome ---
      await adminDb.runTransaction(async (transaction) => {
        const taskRef = adminDb.collection("followup_tasks").doc(taskId);
        const latestDoc = await transaction.get(taskRef);
        if (!latestDoc.exists) return;
        
        const latestData = latestDoc.data() as FollowUpTask;
        if (latestData.status !== "sending") return; // Safety check
        
        const attemptCount = latestData.attempt_count + 1;
        const nowStr = new Date().toISOString();

        if (deliveryResult.success) {
           transaction.update(taskRef, {
             status: "sent",
             attempt_count: attemptCount,
             last_outcome: "Delivered successfully",
             updated_at: nowStr
           });
        } else {
           if (attemptCount >= latestData.max_attempts) {
             transaction.update(taskRef, {
               status: "needs_manual_followup",
               attempt_count: attemptCount,
               last_outcome: deliveryResult.reason || "Delivery failed completely",
               updated_at: nowStr
             });
           } else {
             // Exponential/Fixed backoff: Retry in 4 hours
             const nextDue = new Date();
             nextDue.setHours(nextDue.getHours() + 4);
             
             transaction.update(taskRef, {
               status: "retry_pending",
               attempt_count: attemptCount,
               due_at: nextDue.toISOString(),
               last_outcome: deliveryResult.reason || "Delivery failed, retrying",
               updated_at: nowStr
             });
           }
        }

        // Audit Trail
        const auditRef = adminDb.collection("audit_logs").doc();
        transaction.set(auditRef, {
          id: auditRef.id,
          entity_type: "followup_task",
          entity_id: taskId,
          action: deliveryResult.success ? "message_sent" : "message_failed",
          actor: "cron",
          details: { attempt: attemptCount, result: deliveryResult.success },
          created_at: nowStr
        });
      });

      processedCount++;
    }

    return NextResponse.json({ success: true, processed: processedCount });

  } catch (error: any) {
    console.error("Cron worker error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
