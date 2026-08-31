import fetch from "node-fetch";
import fs from "fs";

async function run() {
  const reqPayload = {
    customer_name: "Rahul E2E Tester",
    customer_mobile: "9988776655",
    property_type: "Residential",
    camera_count: 4,
    outdoor_camera_count: 2,
    recording_days: 15
  };

  console.log("1. Generating Quote...");
  const res = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqPayload)
  });
  
  if (!res.ok) {
     console.log(await res.text());
     return;
  }
  const data = await res.json();
  
  console.log("Plans generated:");
  console.log(Object.keys(data.plans));
  
  // Pick IP 5MP
  const planId = "IP_5MP";
  const basePlan = data.plans[planId];
  
  console.log(`\n2. Base Plan ${planId} Price: ?${basePlan.total_payable}`);
  
  console.log("\n3. Available Addons from DB:");
  const addons = data.addons || [];
  addons.forEach(a => console.log(` - ${a.display_name} (Stock: ${a.stock_quantity}) @ ?${a.unit_price}`));

  // Simulate applying 2x Addon if it exists, else we just proceed
  let modifiedPlan = JSON.parse(JSON.stringify(basePlan));
  const ptzAddon = addons.find(a => a.category === "upgrade_camera");
  if (ptzAddon) {
    console.log(`\n4. Simulating Upgrade: adding 2x ${ptzAddon.display_name}`);
    const addedExTax = ptzAddon.unit_price * 2;
    modifiedPlan.items.push({
      product_id: ptzAddon.id,
      display_name: `2x Upgrade: ${ptzAddon.display_name}`,
      qty: 2,
      unit_price: ptzAddon.unit_price,
      line_total: addedExTax,
    });
    modifiedPlan.base_hardware_cost += addedExTax;
    modifiedPlan.finalExTax += addedExTax;
    const addedGst = addedExTax * 0.18;
    modifiedPlan.gstAmount += addedGst;
    modifiedPlan.total_payable = Math.round(modifiedPlan.total_payable + addedExTax + addedGst);
    console.log(`   New Price: ?${modifiedPlan.total_payable}`);
  } else {
    console.log("\n4. No camera upgrades found in DB. Skipping addon injection.");
  }

  console.log("\n5. Saving Final Quote...");
  const saveRes = await fetch("http://localhost:3000/api/quote/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: reqPayload.customer_name,
      customer_mobile: reqPayload.customer_mobile,
      requirementSnapshot: reqPayload,
      configurationSnapshot: data.configuration,
      pricingSnapshot: modifiedPlan,
      selectedPlan: planId
    })
  });
  const saveData = await saveRes.json();
  
  console.log(`   Quote Saved! ID: ${saveData.quoteId}`);
  
  console.log("\n6. Generating PDF...");
  const pdfRes = await fetch(`http://localhost:3000/api/quote/${saveData.quoteId}/pdf`);
  const pdfData = await pdfRes.json();
  console.log(`   PDF URL: ${pdfData.url}`);
  
  console.log("\n? E2E Cycle Completed Successfully!");
}
run();
