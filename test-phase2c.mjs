import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testPhase2C() {
  console.log('TESTING PHASE 2C: WIZARD + PRICING + INSTALLER DATA CONTRACT\n');

  // 1. Submit lead with split cameras & site readiness data
  const leadPayload = {
    customer_name: "Sunil Verma (8-Cam Mixed Site)",
    mobile_number: "9829012345",
    firebase_uid: "test_uid_" + Date.now(),
    property_type: "office",
    technology_choice: "HD",
    cabling_done: false,
    wizard_answers: {
      pincode: "302001",
      city: "Jaipur",
      state: "Rajasthan",
      camera_count: 8,
      outdoor_camera_count: 3,
      indoor_camera_count: 5,
      wiring_type: "conduit",
      power_socket_near_dvr: true,
      router_near_dvr: false,
      mounting_height: "high",
      q_recording_mode: "motion"
    }
  };

  console.log('1. Submitting lead with 8 cameras (3 Outdoor, 5 Indoor, Conduit wiring)...');
  const leadRes = await fetch(BASE_URL + '/api/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leadPayload)
  });
  const leadJson = await leadRes.json();
  console.log('Lead Submission Result:', leadJson);
  const leadId = leadJson.data?.id;
  if (!leadId) throw new Error('Lead creation failed');

  // 2. Generate Quote
  console.log('\n2. Generating quote for lead:', leadId);
  const quoteRes = await fetch(BASE_URL + '/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lead_id: leadId,
      status: "draft",
      selection: {
        lead_id: leadId,
        plan_type: "recommended",
        technology: "HD",
        camera_count: 8,
        picture_quality: "good",
        recording_days: 15,
        recording_mode: "motion",
        outdoor_camera_count: 3,
        indoor_camera_count: 5,
        wiring_type: "conduit"
      }
    })
  });
  const quoteJson = await quoteRes.json();
  console.log('Quote Result:', quoteJson);
  const quoteId = quoteJson.data?.id;
  if (!quoteId) throw new Error('Quote generation failed');

  return { leadId, quoteId };
}

testPhase2C().then(res => {
  console.log('\nCreated Lead:', res.leadId, 'Quote:', res.quoteId);
}).catch(console.error);
