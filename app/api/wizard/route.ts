import { NextResponse } from "next/server";
import { getWizardConfig } from "@/lib/queries";

export async function GET(request: Request) {
  const data = await getWizardConfig();
  if (data.error) {
    return NextResponse.json({
      steps: data.steps,
      metadata: { source: "fallback_emergency", error: data.error }
    });
  }

  return NextResponse.json({ 
    steps: data.steps,
    metadata: {
      source: "firestore",
      timestamp: new Date().toISOString(),
      count: data.steps.length
    }
  });
}


