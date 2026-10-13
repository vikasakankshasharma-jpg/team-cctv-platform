import { NextRequest, NextResponse } from "next/server";
import { adminDb, serverTimestamp, increment } from "@/lib/firebase-admin";

export const dynamic = 'force-dynamic';

import { isPincodeActiveByDefault, resolveStaticHierarchy } from "@/lib/geo/geoHierarchy";

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

    // 2. Check Geo Hierarchy for Active status and Tehsil
    let served = false;
    let tehsil = "";

    try {
      const geoPinSnap = await adminDb.collection("geo_pincodes").doc(pin).get();
      if (geoPinSnap.exists) {
        const geoData = geoPinSnap.data();
        served = geoData?.status === "active";
        tehsil = geoData?.tehsil || "";
      } else {
        served = isPincodeActiveByDefault(pin);
        const staticMeta = resolveStaticHierarchy(pin);
        tehsil = staticMeta?.tehsil || firstOffice.Block || firstOffice.District || "Central";
      }
    } catch (geoCheckErr) {
      served = isPincodeActiveByDefault(pin);
      const staticMeta = resolveStaticHierarchy(pin);
      tehsil = staticMeta?.tehsil || firstOffice.District;
    }

    let citySlug = "jaipur";
    if (districtName.includes("jaipur")) citySlug = "jaipur";
    else if (districtName.includes("jodhpur")) citySlug = "jodhpur";
    else if (districtName.includes("kota")) citySlug = "kota";
    else if (districtName.includes("ajmer")) citySlug = "ajmer";
    else if (districtName.includes("udaipur")) citySlug = "udaipur";
    else if (districtName.includes("delhi")) citySlug = "new-delhi";
    else citySlug = districtName.replace(/\s+/g, '-').toLowerCase();

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

    const { getVerifiedQuadrants } = await import("@/lib/geo/jaipurQuadrants");
    const verifiedQuadrants = getVerifiedQuadrants(pin);
    let quadrants = verifiedQuadrants || (cacheSnap.exists && cacheSnap.data()?.quadrants ? cacheSnap.data()?.quadrants : undefined);
    
    // If verified quadrants are available, ensure cache is updated with authentic data
    if (verifiedQuadrants) {
      const existingData = cacheSnap.exists ? cacheSnap.data() : null;
      if (!existingData?.quadrants || JSON.stringify(existingData.quadrants) !== JSON.stringify(verifiedQuadrants)) {
        await cacheRef.set({ quadrants: verifiedQuadrants }, { merge: true }).catch(() => {});
      }
    }

    // Universal Delivery Hubs Generator for ANY PINCODE across India:
    // Derives authentic delivery micro-hubs directly from official Sub-Post Offices (S.O.) and Branch Offices (B.O.)
    if (!quadrants || !Array.isArray(quadrants) || quadrants.length === 0) {
      if (postOffices && postOffices.length > 0) {
        // Sort: Delivery offices and Sub Post Offices / Head Post Offices first
        const sorted = [...postOffices].sort((a, b) => {
          const aDel = a.DeliveryStatus === "Delivery" ? 1 : 0;
          const bDel = b.DeliveryStatus === "Delivery" ? 1 : 0;
          if (aDel !== bDel) return bDel - aDel;
          const aSO = (a.BranchType === "Sub Post Office" || a.BranchType === "Head Post Office") ? 1 : 0;
          const bSO = (b.BranchType === "Sub Post Office" || b.BranchType === "Head Post Office") ? 1 : 0;
          return bSO - aSO;
        });
        const topOffices = sorted.slice(0, 8);
        quadrants = topOffices.map((po: any) => {
          const cleanName = formatAreaName(po.Name);
          const branchLabel = po.BranchType ? ` (${po.BranchType})` : '';
          return {
            zone: cleanName,
            anchor: `${po.Name}${branchLabel}`,
            coverage: `${cleanName} and surrounding delivery beats`
          };
        });
      } else {
        const areaList = formattedAreas && formattedAreas.length > 0 ? formattedAreas : [locationName];
        quadrants = areaList.slice(0, 6).map((a: string) => ({
          zone: a,
          anchor: `${a} Post Office`,
          coverage: `${a} and surrounding localities`
        }));
      }

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
        district: firstOffice.District,
        tehsil: tehsil,
        state: firstOffice.State,
        pincode: pin,
        served: served,
        total_lookups: increment(1),
        last_lookup: serverTimestamp(),
      }, { merge: true });

      const demandImpRef = adminDb.collection("demand_impressions").doc(`${pin}_${districtName.replace(/\s+/g, '-')}`);
      batch.set(demandImpRef, {
        pincode: pin,
        city: firstOffice.District,
        district: firstOffice.District,
        tehsil: tehsil,
        state: firstOffice.State,
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
        tehsil: tehsil,
        served: served, 
        citySlug: citySlug,
        lat,
        lng,
        radius,
        areas: aiAreas && aiAreas.length > 0 ? aiAreas : formattedAreas,
        sub_areas: subAreas,
        quadrants: quadrants,
        delivery_hubs: quadrants,
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
