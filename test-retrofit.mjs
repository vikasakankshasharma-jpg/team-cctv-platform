import http from "http";
import fs from "fs";

async function runEndToEnd() {
  console.log("Starting Retrofit Test...");
  
  // 1. Generate Quote
  const generateRes = await fetch("http://localhost:3000/api/quote/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      installation_type: "addon",
      indoor_camera_count: 2,
      outdoor_camera_count: 0,
      recording_days: 0, // No new storage
      existing_recorder_channels: 4,
      existing_working_cameras: 2, // No new recorder needed!
      property_type: "Residential"
    })
  });
  
  const generateData = await generateRes.json();
  const hdPlan = generateData.plans["Budget_HD_2MP"];

  // 3. Save Quote
  const saveRes = await fetch("http://localhost:3000/api/quote/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_name: "Test Addon User",
      customer_mobile: "8888888888",
      requirementSnapshot: generateData.requirement,
      configurationSnapshot: generateData.configuration,
      pricingSnapshot: hdPlan,
      selectedPlan: "Budget_HD_2MP",
      isV2: true
    })
  });
  
  const saveData = await saveRes.json();
  const quoteId = saveData.quoteId;
  console.log("Saved Quote ID:", quoteId);
  
  // 4. Download PDF
  const pdfRes = await fetch(`http://localhost:3000/api/quote/${quoteId}/download`);
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfPath = "C:/Users/hp/.gemini/antigravity/brain/a1a0a74c-ede4-4dcc-84de-4e2ec5b4b775/Test_Retrofit_Quotation.pdf";
  fs.writeFileSync(pdfPath, Buffer.from(pdfBuffer));
  
  console.log(`Saved PDF to ${pdfPath}`);
}

runEndToEnd().catch(console.error);
