"use server";

import https from "https";

export async function verifyPincodeAction(code: string) {
  // Create an HTTPS agent that ignores SSL errors, 
  // since the Indian Govt API has frequent SSL certificate issues.
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  try {
    // 1. Try Primary API (PostalPincode) using https.get to properly bypass SSL in Node.js
    const data: any = await new Promise((resolve, reject) => {
      https.get(`https://api.postalpincode.in/pincode/${code}`, { agent }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try { resolve(JSON.parse(rawData)); }
          catch (e) { reject(e); }
        });
      }).on('error', reject);
    });

    if (data && data[0]?.Status === "Success") {
      const postOffice = data[0].PostOffice[0];
      return {
        success: true,
        state: postOffice.State,
        district: postOffice.District,
        offices: data[0].PostOffice.map((po: any) => ({ Name: po.Name }))
      };
    }
  } catch (err) {
    console.warn("Primary API failed in server action:", err);
  }

  // 2. Try Fallback API (Zippopotamus)
  try {
    const response = await fetch(`https://api.zippopotam.us/IN/${code}`);
    const data = await response.json();

    if (data && data.places && data.places.length > 0) {
      const state = data.places[0].state;
      const placeName = data.places[0]["place name"];
      const district = placeName.split(' ')[0];
      
      return {
        success: true,
        state,
        district,
        offices: data.places.map((p: any) => ({ Name: p["place name"] }))
      };
    }
  } catch (err) {
    console.error("Fallback API failed in server action:", err);
  }

  return { success: false };
}
