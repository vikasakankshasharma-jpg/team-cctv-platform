import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

const ACTIVE_HUBS: Record<string, string> = {
  "jaipur": "jaipur",
  "jodhpur": "jodhpur",
  "kota": "kota",
  "ajmer": "ajmer",
  "new delhi": "new-delhi",
  "delhi": "new-delhi"
};

const formatAreaName = (name: string) => name.replace(/\s+(S\.O|B\.O|H\.O|G\.P\.O\.|S\.O\.|B\.O\.|H\.O\.)(\s+|$)/gi, ' ').replace(/\s*\([^)]*\)/g, '').trim();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    let postOffices: any[] = [];
    let firstOffice: any = null;

    // 1. Fetch from postal API
    try {
      const postRes = await fetch('https://api.postalpincode.in/pincode/' + pin, { next: { revalidate: 86400 } });
      const postData = await postRes.json();
      if (postData && postData[0]?.Status !== "Error" && postData[0]?.PostOffice) {
        postOffices = postData[0].PostOffice;
        firstOffice = postOffices[0];
      }
    } catch (e) {
      // Postal API error or down, fallback below
    }

    // Fallback if primary postal API doesn't have the pincode (e.g. newly established delivery codes like 302039, 302041)
    if (!firstOffice) {
      try {
        const prefix = pin.substring(0, 3);
        const pincodeData = await import("@/data/pincodes.json");
        const regionalInfo = (pincodeData.default as any)[prefix];
        const targetCity = (regionalInfo?.city || "jaipur").toLowerCase();

        // State mappings for fallback
        let targetState = "rajasthan";
        if (pin.startsWith("11")) targetState = "delhi";
        else if (pin.startsWith("40")) targetState = "maharashtra";
        else if (pin.startsWith("56")) targetState = "karnataka";
        else if (pin.startsWith("60")) targetState = "tamil-nadu";
        else if (pin.startsWith("70")) targetState = "west-bengal";
        else if (pin.startsWith("38") || pin.startsWith("39")) targetState = "gujarat";

        const fallbackRes = await fetch(`https://aniket-thapa.github.io/india-pincode-api/districts/${targetState}/${targetCity}.json`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const matched = (fallbackData?.offices || []).filter((o: any) => o.pincode === pin);
          if (matched.length > 0) {
            postOffices = matched.map((m: any) => ({
              Name: m.officeName,
              District: regionalInfo?.city || "Jaipur",
              State: targetState.charAt(0).toUpperCase() + targetState.slice(1)
            }));
            firstOffice = postOffices[0];
          }
        }
      } catch (fbErr) {
        // Fallback failed
      }
    }

    if (!firstOffice) {
      return NextResponse.json({ error: "Pincode not found or invalid." }, { status: 404 });
    }

    const districtName = firstOffice.District.toLowerCase();
    const stateName = firstOffice.State.toLowerCase();
    const locationName = firstOffice.Name;
    const formattedAreas = postOffices.map((po: any) => formatAreaName(po.Name));

    let served = false;
    let citySlug = "";
    
    for (const [hubKey, slug] of Object.entries(ACTIVE_HUBS)) {
      if (districtName.includes(hubKey) || stateName.includes(hubKey)) {
        served = true;
        citySlug = slug;
        break;
      }
    }

    if (!served) {
      citySlug = "jaipur"; // Fallback to nearest hub for reference quote
    }

    // 2. Check cache for coords/radius
    let lat: number | undefined;
    let lng: number | undefined;
    let radius: number | undefined;

    let aiAreas: string[] | undefined = undefined;
    let subAreas: Record<string, {lat: number, lng: number}> = {};

    const cacheRef = adminDb.collection("pincode_cache").doc(pin);
    const cacheSnap = await cacheRef.get();
    
    if (cacheSnap.exists) {
      const c = cacheSnap.data();
      if (c && c.lat && c.lng && c.radius) {
         lat = c.lat;
         lng = c.lng;
         radius = c.radius;
      }
      if (c && c.ai_areas && Array.isArray(c.ai_areas) && c.ai_areas.length > 0) {
         aiAreas = c.ai_areas;
      }
      if (c && c.sub_areas) {
         subAreas = c.sub_areas;
      }
    }

    // 3. If not cached, calculate using Geocoding APIs
    if (!lat || !lng || !radius) {
       const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
       if (apiKey) {
          const points: { lat: number, lng: number }[] = [];
          
          await Promise.all(formattedAreas.map(async (area: string) => {
             try {
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(area + ', India')}&components=postal_code:${pin}|country:IN&key=${apiKey}`);
                const geoData = await geoRes.json();
                if (geoData.status === "OK" && geoData.results[0]) {
                   points.push({
                      lat: geoData.results[0].geometry.location.lat,
                      lng: geoData.results[0].geometry.location.lng
                   });
                }
             } catch (e) {
                // ignore
             }
          }));

          if (points.length === 0) {
             // Fallback to just the pincode
             try {
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${pin}|country:IN&key=${apiKey}`);
                const geoData = await geoRes.json();
                if (geoData.status === "OK" && geoData.results[0]) {
                   lat = geoData.results[0].geometry.location.lat;
                   lng = geoData.results[0].geometry.location.lng;
                   radius = 4001;
                }
             } catch (e) {
                // ignore
             }
          } else {
             // Calculate Centroid
             const centroidLat = points.reduce((sum, pt) => sum + pt.lat, 0) / points.length;
             const centroidLng = points.reduce((sum, pt) => sum + pt.lng, 0) / points.length;

             // Calculate max radius
             let maxRadius = 0;
             points.forEach(pt => {
                const R = 6371e3;
                const lat1 = centroidLat * Math.PI/180;
                const lat2 = pt.lat * Math.PI/180;
                const dLat = (pt.lat - centroidLat) * Math.PI/180;
                const dLng = (pt.lng - centroidLng) * Math.PI/180;
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                          Math.cos(lat1) * Math.cos(lat2) *
                          Math.sin(dLng/2) * Math.sin(dLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c;
                if (distance > maxRadius) maxRadius = distance;
             });

             lat = centroidLat;
             lng = centroidLng;
             radius = Math.max(maxRadius + 1000, 2000);
          }
       }
       
       // Fallback to OpenStreetMap (Nominatim) if Google Maps didn't yield results
       if (!lat || !lng) {
          try {
             const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${pin}+India&format=json`, {
               headers: { 'User-Agent': 'CCTVQuotationApp/1.0' }
             });
             if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                   lat = parseFloat(geoData[0].lat);
                   lng = parseFloat(geoData[0].lon);
                   radius = 5000;
                }
             }
          } catch (e) {
             console.error("Nominatim fallback failed:", e);
          }
       }

       // Cache it if we found it
       if (lat && lng && radius) {
          await cacheRef.set({
            lat, lng, radius,
            areas: formattedAreas,
            updated_at: serverTimestamp()
          }, { merge: true });
       }
    }

    let quadrants = cacheSnap.exists && cacheSnap.data()?.quadrants ? cacheSnap.data()?.quadrants : undefined;
    
    // Attempt inline lazy generation of AI Quadrants
    if (!quadrants && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are a geographic expert of India. I have the following delivery locations/sub-post offices for PINCODE ${pin} in ${firstOffice.District}, ${firstOffice.State}:
${formattedAreas.join(", ")}

Divide these EXACT locations into exactly 4 geographic quadrants (North-West, North-East, South-East, South-West) based on their real-world geographic distribution within the pincode.
Do NOT invent any new places, landmarks, or anchors. ONLY use the location names provided above.
For each quadrant, provide:
1. "zone": The quadrant name (e.g., "North-West").
2. "anchor": The most prominent location from the provided list for this quadrant.
3. "coverage": A comma-separated string of the locations from the list that fall into this quadrant. Ensure all provided locations are distributed across the 4 quadrants.
Return ONLY a valid JSON array of 4 objects. 
Example:
[
  { "zone": "North-West", "anchor": "Location A", "coverage": "Location A, Location B" },
  { "zone": "North-East", "anchor": "Location C", "coverage": "Location C" },
  { "zone": "South-East", "anchor": "Location D", "coverage": "Location D, Location E" },
  { "zone": "South-West", "anchor": "Location F", "coverage": "Location F, Location G" }
]`;
        const aiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: { responseMimeType: "application/json" },
        });
        const text = aiRes.text?.replace(/```json|```/g, '').trim() || "";
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length === 4) {
          quadrants = parsed;
          await cacheRef.set({ quadrants }, { merge: true });
        }
      } catch (err) {
        console.error("Failed to generate AI quadrants for pin:", pin, err);
      }
    }

    // Deterministic fallback: guarantee every pincode in India has 4 quadrants
    if (!quadrants || !Array.isArray(quadrants) || quadrants.length !== 4) {
      const areaList = formattedAreas && formattedAreas.length > 0 ? formattedAreas : [locationName];
      const p1 = areaList[0] || `${firstOffice.District} Central`;
      const p2 = areaList[1] || `${p1} North`;
      const p3 = areaList[2] || `${p1} South`;
      const p4 = areaList[3] || `${p1} Extension`;

      quadrants = [
        { zone: "North-West", anchor: `${p1} Sector / Chowk`, coverage: `${p1}, ${p2}` },
        { zone: "North-East", anchor: `${p2} Main Market`, coverage: `${p2}, Surrounding areas` },
        { zone: "South-West", anchor: `${p3} Intersection`, coverage: `${p3}, Adjacent blocks` },
        { zone: "South-East", anchor: `${p4} Circle`, coverage: `${p4}, Outer limits` }
      ];

      try {
        await cacheRef.set({ quadrants }, { merge: true });
      } catch (saveErr) {
        // Ignore cache write error
      }
    }

    try {
      const batch = adminDb.batch();
      const impressionRef = adminDb.collection("city_impressions").doc(districtName.replace(/\s+/g, '-'));
      batch.set(impressionRef, {
        city: firstOffice.District,
        state: firstOffice.State,
        pincode: pin,
        served: served,
        total_lookups: increment(1),
        last_lookup: serverTimestamp(),
      }, { merge: true });

      if (served) {
        const serviceAreaRef = adminDb.collection("service_areas").doc(citySlug);
        batch.set(serviceAreaRef, {
          priority_score: increment(0.2),
          updated_at: serverTimestamp()
        }, { merge: true });
      }
      
      await batch.commit();
    } catch (logErr) {
      console.error("Failed to log city impression:", logErr);
    }

    return NextResponse.json(
      { 
        district: firstOffice.District, 
        state: firstOffice.State, 
        city: locationName, 
        served: served, 
        citySlug: citySlug,
        lat,
        lng,
        radius,
        areas: aiAreas && aiAreas.length > 0 ? aiAreas : formattedAreas,
        sub_areas: subAreas,
        quadrants: quadrants,
        message: served ? "" : "Nearest serviceable area shown as reference."
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}





export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const body = await req.json();
    const { area, lat, lng } = body;
    if (!area || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const cacheRef = adminDb.collection("pincode_cache").doc(pin);
    await cacheRef.set({
      [`sub_areas.${area}`]: { lat, lng },
      updated_at: serverTimestamp()
    }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
