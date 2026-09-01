import http from "http";
import fs from "fs";

async function runEndToEnd() {
  console.log("Starting E2E Test...");
  
  // 1. Generate Quote
  const generateRes = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installation_type: "new",
      indoor_camera_count: 2,
      outdoor_camera_count: 2,
      recording_days: 7,
      recording_mode: "motion",
      property_type: "Residential"
    })
  });
  
  const generateData = await generateRes.json();
  if (!generateData.success) throw new Error("Failed to generate: " + JSON.stringify(generateData));
  
  const ipPlan = generateData.plans["Budget_IP_5MP"];
  const ptzBudget = generateData.addons.find(a => a.id === "upg_ptz_budget_15x");
  
  const modifiedPlan = { ...ipPlan };
  const ptzAddonLine = {
     item_id: "upg_ptz_budget_15x",
     display_name: ptzBudget.display_name,
     qty: 1,
     unit_price: ptzBudget.unit_price,
     line_total: ptzBudget.unit_price,
     base_cost_at_quote: ptzBudget.base_cost
  };
  modifiedPlan.items.push(ptzAddonLine);
  modifiedPlan.addons_total = ptzBudget.unit_price;
  
  const oldGross = modifiedPlan.gross_subtotal;
  modifiedPlan.gross_subtotal = oldGross + ptzBudget.unit_price;
  modifiedPlan.net_taxable_amount = modifiedPlan.gross_subtotal;
  modifiedPlan.gst_amount = modifiedPlan.net_taxable_amount * 0.18;
  modifiedPlan.total_payable = Math.round(modifiedPlan.net_taxable_amount + modifiedPlan.gst_amount);

  // 3. Save Quote
  const saveRes = await fetch("http://localhost:3000/api/quote/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Test E2E User",
      customer_mobile: "9999999999",
      requirementSnapshot: generateData.requirement,
      configurationSnapshot: generateData.configuration,
      pricingSnapshot: modifiedPlan,
      selectedPlan: "Budget_IP_5MP",
      isV2: true
    })
  });
  
  const saveData = await saveRes.json();
  if (!saveData.success) throw new Error("Failed to save: " + JSON.stringify(saveData));
  
  const quoteId = saveData.quoteId;
  console.log("Saved Quote ID:", quoteId);
  
  // 4. Download PDF
  const pdfRes = await fetch(`http://localhost:3000/api/quote/${quoteId}/download`);
  if (!pdfRes.ok) throw new Error("Failed to download PDF");
  
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfPath = "C:/Users/hp/.gemini/antigravity/brain/a1a0a74c-ede4-4dcc-84de-4e2ec5b4b775/Test_E2E_Quotation_PTZ.pdf";
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
  
  console.log(`Saved PDF to ${pdfPath}`);
}

runEndToEnd().catch(console.error);
