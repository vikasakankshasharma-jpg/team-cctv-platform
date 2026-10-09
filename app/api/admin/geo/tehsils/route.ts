import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const refresh = searchParams.get("refresh") === "true";

    if (!state || !district) {
      return NextResponse.json({ error: "State and District are required" }, { status: 400 });
    }

    const docId = `${state}_${district}`;
    const cacheRef = adminDb.collection("geo_tehsils").doc(docId);
    
    if (!refresh) {
      const snap = await cacheRef.get();
      if (snap.exists) {
        return NextResponse.json(snap.data()?.tehsils || {});
      }
    }

    // If not in cache, fetch district data and send to Gemini
    const targetUrl = `https://aniket-thapa.github.io/india-pincode-api/districts/${encodeURIComponent(state)}/${encodeURIComponent(district)}.json`;
    const res = await fetch(targetUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch district data" }, { status: 500 });
    }
    const data = await res.json();
    const offices = data.offices || [];

    if (offices.length === 0) {
      return NextResponse.json({});
    }

    // Group offices by pincode to prepare concise prompt
    const pincodeMap: Record<string, string[]> = {};
    for (const office of offices) {
      if (!pincodeMap[office.pincode]) {
        pincodeMap[office.pincode] = [];
      }
      pincodeMap[office.pincode].push(office.officeName.replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ').trim());
    }

    let promptData = "";
    for (const [pin, areas] of Object.entries(pincodeMap)) {
      promptData += `PIN ${pin}: ${areas.join(", ")}\n`;
    }

    // Fetch Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key missing" }, { status: 500 });
    }

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `You are a geographic expert of India. I have a list of PINCODEs and their delivery sub-post offices (villages/localities) for the district of ${district.toUpperCase()}, ${state.toUpperCase()}.

Based on the actual geographic grouping of these villages, classify these PINCODEs into their respective Tehsils (or Talukas).
Do not create random Tehsils. Use the actual recognized Tehsils for this district.
Return ONLY a valid JSON object where the keys are the Tehsil names (Strings) and the values are Arrays of PINCODE strings that belong to that Tehsil. Ensure EVERY PINCODE provided below is assigned to exactly one Tehsil.

Here is the data:
${promptData}

Example output format:
{
  "Jaipur City": ["302001", "302002"],
  "Sanganer": ["302029", "303902"],
  "Chaksu": ["303901", "303903"]
}`;

    const aiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = aiRes.text?.replace(/```json|```/g, '').trim() || "{}";
    const parsedTehsils = JSON.parse(text);

    // Save to Firestore
    await cacheRef.set({
      state,
      district,
      tehsils: parsedTehsils,
      updated_at: serverTimestamp()
    });

    return NextResponse.json(parsedTehsils);
  } catch (error: any) {
    console.error("Tehsil generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
