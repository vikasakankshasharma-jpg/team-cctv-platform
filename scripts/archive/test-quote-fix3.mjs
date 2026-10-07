import fetch from "node-fetch";

async function check() {
  const genRes = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      camera_count: 8,
      technology_preference: "IP",
      recording_days: 15,
      wants_remote_viewing: true
    })
  });
  const data = await genRes.json();
  console.log("Configuration:", data.configuration);
  console.log("Premium Power:", data.plans.premium.items.find(i => i.display_name.includes("PoE") || i.display_name.includes("Power")));
}
check();
