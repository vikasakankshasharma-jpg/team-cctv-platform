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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  try {
    const postRes = await fetch('https://api.postalpincode.in/pincode/' + pin);
    const postData = await postRes.json();

    if (!postData || postData[0].Status === "Error" || !postData[0].PostOffice) {
      return NextResponse.json({ error: "Pincode not found or invalid." }, { status: 404 });
    }

    const postOffice = postData[0].PostOffice[0];
    const districtName = postOffice.District.toLowerCase();
    const stateName = postOffice.State.toLowerCase();
    const locationName = postOffice.Name;

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

    try {
      const batch = adminDb.batch();
      const impressionRef = adminDb.collection("city_impressions").doc(districtName.replace(/\s+/g, '-'));
      batch.set(impressionRef, {
        city: postOffice.District,
        state: postOffice.State,
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
        district: postOffice.District, 
        state: postOffice.State, 
        city: locationName, 
        served: served, 
        citySlug: citySlug,
        message: served ? "" : "Nearest serviceable area shown as reference."
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}
