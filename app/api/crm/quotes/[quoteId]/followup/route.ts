import { NextResponse } from "next/server";
import { adminDb, arrayUnion } from "@/lib/firebase-admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    
    // We expect { note: string, nextFollowUpDate?: string, nextActionType?: string, priority?: string }
    const newFollowUp = {
      note: body.note,
      nextFollowUpDate: body.nextFollowUpDate || null,
      nextActionType: body.nextActionType || null,
      priority: body.priority || "normal",
      timestamp: new Date().toISOString(),
      author: "Sales Agent" // In real app, extract from admin session
    };
    
    // Append to follow_ups array and update the next action on the root doc
    await adminDb.collection("quotes").doc(quoteId).update({
      follow_ups: arrayUnion(newFollowUp),
      followUpDate: body.nextFollowUpDate || null, // legacy
      nextActionDate: body.nextFollowUpDate || null,
      nextActionType: body.nextActionType || null,
      leadStatus: "FOLLOW_UP" // automatically transition state
    });
    
    return NextResponse.json({ success: true, message: "Follow-up added" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
