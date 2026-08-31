import fetch from "node-fetch";

async function check() {
  console.log("Testing 8MP...");
  const res8 = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ camera_count: 4, technology_preference: "IP", camera_resolution: "8MP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 2, outdoor_camera_count: 2, property_type: "Residential" })
  });
  const data8 = await res8.json();
  console.log("Premium items for 8MP:", data8.plans.premium.items.map(i => i.display_name));

  console.log("\nTesting 5MP...");
  const res5 = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ camera_count: 4, technology_preference: "IP", camera_resolution: "5MP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 2, outdoor_camera_count: 2, property_type: "Residential" })
  });
  const data5 = await res5.json();
  console.log("Premium items for 5MP:", data5.plans.premium.items.map(i => i.display_name));
}
check();
