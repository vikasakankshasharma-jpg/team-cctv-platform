import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const propertyTypes = ["home", "shop", "office", "factory", "other"];
const technologies = ["IP", "HD"];
const cablingDoneOptions = [true, false];
const planTypes = ["budget", "recommended", "premium"];
const pictureQualities = ["good", "very_clear", "crystal_clear"];
const storageDaysOptions = [7, 15, 30, 45, 60];
const referralCodes = ["DEMOPROMO123", "DISCOUNT50", undefined];

async function runTest(customerIndex) {
  console.log(`\n======================================================`);
  console.log(`👤 ACTOR: CUSTOMER #${customerIndex}`);
  
  const customerName = `Test Customer ${customerIndex}`;
  const mobileNumber = "99999" + String(getRandomInt(10000, 99999));
  const propertyType = getRandomElement(propertyTypes);
  const technologyChoice = getRandomElement(technologies);
  const cablingDone = getRandomElement(cablingDoneOptions);
  const referralCode = getRandomElement(referralCodes);
  
  const planType = getRandomElement(planTypes);
  const cameraCount = getRandomInt(1, 16);
  const storageDays = getRandomElement(storageDaysOptions);
  const pictureQuality = getRandomElement(pictureQualities);

  console.log(`-> Submitting Wizard & Creating Lead for ${customerName}...`);
  console.log(`   Requirements: ${propertyType}, ${technologyChoice}, Cabling: ${cablingDone}`);
  
  const leadPayload = {
    customer_name: customerName,
    mobile_number: mobileNumber,
    firebase_uid: `demo_uid_${customerIndex}_${Date.now()}`,
    property_type: propertyType,
    technology_choice: technologyChoice,
    cabling_done: cablingDone,
    referral_code: referralCode,
    wizard_answers: {
      pincode: "302001",
      city: "Jaipur",
      state: "Rajasthan"
    }
  };

  try {
    const leadRes = await fetch(`${BASE_URL}/api/submissions`, {
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

    console.log(`-> Generating Quotation for Lead ${leadId}...`);
    console.log(`   Quote Requirements: Plan: ${planType}, Tech: ${technologyChoice}, Cameras: ${cameraCount}, Storage: ${storageDays} days, Picture Quality: ${pictureQuality}`);
    
    const quotePayload = {
      lead_id: leadId,
      status: "draft",
      selection: {
        lead_id: leadId,
        plan_type: planType,
        technology: technologyChoice,
        camera_count: cameraCount,
        picture_quality: pictureQuality,
        recording_days: storageDays
      }
    };

    const quoteRes = await fetch(`${BASE_URL}/api/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });

    const quoteData = await quoteRes.json();
    if (!quoteData.success) {
      console.warn(`⚠️ Quote Generation Failed: ${JSON.stringify(quoteData)}`);
      return { success: false, error: quoteData };
    } else {
      console.log(`✅ Quote Generated Successfully! ID: ${quoteData.data.id} | Total: ₹${quoteData.data.total_payable}`);
      return { success: true, data: quoteData.data };
    }
  } catch (err) {
    console.error(`❌ TEST FAILED FOR CUSTOMER #${customerIndex}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function runAllTests() {
  console.log("🚀 STARTING E2E FULL-CYCLE TEST FOR 10 CUSTOMERS\n");
  const results = [];
  
  for (let i = 1; i <= 10; i++) {
    const result = await runTest(i);
    results.push({ customer: i, result });
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const successful = results.filter(r => r.result.success).length;
  console.log(`\n======================================================`);
  console.log(`📊 SUMMARY: ${successful}/10 Tests Passed`);
  
  if (successful < 10) {
    console.log("⚠️ Some tests failed. Please review the logs above.");
  }
}

runAllTests();
