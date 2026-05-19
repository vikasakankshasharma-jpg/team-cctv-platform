import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    
    await adminDb.collection("leads").doc(leadId).update({
      waitlist_confirmed: true,
      waitlist_confirmed_at: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Waitlist confirm error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
