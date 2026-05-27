import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    await requireAdmin();
    // Get all jobs for dispatch board
    const snapshot = await adminDb.collection("jobs").orderBy("created_at", "desc").limit(100).get();
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
