import fetch from "node-fetch";

async function check() {
  console.log("Testing Dynamic MP API...");
  const res = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ camera_count: 4, indoor_camera_count: 2, outdoor_camera_count: 2 })
  });
  const data = await res.json();
  
  if (!data.success) {
     console.error("API Failed:", data.message);
     return;
  }

  console.log("Returned Plans:", Object.keys(data.plans));
  
  for (const key of Object.keys(data.plans)) {
      const plan = data.plans[key];
      console.log(`\n--- ${key} (Total: ?${plan.total_payable}) ---`);
      plan.items.forEach(i => console.log(`  - ${i.qty}x ${i.display_name} (?${i.line_total})`));
  }
}
check();
