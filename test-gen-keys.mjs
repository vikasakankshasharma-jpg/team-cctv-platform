import fetch from "node-fetch";

async function check() {
  const genRes = await fetch("https://cctvquotation.com/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      camera_count: 4,
      technology_preference: "HD",
      recording_days: 15,
      wants_remote_viewing: true
    })
  });
  const data = await genRes.json();
  console.log("Keys:", Object.keys(data));
}
check();
