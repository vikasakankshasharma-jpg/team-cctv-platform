import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get("pin") || "302049";
  const hasKey = !!process.env.GEMINI_API_KEY;
  if (!hasKey) {
    return NextResponse.json({ error: "No GEMINI_API_KEY in environment" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = 'Divide PINCODE ' + pin + ' in Jaipur, Rajasthan into 4 quadrants. Return valid JSON array of 4 objects with zone, anchor, coverage.';
    const aiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    return NextResponse.json({
      success: true,
      pin,
      rawText: aiRes.text
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      status: err.status
    });
  }
}
