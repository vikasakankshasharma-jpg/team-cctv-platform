const admin = require("firebase-admin");
const axios = require("axios"); // Axios is probably installed, if not we'll use native fetch

require("dotenv").config({ path: ".env.local" });

if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp();
  }
}

async function run() {
  try {
    const accessTokenObj = await admin.app().options.credential.getAccessToken();
    const token = accessTokenObj.access_token;
    
    // Identity Toolkit REST API endpoint
    const projectId = "team-cctv-live-8294"; // Or we could extract it from serviceAccount, but we know it
    const url = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

    // Fetch current config
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch config: ${await res.text()}`);
    }
    
    const config = await res.json();
    console.log("Current authorized domains:", config.authorizedDomains);
    
    let updated = false;
    const domains = config.authorizedDomains || ["localhost"];
    
    if (!domains.includes("cctvquotation.com")) {
      domains.push("cctvquotation.com");
      updated = true;
    }
    if (!domains.includes("www.cctvquotation.com")) {
      domains.push("www.cctvquotation.com");
      updated = true;
    }
    
    if (updated) {
      const updateRes = await fetch(`${url}?updateMask=authorizedDomains`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ authorizedDomains: domains })
      });
      
      if (!updateRes.ok) {
        throw new Error(`Failed to update config: ${await updateRes.text()}`);
      }
      console.log("Updated successfully! New domains:", domains);
    } else {
      console.log("Domains were already authorized:", domains);
    }
  } catch(e) {
    console.error("Error updating project config:", e);
  }
}
run();
