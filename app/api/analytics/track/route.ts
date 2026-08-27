import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, source, eventType, step, metadata } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const timestamp = new Date().toISOString();

    // 1. Log the individual event
    await adminDb.collection("quote_events").add({
      sessionId,
      eventType,
      step: step || null,
      timestamp,
      metadata: metadata || {}
    });

    // 2. Update or create the session
    const sessionRef = adminDb.collection("quote_sessions").doc(sessionId);
    
    // We use set with merge: true to upsert
    const sessionData: any = {
      source: source || "unknown",
      lastActivityAt: timestamp,
    };

    if (eventType === "SESSION_START") {
      sessionData.startedAt = timestamp;
      sessionData.status = "active";
    }

    if (step) {
      sessionData.currentStep = step;
    }

    if (eventType === "QUOTE_GENERATED") {
      sessionData.status = "completed";
      sessionData.completedAt = timestamp;
      if (metadata?.quoteId) {
        sessionData.quoteId = metadata.quoteId;
      }
    }

    await sessionRef.set(sessionData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Analytics Tracking Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
