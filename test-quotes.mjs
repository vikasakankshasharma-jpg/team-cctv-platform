import http from "https";

const testCases = [
  {
    name: "New System - Default (4 Cams, 7 Days)",
    payload: {
      installation_type: "new",
      property_type: "Residential",
      camera_count: 4,
      outdoor_camera_count: 2,
      indoor_camera_count: 2,
      recording_days: 7,
      recording_mode: "motion",
      customer_name: "Test User",
      customer_mobile: "9999999999"
    }
  },
  {
    name: "New System - No Recording",
    payload: {
      installation_type: "new",
      property_type: "Residential",
      camera_count: 4,
      outdoor_camera_count: 2,
      indoor_camera_count: 2,
      recording_days: 0,
      recording_mode: "continuous",
      customer_name: "Test User",
      customer_mobile: "9999999999"
    }
  },
  {
    name: "Addon - Needs DVR Upgrade (3 old + 2 new > 4 ch)",
    payload: {
      installation_type: "addon",
      existing_system_known: true,
      existing_technology: "HD",
      existing_recorder_channels: 4,
      existing_working_cameras: 3,
      camera_count: 2,
      outdoor_camera_count: 1,
      indoor_camera_count: 1,
      retain_existing_storage: false,
      recording_days: 15,
      recording_mode: "motion",
      customer_name: "Test User",
      customer_mobile: "9999999999"
    }
  },
  {
    name: "Addon - Fits in old DVR, retains storage",
    payload: {
      installation_type: "addon",
      existing_system_known: true,
      existing_technology: "HD",
      existing_recorder_channels: 4,
      existing_working_cameras: 2,
      camera_count: 1,
      outdoor_camera_count: 1,
      indoor_camera_count: 0,
      retain_existing_storage: true,
      recording_days: 7,
      recording_mode: "motion",
      customer_name: "Test User",
      customer_mobile: "9999999999"
    }
  }
];

async function runTests() {
  for (const tc of testCases) {
    console.log(`\n============================`);
    console.log(`TESTING: ${tc.name}`);
    
    await new Promise((resolve) => {
      const req = http.request("https://team-cctv-live-8294.web.app/api/quote/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.success) {
              console.log("API returned error:", json);
            } else {
              const plans = json.plans;
              const firstPlanKey = Object.keys(plans)[0];
              const plan = plans[firstPlanKey];
              
              console.log(`Plan Key: ${firstPlanKey}`);
              console.log(`Items included in quote:`);
              plan.items.forEach(i => console.log(` - ${i.qty}x ${i.display_name} (?${i.line_total})`));
              
              const itemSum = plan.items.reduce((acc, i) => acc + i.line_total, 0);
              console.log(`Calculated Item Sum: ?${itemSum}`);
              console.log(`Plan Base Cost: ?${plan.base_hardware_cost}`);
              console.log(`Plan Final Ex Tax: ?${plan.finalExTax}`);
              console.log(`Plan GST: ?${plan.gstAmount.toFixed(2)}`);
              console.log(`Total Payable: ?${plan.total_payable}`);
              
              if (itemSum !== plan.base_hardware_cost) {
                console.error("WARNING: Item sum does not match base hardware cost!");
              }
            }
          } catch(e) {
            console.error("Failed to parse response", data);
          }
          resolve();
        });
      });
      req.write(JSON.stringify(tc.payload));
      req.end();
    });
  }
}

runTests();
