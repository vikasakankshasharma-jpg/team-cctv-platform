import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("analytics_rejections")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();
    
    const logs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group by reason
    const breakdown: Record<string, number> = {};
    logs.forEach((log: any) => {
        const reason = log.reason || "Unknown";
        breakdown[reason] = (breakdown[reason] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        logs,
        breakdown
      }
    });
  } catch (error: any) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
