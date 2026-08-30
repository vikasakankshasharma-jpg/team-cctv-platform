import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";
import { JobEngine } from "@/lib/job-engine";
import { Job, JobStatus } from "@/types";

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const session = await requireRoleApi(["sales_staff", "installer", "super_admin"]);
    const params = await context.params;
    const jobId = params.jobId;
    
    const { status, note, installer_id } = await request.json();
    const nextStatus = status as JobStatus;

    if (!nextStatus) {
      return NextResponse.json({ success: false, message: "Target status required" }, { status: 400 });
    }

    const jobRef = adminDb.collection("jobs").doc(jobId);

    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(jobRef);
      if (!doc.exists) throw new Error("Job not found");
      
      const jobData = doc.data() as Job;

      // RBAC: If installer, ensure they own the job before transitioning (unless they are being assigned)
      if (session.role === "installer" && nextStatus !== "ASSIGNED") {
        if (jobData.installer_id !== session.user?.uid) {
           throw new Error("Unauthorized to mutate unassigned job");
        }
      }

      // State Machine Validation
      if (!JobEngine.isValidTransition(jobData.status, nextStatus)) {
        throw new Error(`Invalid transition from ${jobData.status} to ${nextStatus}`);
      }

      const updateData: any = {
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      if (nextStatus === "ASSIGNED") {
        if (!installer_id && !session.user?.uid) throw new Error("Missing installer_id for assignment");
        updateData.installer_id = installer_id || session.user?.uid;
      }
      
      if (nextStatus === "COMPLETED") {
        updateData.completed_at = new Date().toISOString();
      }

      transaction.update(jobRef, updateData);

      const auditRef = adminDb.collection("audit_logs").doc();
      transaction.set(auditRef, {
        id: auditRef.id,
        entity_type: "job",
        entity_id: jobId,
        action: `status_${nextStatus.toLowerCase()}`,
        actor: session.role,
        details: { from: jobData.status, to: nextStatus, note: note || null, user_id: session.user?.uid || null },
        created_at: updateData.updated_at
      });
    });

    return NextResponse.json({ success: true, message: `Job transitioned to ${nextStatus}` });

  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message.includes("Unauthorized")) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    console.error("Job Transition Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
