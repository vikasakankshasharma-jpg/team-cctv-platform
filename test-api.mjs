const req = {
  "installation_type": "new",
  "camera_count": 4,
  "ceiling_height": "standard",
  "surface_types": ["brick"],
  "cabling_done": false,
  "recording_days": 15,
  "recording_mode": "motion",
  "customer_name": "Test",
  "customer_mobile": "9999999999"
};

fetch("http://127.0.0.1:3000/api/quote/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(req)
})
.then(r => r.json())
.then(d => {
  console.log("Success:", d.success);
  console.log("Plans count:", Object.keys(d.plans || {}).length);
})
.catch(e => console.error(e));
