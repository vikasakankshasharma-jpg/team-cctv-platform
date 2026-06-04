import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { autoCorrectBrainEntry } from "@/lib/ai/vector-db";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function POST(req: NextRequest) {
  try {
    // Basic security to ensure this isn't triggered randomly
    // In production, you would check for an authorization header matching a cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Find downvoted entries
    const brainRef = adminDb.collection('ai_brain');
    const snapshot = await brainRef
      .where('userRating', '==', -1)
      .where('autoCorrected', '==', false)
      .limit(10) // Process in small batches
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No downvoted entries found." });
    }

    const corrections = [];

    // 2. Loop through and Auto-Correct
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const { question, answer: badAnswer } = data;

      const systemPrompt = `You are a Senior AI Architecture Manager evaluating a junior Student AI.
The Student AI was asked: "${question}"
The Student AI answered: "${badAnswer}"

The user gave this answer a "Thumbs Down". 
Your task:
1. Figure out why the answer was bad or insufficient.
2. Provide the absolute perfect, most accurate, and helpful response.
3. OUTPUT ONLY the perfect response. Do not include your analysis or apologies in the output, just the raw text of the perfect answer that the Student AI should have said.`;

      const chatResponse = await ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] }
        ],
      });

      const correctedAnswer = chatResponse.text?.trim();

      if (correctedAnswer) {
        // 3. Update the Brain with the perfect answer
        await autoCorrectBrainEntry(doc.id, correctedAnswer);
        corrections.push({ id: doc.id, question });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${corrections.length} auto-corrections.`,
      corrections 
    });
  } catch (error: any) {
    console.error("Night School Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
