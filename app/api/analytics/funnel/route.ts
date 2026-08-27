import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const snapshot = await adminDb.collection("quote_sessions")
        .where("source", "==", "wizard")
        .get();
    
    let totalStarted = 0;
    let propertySelected = 0;
    let cameraCount = 0;
    let recording = 0;
    let quoteGenerated = 0;

    snapshot.docs.forEach(doc => {
      const s = doc.data();
      totalStarted++;

      // We determine progression based on currentStep or status
      const step = s.currentStep || 0;
      
      if (step >= 1 || s.status === "completed") propertySelected++;
      if (step >= 2 || s.status === "completed") cameraCount++;
      if (step >= 3 || s.status === "completed") recording++;
      
      if (s.status === "completed") quoteGenerated++;
    });

    const completionRate = totalStarted > 0 ? Math.round((quoteGenerated / totalStarted) * 100) : 0;

    const drops = {
        property: totalStarted > 0 ? Math.round(((totalStarted - propertySelected) / totalStarted) * 100) : 0,
        cameraCount: propertySelected > 0 ? Math.round(((propertySelected - cameraCount) / propertySelected) * 100) : 0,
        recording: cameraCount > 0 ? Math.round(((cameraCount - recording) / cameraCount) * 100) : 0,
        generation: recording > 0 ? Math.round(((recording - quoteGenerated) / recording) * 100) : 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        totalStarted,
        propertySelected,
        cameraCount,
        recording,
        quoteGenerated,
        completionRate,
        drops
      }
    });
  } catch (error: any) {
    console.error("Funnel Analytics Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
