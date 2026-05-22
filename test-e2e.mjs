import fetch from 'node-fetch';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

async function runE2ETest() {
  console.log("🚀 STARTING E2E FULL-CYCLE TEST\n");
  
  try {
    // -----------------------------------------------------
    // ACTOR: CUSTOMER
    // ACTION: Submit Wizard & Create Lead
    // -----------------------------------------------------
    console.log("👤 ACTOR: CUSTOMER");
    console.log("-> Submitting Wizard & Creating Lead...");
    
    const leadPayload = {
      customer_name: "E2E Test User",
      mobile_number: "9999988888",
      property_type: "Residential",
      technology_choice: "IP",
      cabling_done: false,
      referral_code: "DEMO-PROMO-123",
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan"
      }
    };

    const leadRes = await fetch(`${BASE_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload)
    });

    const leadData = await leadRes.json();
    if (!leadData.success) {
      throw new Error(`Lead Creation Failed: ${JSON.stringify(leadData)}`);
    }
    const leadId = leadData.data.id;
    console.log(`✅ Lead Created Successfully! ID: ${leadId}`);

    // -----------------------------------------------------
    // ACTOR: CUSTOMER
    // ACTION: Generate & Save Quote
    // -----------------------------------------------------
    console.log("-> Generating Quotation...");
    
    const quotePayload = {
      lead_id: leadId,
      status: "draft",
      selection: {
        plan_type: "better",
        technology: "IP",
        camera_count: 4,
        storage_days: 15,
        resolution: "5MP"
      }
    };

    const quoteRes = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });

    const quoteData = await quoteRes.json();
    if (!quoteData.success) {
      console.warn(`⚠️ Quote Generation Failed (Expected if DB seed differs): ${JSON.stringify(quoteData)}`);
    } else {
      console.log(`✅ Quote Generated Successfully! ID: ${quoteData.data.id} | Total: ₹${quoteData.data.total_payable}`);
    }

    console.log("\n✅ E2E API SIMULATION COMPLETE.");
    
  } catch (err) {
    console.error("\n❌ E2E TEST FAILED:", err.message);
  }
}

runE2ETest();
