import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // We use a collectionGroup query to fetch all price match requests nested inside any lead
    // Note: We remove orderBy("created_at", "desc") to avoid requiring a composite index in Firebase
    const snapshot = await adminDb.collectionGroup("price_match_requests").get();
    
    let requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
        reviewed_at: (data.reviewed_at as any)?.toDate?.()?.toISOString() || data.reviewed_at || null,
        // we capture the parent lead ID from the reference path
        lead_id: data.lead_id || doc.ref.parent.parent?.id 
      };
    });

    // Sort in memory by created_at descending
    requests.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error("Error fetching admin price match requests:", error);
    return NextResponse.json({ error: "Failed to fetch price match requests" }, { status: 500 });
  }
}
