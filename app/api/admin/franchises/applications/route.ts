import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySession } from "@/lib/auth-server";

export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection("franchise_dealers")
      .where("status", "==", "pending")
      .get();
      
    const applications = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    
    // Sort manually by created_at since composite index might be missing
    applications.sort((a: any, b: any) => {
      const dateA = a.created_at?.toDate?.() || new Date(0);
      const dateB = b.created_at?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json(applications);
  } catch (err) {
    console.error("[Franchise Applications API GET]", err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
