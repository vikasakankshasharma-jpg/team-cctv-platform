import { NextRequest, NextResponse } from "next/server";
import { updateBrainRating } from "@/lib/ai/vector-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brainId, rating } = body;

    if (!brainId || (rating !== 1 && rating !== -1)) {
      return NextResponse.json({ error: "Invalid feedback data" }, { status: 400 });
    }

    await updateBrainRating(brainId, rating as 1 | -1);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("AI Feedback Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
