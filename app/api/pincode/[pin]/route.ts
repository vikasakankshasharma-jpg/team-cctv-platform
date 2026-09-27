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
    // 1. Fetch from postal API
    const postRes = await fetch('https://api.postalpincode.in/pincode/' + pin);
    const postData = await postRes.json();

    if (!postData || postData[0].Status === "Error" || !postData[0].PostOffice) {
      return NextResponse.json({ error: "Pincode not found or invalid." }, { status: 404 });
    }

    const postOffices = postData[0].PostOffice;
    const firstOffice = postOffices[0];
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

    const cacheRef = adminDb.collection("pincode_cache").doc(pin);
    const cacheSnap = await cacheRef.get();
    
    if (cacheSnap.exists) {
      const c = cacheSnap.data();
      if (c && c.lat && c.lng && c.radius) {
         lat = c.lat;
         lng = c.lng;
         radius = c.radius;
      }
    }

    // 3. If not cached, calculate using Google Geocoding API
    if (!lat || !lng || !radius) {
       const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
       if (apiKey) {
          const points: { lat: number, lng: number }[] = [];
          
          await Promise.all(formattedAreas.map(async (area: string) => {
             try {
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(area + ', ' + pin + ', India')}&key=${apiKey}`);
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
                const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(pin + ', India')}&key=${apiKey}`);
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

          // Cache it if we found it
          if (lat && lng && radius) {
             await cacheRef.set({
               lat, lng, radius,
               areas: formattedAreas,
               updated_at: serverTimestamp()
             }, { merge: true });
          }
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
        areas: formattedAreas,
        message: served ? "" : "Nearest serviceable area shown as reference."
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}



