// Run this script to test the webhook endpoint locally with WhatsApp Flows
// node scripts/test-whatsapp-flow.mjs

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/whatsapp";
const PHONE = "919999999999";

async function sendWebhook(messageObj) {
  const payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: PHONE,
                  ...messageObj
                }
              ]
            }
          }
        ]
      }
    ]
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log(`Payload sent, response status: ${res.status}`);
  } catch (err) {
    console.error("Failed to send webhook:", err.message);
  }
}

async function runTest() {
  console.log("1. Sending 'Hi'");
  await sendWebhook({ type: "text", text: { body: "Hi" } });
  
  console.log("\nWaiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("2. Sending WhatsApp Flow Submission (all 14 steps)");
  const flowResponseJson = JSON.stringify({
    lead_pincode: "302001",
    property_type: "home",
    install_type: "new",
    technology: "IP",
    resolution: "4mp",
    indoor_camera_count: 2,
    outdoor_camera_count: 2,
    recording_days: 30,
    requested_features: ["Audio", "ColorVu"],
    wants_remote_viewing: true,
    broadband_status: "yes",
    selected_addons: ["monitor"],
    wiring_type: "conduit",
    ceiling_height: "standard",
    ladder_arrangement: "customer",
    surface_types: ["brick", "false_ceiling"],
    site_condition: "furnished",
    wall_penetration: "easy",
    installation_timeline: "this_week",
    brand_preference: "cpplus",
    wants_amc: true
  });

  await sendWebhook({ 
    type: "interactive", 
    interactive: { 
      type: "nfm_reply", 
      nfm_reply: { 
        response_json: flowResponseJson,
        body: "Sent",
        name: "flow_name"
      } 
    } 
  });

  console.log("\nTest flow complete. The webhook should now generate the quote with all 14 variables.");
}

runTest();
