import fetch from "node-fetch";

async function fullCycleTest() {
  console.log("1. Generating Quote...");
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
  
  if (!genRes.ok) {
     console.error("Generate failed:", await genRes.text());
     return;
  }
  const genData = await genRes.json();
  console.log("   -> Success. Pricing plans:", Object.keys(genData.plans));
  console.log("   -> Recommended Price:", genData.plans.recommended.total_payable);
  
  console.log("2. Saving Quote...");
  const saveRes = await fetch("https://cctvquotation.com/api/quote/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_mobile: "9999999999",
      customer_name: "Test User",
      requirementSnapshot: genData.requirementSnapshot,
      configurationSnapshot: genData.configurationSnapshot,
      pricingSnapshot: genData.plans.recommended,
      selectedPlan: "recommended",
      source: "wizard"
    })
  });
  
  if (!saveRes.ok) {
     console.error("Save failed:", await saveRes.text());
     return;
  }
  const saveData = await saveRes.json();
  const quoteId = saveData.quoteId;
  console.log("   -> Success. Quote ID:", quoteId);
  
  console.log("3. Triggering PDF Generation Endpoint...");
  const pdfRes = await fetch(`https://cctvquotation.com/api/quote/${quoteId}/pdf`);
  if (!pdfRes.ok) {
      console.error("PDF Generate route failed:", pdfRes.status, await pdfRes.text());
      return;
  }
  const pdfData = await pdfRes.json();
  console.log("   -> Success. PDF URL:", pdfData.url);
  
  console.log("4. Testing PDF Download Stream...");
  const dlRes = await fetch(pdfData.url);
  if (!dlRes.ok) {
      console.error("Download failed:", dlRes.status, await dlRes.text());
      return;
  }
  console.log("   -> Success. Status:", dlRes.status);
  const pdfPreview = await dlRes.text();
  console.log("   -> PDF Starts with:", pdfPreview.slice(0, 50).replace(/\n/g, "\\n"));
}

fullCycleTest();
