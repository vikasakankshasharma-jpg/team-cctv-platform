import fetch from "node-fetch";

const cases = [
  { name: "Standard 8-cam IP", req: { camera_count: 8, technology_preference: "IP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 4, outdoor_camera_count: 4, property_type: "Residential", camera_form_factor: "wired" } },
  { name: "Large 16-cam HD Premium", req: { camera_count: 16, technology_preference: "HD", recording_days: 30, budget_preference: "PREMIUM", indoor_camera_count: 8, outdoor_camera_count: 8, property_type: "Commercial", camera_form_factor: "wired" } },
  { name: "Small 2-cam IP Long-Storage", req: { camera_count: 2, technology_preference: "IP", recording_days: 90, budget_preference: "BUDGET", indoor_camera_count: 2, outdoor_camera_count: 0, property_type: "Residential", camera_form_factor: "wired" } },
  { name: "Massive 32-cam IP", req: { camera_count: 32, technology_preference: "IP", recording_days: 15, budget_preference: "RECOMMENDED", indoor_camera_count: 16, outdoor_camera_count: 16, property_type: "Industrial", camera_form_factor: "wired" } },
  { name: "Outdoor 4-cam HD Economy", req: { camera_count: 4, technology_preference: "HD", recording_days: 15, budget_preference: "BUDGET", indoor_camera_count: 0, outdoor_camera_count: 4, property_type: "Residential", camera_form_factor: "wired" } },
];

async function runTests() {
  let passed = 0;
  for (const c of cases) {
    console.log(`\n--- Test: ${c.name} ---`);
    const res = await fetch("https://cctvquotation.com/api/quote/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c.req)
    });
    const data = await res.json();
    if (!data.success) {
      console.log("Failed API:", data);
      continue;
    }
    
    const items = data.plans[c.req.budget_preference.toLowerCase() || 'recommended']?.items || data.plans.recommended.items;
    
    let errors = [];
    
    // 1. Tech Match
    const cams = items.filter(i => i.display_name.toLowerCase().includes("camera") || i.display_name.toLowerCase().includes("dome") || i.display_name.toLowerCase().includes("bullet"));
    if (cams.some(cam => !cam.display_name.includes(c.req.technology_preference))) {
      errors.push(`Camera technology mismatch. Expected ${c.req.technology_preference}, got: ${cams.map(c=>c.display_name).join(', ')}`);
    }
    
    // 2. Storage Match
    const hdd = items.find(i => i.display_name.toLowerCase().includes("hard disk") || i.display_name.toLowerCase().includes("hdd"));
    if (!hdd && c.req.recording_days > 0) {
      errors.push("Missing HDD in pricing items!");
    }
    
    // 3. Power Supply Match
    const power = items.find(i => i.display_name.toLowerCase().includes("poe") || i.display_name.toLowerCase().includes("smps") || i.display_name.toLowerCase().includes("power"));
    if (!power) {
      errors.push("Missing Power Supply in pricing items!");
    } else {
      if (c.req.technology_preference === "IP" && !power.display_name.toLowerCase().includes("poe")) {
        errors.push(`Expected PoE switch for IP, got: ${power.display_name}`);
      }
      if (c.req.technology_preference === "HD" && !power.display_name.toLowerCase().includes("smps") && !power.display_name.toLowerCase().includes("power supply")) {
        errors.push(`Expected SMPS for HD, got: ${power.display_name}`);
      }
    }
    
    if (errors.length === 0) {
      console.log("? PASSED");
      passed++;
    } else {
      console.log("? FAILED");
      errors.forEach(e => console.log("   ->", e));
      console.log("Selected power:", power?.display_name);
    }
  }
  console.log(`\nResults: ${passed}/${cases.length} passed.`);
}
runTests();
