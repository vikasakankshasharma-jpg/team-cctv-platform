// Run this script to test the webhook endpoint locally
// node scripts/test-whatsapp-bot.mjs

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
  
  console.log("2. Sending Pincode '302001'");
  await sendWebhook({ type: "text", text: { body: "302001" } });

  console.log("\nWaiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("3. Selecting Property Type: Home");
  await sendWebhook({ type: "interactive", interactive: { type: "button_reply", button_reply: { id: "prop_home" } } });

  console.log("\nWaiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("4. Selecting Camera Count: 4");
  await sendWebhook({ type: "interactive", interactive: { type: "list_reply", list_reply: { id: "cam_4" } } });

  console.log("\nWaiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("5. Selecting Tech: IP");
  await sendWebhook({ type: "interactive", interactive: { type: "button_reply", button_reply: { id: "tech_IP" } } });

  console.log("\nWaiting 2 seconds...");
  await new Promise(r => setTimeout(r, 2000));

  console.log("6. Selecting Storage: 30 Days (Should trigger quote generation)");
  await sendWebhook({ type: "interactive", interactive: { type: "button_reply", button_reply: { id: "storage_30" } } });

  console.log("\nTest flow complete. Check your Next.js console for bot output.");
}

runTest();
