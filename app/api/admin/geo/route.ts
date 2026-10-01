import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Server-side cache for high-speed response
const cache = new Map<string, any>();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    let targetUrl = "";
    if (type === "states") {
      targetUrl = "https://aniket-thapa.github.io/india-pincode-api/states.json";
    } else if (type === "districts" && state) {
      targetUrl = `https://aniket-thapa.github.io/india-pincode-api/states/${encodeURIComponent(state)}.json`;
    } else if (type === "offices" && state && district) {
      targetUrl = `https://aniket-thapa.github.io/india-pincode-api/districts/${encodeURIComponent(state)}/${encodeURIComponent(district)}.json`;
    } else {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (cache.has(targetUrl)) {
      return NextResponse.json(cache.get(targetUrl), {
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }

    const res = await fetch(targetUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch from postal dataset" }, { status: res.status });
    }

    let data = await res.json();
    
    // Inject AI Areas from cache if this is an offices request
    if (type === "offices" && Array.isArray(data)) {
      const uniquePins = Array.from(new Set(data.map((o: any) => o.pincode))).filter(Boolean) as string[];
      const aiCacheMap = new Map<string, any>();
      
      // Batch fetch in chunks of 30 (Firestore limit is 30 for 'in')
      for (let i = 0; i < uniquePins.length; i += 30) {
        const chunk = uniquePins.slice(i, i + 30);
        if (chunk.length === 0) continue;
        try {
           const snap = await adminDb.collection("pincode_cache").where("__name__", "in", chunk).get();
           snap.docs.forEach(doc => {
             const d = doc.data();
             const payload: any = {};
             if (d.ai_areas && Array.isArray(d.ai_areas)) {
               payload.ai_areas = d.ai_areas;
             }
             if (d.quadrants && Array.isArray(d.quadrants)) {
               payload.quadrants = d.quadrants;
             }
             if (Object.keys(payload).length > 0) {
               aiCacheMap.set(doc.id, payload);
             }
           });
        } catch(e) {
           console.error("Geo AI fetch err:", e);
        }
      }
      
      // Map back to data
      data = data.map((o: any) => {
        if (o.pincode && aiCacheMap.has(o.pincode)) {
          return { ...o, ...aiCacheMap.get(o.pincode) };
        }
        return o;
      });
    }

    cache.set(targetUrl, data);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch (err: any) {
    console.error("Geo API proxy error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
