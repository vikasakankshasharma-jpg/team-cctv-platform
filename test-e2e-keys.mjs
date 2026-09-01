async function runEndToEnd() {
  const generateRes = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installation_type: "new",
      indoor_camera_count: 2,
      outdoor_camera_count: 2,
      recording_days: 7,
      property_type: "Residential"
    })
  });
  const generateData = await generateRes.json();
  console.log("Keys:", Object.keys(generateData.plans));
}
runEndToEnd().catch(console.error);
