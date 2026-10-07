import fs from "fs";

async function run() {
  const reqBody = {
    "property_type": "commercial",
    "camera_count": 8,
    "outdoor_camera_count": 2,
    "recording_days": 15,
    "recording_mode": "continuous",
    "technology_preference": "IP",
    "wants_remote_viewing": true,
    "installation_type": "full",
    "customer_name": "Test Fifteen Days",
    "customer_mobile": "9999999999"
  };

  const res = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody)
  });
  
  const data = await res.json();
  const plan = data.plans["Budget_IP_5MP"];
  
  console.log("Configuration Storage GB:", data.configuration.storage_gb);
  console.log("Plan Storage Item:", plan.storage?.display_name);
}
run();
