import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const action = await req.json();
    const { id, type, jobId, payload, timestamp } = action;

    if (!jobId || !type) {
      return NextResponse.json({ success: false, error: "Missing jobId or type" }, { status: 400 });
    }

    // Record the synchronized action in the job's offline sync ledger
    await adminDb.collection("offline_sync_ledger").add({
      client_queue_id: id,
      action_type: type,
      job_id: jobId,
      payload: payload || {},
      client_timestamp: timestamp,
      server_synced_at: new Date().toISOString(),
    });

    // If it's a checklist update, merge into the job record
    if (type === "JOB_CHECKLIST" && payload?.checklist) {
      await adminDb.collection("jobs").doc(jobId).set(
        {
          offline_checklist: payload.checklist,
          last_offline_sync_at: new Date().toISOString(),
        },
        { merge: true }
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, synced_id: id });
  } catch (error: unknown) {
    console.error("Offline Sync Error:", error);
    const msg = error instanceof Error ? error.message : "Failed to sync offline item";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
