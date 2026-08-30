import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { FollowUpTask } from "@/types";
import { CRMEngine } from "@/lib/crm-engine";

export async function POST(request: Request) {
  try {
    const { lead_id, timeline } = await request.json();

    if (!lead_id || !timeline) {
      return NextResponse.json({ success: false, message: "Missing lead_id or timeline" }, { status: 400 });
    }

    const priority = CRMEngine.mapTimelineToPriority(timeline);
    const dueAt = CRMEngine.calculateFollowUpSLA(priority);
    const taskId = CRMEngine.getInitialFollowUpId(lead_id);

    const taskRef = adminDb.collection("followup_tasks").doc(taskId);

    const result = await adminDb.runTransaction(async (transaction) => {
      const taskDoc = await transaction.get(taskRef);
      
      // Idempotency check: If task exists, do not overwrite/duplicate
      if (taskDoc.exists) {
        return { success: true, message: "Follow-up task already exists (Idempotent)", taskId, exists: true };
      }

      const newTask: FollowUpTask = {
        id: taskId,
        lead_id,
        priority,
        campaign_type: "initial_quote_followup",
        channel: "whatsapp",
        due_at: dueAt,
        attempt_count: 0,
        max_attempts: 3,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      transaction.set(taskRef, newTask);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "job", // mapping to CRM domain, technically 'followup_task' 
        entity_id: taskId,
        action: "created",
        actor: "system",
        details: { lead_id, priority, due_at: dueAt },
        created_at: new Date().toISOString()
      });

      return { success: true, message: "Follow-up task queued", taskId, exists: false };
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Follow-up queue error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
