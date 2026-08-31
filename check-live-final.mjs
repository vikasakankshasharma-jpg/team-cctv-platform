import fetch from "node-fetch";
async function check() {
  const res = await fetch("https://cctvquotation.com/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ camera_count: 8, technology_preference: "IP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 4, outdoor_camera_count: 4, property_type: "Residential", camera_form_factor: "wired" })
  });
  const data = await res.json();
  const power = data.plans.recommended.items.find(i => i.display_name.toLowerCase().includes("power") || i.display_name.toLowerCase().includes("poe"));
  console.log("Selected Power:", power?.display_name);
}
check();
