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
  console.log("Plans type:", typeof d.plans);
  if (d.plans) {
     console.log("Is object?", typeof d.plans === "object");
     console.log("Keys:", Object.keys(d.plans));
  }
})
.catch(e => console.error(e));
