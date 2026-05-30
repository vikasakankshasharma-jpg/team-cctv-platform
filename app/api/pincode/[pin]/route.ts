import { NextRequest, NextResponse } from "next/server";
import https from "https";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const zipData: any = await new Promise((resolve, reject) => {
      console.log("Fetching pincode for PIN: '" + pin + "'");
      https.get(`https://api.zippopotam.us/in/${pin}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
      }, (res) => {
        console.log("Zippo API returned status:", res.statusCode);
        if (res.statusCode === 404) {
          resolve(null);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}`));
          return;
        }
        
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            console.log("Zippo API response data:", data);
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
        });
      }).on('error', (e) => {
        reject(e);
      });
    });

    if (!zipData) {
      return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
    }

    if (zipData.places && zipData.places.length > 0) {
      let cityName = "";
      let citySlug = "";
      
      const allPlaceNames = zipData.places.map((p: any) => (p["place name"] || "").toLowerCase());
      const stateName = (zipData.places[0].state || "").toLowerCase();
      
      const hasMatch = (keyword: string) => {
        return allPlaceNames.some((name: string) => name.includes(keyword)) || stateName.includes(keyword);
      };
      
      if (hasMatch("jaipur")) {
        cityName = "Jaipur";
        citySlug = "jaipur";
      } else if (hasMatch("jodhpur")) {
        cityName = "Jodhpur";
        citySlug = "jodhpur";
      } else if (hasMatch("kota")) {
        cityName = "Kota";
        citySlug = "kota";
      } else if (hasMatch("ajmer")) {
        cityName = "Ajmer";
        citySlug = "ajmer";
      } else if (stateName.includes("delhi")) {
        cityName = "New Delhi";
        citySlug = "new-delhi";
      } else {
        const rawPlaceName = zipData.places[0]["place name"];
        cityName = rawPlaceName;
        citySlug = rawPlaceName.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      }

      try {
        const batch = adminDb.batch();
        const impressionRef = adminDb.collection("city_impressions").doc(citySlug);
        batch.set(impressionRef, {
          city: cityName,
          state: zipData.places[0].state,
          total_lookups: increment(1),
          last_lookup: serverTimestamp(),
        }, { merge: true });

        const serviceAreaRef = adminDb.collection("service_areas").doc(citySlug);
        batch.set(serviceAreaRef, {
          priority_score: increment(0.2),
          updated_at: serverTimestamp()
        }, { merge: true });
        
        await batch.commit();
      } catch (logErr) {
        console.error("Failed to log city impression:", logErr);
      }

      return NextResponse.json(
        { district: cityName, state: zipData.places[0].state, city: cityName, served: true, citySlug: citySlug },
        { status: 200 }
      );
    }
    
    return NextResponse.json({ error: "Pincode not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
