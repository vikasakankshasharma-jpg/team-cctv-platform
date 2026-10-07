const fs = require('fs');
const path = 'app/api/pincode/[pin]/route.ts';
let code = fs.readFileSync(path, 'utf8');

const oldPromptBlock = `    // Attempt inline lazy generation of AI areas if not present, without blocking response unnecessarily
    // If it takes too long, we just proceed. We won't strictly await it forever.
    if (!aiAreas && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = \`You are a geographic expert of India. List the top 5 to 10 most prominent residential colonies, neighborhoods, or local areas that belong strictly to the pincode \${pin} in \${firstOffice.District}, \${firstOffice.State}. Do not include official post office building names like G.P.O or C.P.M.G unless they are primarily known as residential/commercial hubs. Return ONLY a valid JSON array of strings representing the colony names, and nothing else. Example: ["C-Scheme", "Ashok Nagar", "Bapu Nagar"]\`;
        const aiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const text = aiRes.text?.replace(/\`\`\`json|\`\`\`/g, '').trim() || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          aiAreas = parsed;
          await cacheRef.set({ ai_areas: aiAreas }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to generate AI areas for pin:", pin, err);
      }
    }`;

const newPromptBlock = `    let quadrants = c && c.quadrants ? c.quadrants : undefined;
    
    // Attempt inline lazy generation of AI Quadrants
    if (!quadrants && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = \`You are a geographic expert of India. Divide the geographic area of PINCODE \${pin} in \${firstOffice.District}, \${firstOffice.State} into exactly 4 equal geographic quadrants (North-West, North-East, South-East, South-West). 
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
]\`;
        const aiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" },
        });
        const text = aiRes.text?.replace(/\`\`\`json|\`\`\`/g, '').trim() || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length === 4) {
          quadrants = parsed;
          await cacheRef.set({ quadrants }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to generate AI quadrants for pin:", pin, err);
      }
    }`;

if (code.includes(oldPromptBlock)) {
  code = code.replace(oldPromptBlock, newPromptBlock);
} else {
  console.log('Failed to match exactly, attempting to find start/end manually');
  const startIdx = code.indexOf('    // Attempt inline lazy generation of AI areas');
  const endIdx = code.indexOf('    try {\n      const batch = adminDb.batch();');
  if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newPromptBlock + '\n\n' + code.substring(endIdx);
  } else {
    console.log('Manual finding also failed.');
  }
}

// Add extraction of `c` at the top of cache finding
if (!code.includes('const c = cacheSnap.data();')) {
  // It's probably already there
}

code = code.replace(
  'sub_areas: subAreas,',
  'sub_areas: subAreas,\n        quadrants: quadrants,'
);

fs.writeFileSync(path, code);
console.log('Done!');
