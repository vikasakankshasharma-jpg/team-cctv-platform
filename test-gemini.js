require('dotenv').config({ path: '.env.local' });

async function run() {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are a geographic expert of India. Divide the geographic area of PINCODE 302015 in Jaipur, Rajasthan into exactly 4 equal geographic quadrants (North-West, North-East, South-East, South-West). 
For each quadrant, provide:
1. "zone": The quadrant name (e.g., "North-West").
2. "anchor": The single most prominent, well-known, and map-searchable landmark or major intersection exactly in the center of that quadrant.
3. "coverage": A brief string listing the key localities covered in that quadrant.
Return ONLY a valid JSON array of 4 objects. 
Example:
[
  { "zone": "North-West", "anchor": "Chandpole Gate", "coverage": "Purani Basti, Nahargarh" },
  { "zone": "North-East", "anchor": "Chhoti Chaupar", "coverage": "Indra Bazar, Khazane Walon" },
  { "zone": "South-East", "anchor": "Panch Batti", "coverage": "M.I. Road, Jayanti Market" },
  { "zone": "South-West", "anchor": "Statue Circle", "coverage": "Ashok Nagar, Hathroi" }
]`;

  try {
    const aiRes = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    console.log("Raw Text:", aiRes.text);
    const text = aiRes.text?.replace(/```json|```/g, '').trim() || "";
    console.log("Cleaned Text:", text);
    const parsed = JSON.parse(text);
    console.log("Parsed:", parsed);
  } catch (err) {
    console.error(err);
  }
}

run();
