import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRoleApi(["sales_staff", "super_admin"]);
    const params = await context.params;
    
    // Validate request
    const { action, note, reschedule_due_at } = await request.json();
    if (!action) {
      return NextResponse.json({ success: false, message: "Action required" }, { status: 400 });
    }

    const validActions = ["MARK_CONTACTED", "RESCHEDULE", "CLOSE"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const taskId = params.id;
    const taskRef = adminDb.collection("followup_tasks").doc(taskId);

    await adminDb.runTransaction(async (transaction) => {
       const doc = await transaction.get(taskRef);
       if (!doc.exists) throw new Error("Task not found");

       const updateData: any = {
         updated_at: new Date().toISOString(),
         last_outcome: note || `Salesperson action: ${action}`
       };

       if (action === "MARK_CONTACTED") {
         updateData.status = "sent";
       } else if (action === "RESCHEDULE") {
         updateData.status = "pending";
         if (reschedule_due_at) updateData.due_at = reschedule_due_at;
       } else if (action === "CLOSE") {
         updateData.status = "cancelled";
       }

       // Optional: Enforce that only assigned sales staff can modify, or super admin.
       // For MVP, we trust the role check.

       transaction.update(taskRef, updateData);

       const auditRef = adminDb.collection("audit_logs").doc();
       transaction.set(auditRef, {
         id: auditRef.id,
         entity_type: "followup_task",
         entity_id: taskId,
         action: "manual_sales_action",
         actor: "sales_staff",
         details: { action, note, user_id: session.user?.uid },
         created_at: updateData.updated_at
       });
    });

    return NextResponse.json({ success: true, message: `Task ${action} successfully` });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    console.error("CRM Action Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
