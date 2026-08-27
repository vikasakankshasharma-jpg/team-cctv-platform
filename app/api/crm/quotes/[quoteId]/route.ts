import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    
    const doc = await adminDb.collection("quotes").doc(quoteId).get();
    if (!doc.exists) {
      return NextResponse.json({ success: false, message: "Lead/Quote not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error: any) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    
    const allowedUpdates = [
      "leadStatus", 
      "assignedTo", 
      "intentScore", 
      "installationType", 
      "expectedClosingDate", 
      "probabilityPercent", 
      "expectedValue", 
      "nextActionDate", 
      "nextActionType"
    ];
    const updates: any = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await adminDb.collection("quotes").doc(quoteId).update(updates);
    }
    
    return NextResponse.json({ success: true, message: "Updated" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
