import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

const BASE_URL = 'http://localhost:3000';

const ADVERSARIAL_CUSTOMERS = [
  {
    name: "Customer A — Normal Home (6 Cams, Balanced)",
    lead: {
      customer_name: "Customer A (Normal)",
      mobile_number: "9829000001",
      firebase_uid: "test_a_" + Date.now(),
      property_type: "home",
      technology_choice: "HD",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 6,
        outdoor_camera_count: 2,
        indoor_camera_count: 4,
        wiring_type: "open",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "standard",
        q_recording_mode: "continuous"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "HD",
      camera_count: 6,
      picture_quality: "good",
      recording_days: 15,
      recording_mode: "continuous",
      outdoor_camera_count: 2,
      indoor_camera_count: 4,
      wiring_type: "open"
    },
    expected: { totalCams: 6, outdoor: 2, indoor: 4, wiring: "open", minChannels: 8 }
  },
  {
    name: "Customer B — Confused Quality (2MP HD Basic)",
    lead: {
      customer_name: "Customer B (Confused)",
      mobile_number: "9829000002",
      firebase_uid: "test_b_" + Date.now(),
      property_type: "home",
      technology_choice: "HD",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 4,
        outdoor_camera_count: 1,
        indoor_camera_count: 3,
        wiring_type: "open",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "standard",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "budget",
      technology: "HD",
      camera_count: 4,
      picture_quality: "good",
      recording_days: 15,
      recording_mode: "motion",
      outdoor_camera_count: 1,
      indoor_camera_count: 3,
      wiring_type: "open"
    },
    expected: { totalCams: 4, outdoor: 1, indoor: 3, wiring: "open", minChannels: 4 }
  },
  {
    name: "Customer C — Budget Constrained (10 Cams, Budget Tier)",
    lead: {
      customer_name: "Customer C (Budget Constrained)",
      mobile_number: "9829000003",
      firebase_uid: "test_c_" + Date.now(),
      property_type: "shop",
      technology_choice: "HD",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 10,
        outdoor_camera_count: 2,
        indoor_camera_count: 8,
        wiring_type: "open",
        power_socket_near_dvr: true,
        router_near_dvr: false,
        mounting_height: "standard",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "budget",
      technology: "HD",
      camera_count: 10,
      picture_quality: "good",
      recording_days: 7,
      recording_mode: "motion",
      outdoor_camera_count: 2,
      indoor_camera_count: 8,
      wiring_type: "open"
    },
    expected: { totalCams: 10, outdoor: 2, indoor: 8, wiring: "open", minChannels: 16 }
  },
  {
    name: "Customer D — Industrial Warehouse (8 Outdoor, 4 Indoor, Conduit)",
    lead: {
      customer_name: "Customer D (Industrial)",
      mobile_number: "9829000004",
      firebase_uid: "test_d_" + Date.now(),
      property_type: "factory",
      technology_choice: "IP",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 12,
        outdoor_camera_count: 8,
        indoor_camera_count: 4,
        wiring_type: "conduit",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "high",
        q_recording_mode: "continuous"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "IP",
      camera_count: 12,
      picture_quality: "very_clear",
      recording_days: 30,
      recording_mode: "continuous",
      outdoor_camera_count: 8,
      indoor_camera_count: 4,
      wiring_type: "conduit"
    },
    expected: { totalCams: 12, outdoor: 8, indoor: 4, wiring: "conduit", minChannels: 16 }
  },
  {
    name: "Customer E — Upgrade Site (Cabling Already Done)",
    lead: {
      customer_name: "Customer E (Upgrade)",
      mobile_number: "9829000005",
      firebase_uid: "test_e_" + Date.now(),
      property_type: "home",
      technology_choice: "HD",
      cabling_done: true,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 4,
        outdoor_camera_count: 2,
        indoor_camera_count: 2,
        wiring_type: "open",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "standard",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "HD",
      camera_count: 4,
      picture_quality: "good",
      recording_days: 15,
      recording_mode: "motion",
      outdoor_camera_count: 2,
      indoor_camera_count: 2,
      wiring_type: "open"
    },
    expected: { totalCams: 4, outdoor: 2, indoor: 2, wiring: "open", minChannels: 4, cablingDone: true }
  },
  {
    name: "Customer F — Distant WiFi Router (Needs Long LAN / 4G)",
    lead: {
      customer_name: "Customer F (Distant Router)",
      mobile_number: "9829000006",
      firebase_uid: "test_f_" + Date.now(),
      property_type: "office",
      technology_choice: "HD",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 4,
        outdoor_camera_count: 1,
        indoor_camera_count: 3,
        wiring_type: "open",
        power_socket_near_dvr: true,
        router_near_dvr: false,
        mounting_height: "standard",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "HD",
      camera_count: 4,
      picture_quality: "good",
      recording_days: 15,
      recording_mode: "motion",
      outdoor_camera_count: 1,
      indoor_camera_count: 3,
      wiring_type: "open"
    },
    expected: { totalCams: 4, outdoor: 1, indoor: 3, wiring: "open", minChannels: 4 }
  },
  {
    name: "Customer G — Finished Interior (PVC Conduit Mandate)",
    lead: {
      customer_name: "Customer G (Finished Interior)",
      mobile_number: "9829000007",
      firebase_uid: "test_g_" + Date.now(),
      property_type: "office",
      technology_choice: "IP",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 6,
        outdoor_camera_count: 2,
        indoor_camera_count: 4,
        wiring_type: "conduit",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "standard",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "IP",
      camera_count: 6,
      picture_quality: "very_clear",
      recording_days: 15,
      recording_mode: "motion",
      outdoor_camera_count: 2,
      indoor_camera_count: 4,
      wiring_type: "conduit"
    },
    expected: { totalCams: 6, outdoor: 2, indoor: 4, wiring: "conduit", minChannels: 8 }
  },
  {
    name: "Customer H — High Installation (15ft+ High Ceiling)",
    lead: {
      customer_name: "Customer H (High Ceiling 15ft)",
      mobile_number: "9829000008",
      firebase_uid: "test_h_" + Date.now(),
      property_type: "factory",
      technology_choice: "HD",
      cabling_done: false,
      wizard_answers: {
        pincode: "302001",
        city: "Jaipur",
        state: "Rajasthan",
        camera_count: 8,
        outdoor_camera_count: 4,
        indoor_camera_count: 4,
        wiring_type: "conduit",
        power_socket_near_dvr: true,
        router_near_dvr: true,
        mounting_height: "very_high",
        ladder_arrangement: "team",
        q_recording_mode: "motion"
      }
    },
    quote: {
      plan_type: "recommended",
      technology: "HD",
      camera_count: 8,
      picture_quality: "good",
      recording_days: 15,
      recording_mode: "motion",
      outdoor_camera_count: 4,
      indoor_camera_count: 4,
      wiring_type: "conduit"
    },
    expected: { totalCams: 8, outdoor: 4, indoor: 4, wiring: "conduit", minChannels: 8 }
  }
];

async function runAdversarialSuite() {
  console.log("================================================================================");
  console.log("   ??? ADVERSARIAL BUSINESS INVARIANT REGRESSION SUITE (8 CUSTOMER PROFILES)");
  console.log("================================================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  for (let i = 0; i < ADVERSARIAL_CUSTOMERS.length; i++) {
    const cust = ADVERSARIAL_CUSTOMERS[i];
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`?? TEST [${i + 1}/8]: ${cust.name}`);
    console.log(`--------------------------------------------------------------------------------`);

    try {
      // 1. Submit Lead
      const leadRes = await fetch(`${BASE_URL}/api/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cust.lead)
      });
      const leadJson = await leadRes.json();
      if (!leadJson.success) throw new Error("Lead submission failed: " + JSON.stringify(leadJson));
      const leadId = leadJson.data.id;

      // 2. Generate Quote
      const quotePayload = {
        lead_id: leadId,
        status: "draft",
        selection: {
          lead_id: leadId,
          ...cust.quote
        }
      };

      const quoteRes = await fetch(`${BASE_URL}/api/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotePayload)
      });
      const quoteJson = await quoteRes.json();
      if (!quoteJson.success) throw new Error("Quote generation failed: " + JSON.stringify(quoteJson));
      const quoteId = quoteJson.data.id;

      // 3. Verify Invariants via direct Firestore inspection
      const qDoc = await db.collection("leads").doc(leadId).collection("quotes").doc(quoteId).get();
      const qData = qDoc.data();
      const items = qData.items || [];

      // Invariant 1: Total Camera Count matches sum of camera line items
      const cameraItems = items.filter(it => 
        it.display_name.toLowerCase().includes("bullet camera") || 
        it.display_name.toLowerCase().includes("dome camera")
      );
      const totalQuotedCameras = cameraItems.reduce((acc, it) => acc + it.qty, 0);
      if (totalQuotedCameras !== cust.expected.totalCams) {
        throw new Error(`INVARIANT VIOLATION: Expected ${cust.expected.totalCams} cameras, but BOQ has ${totalQuotedCameras}`);
      }

      // Invariant 2: Outdoor + Indoor Split matches
      const outdoorItem = cameraItems.find(it => it.display_name.toLowerCase().includes("outdoor") || it.display_name.toLowerCase().includes("bullet"));
      const indoorItem = cameraItems.find(it => it.display_name.toLowerCase().includes("indoor") || it.display_name.toLowerCase().includes("dome"));
      const actualOutdoor = outdoorItem ? outdoorItem.qty : 0;
      const actualIndoor = indoorItem ? indoorItem.qty : 0;
      if (actualOutdoor !== cust.expected.outdoor || actualIndoor !== cust.expected.indoor) {
        throw new Error(`INVARIANT VIOLATION: Expected ${cust.expected.outdoor} out / ${cust.expected.indoor} in, got ${actualOutdoor} out / ${actualIndoor} in`);
      }

      // Invariant 3: Junction Box Count matches camera count
      const jBoxItem = items.find(it => it.display_name.toLowerCase().includes("junction box"));
      if (!jBoxItem || jBoxItem.qty !== cust.expected.totalCams) {
        throw new Error(`INVARIANT VIOLATION: Expected ${cust.expected.totalCams} junction boxes, got ${jBoxItem ? jBoxItem.qty : 0}`);
      }

      // Invariant 4: Wiring Finish matches selection
      const cableItem = items.find(it => it.display_name.toLowerCase().includes("cable"));
      if (!cust.expected.cablingDone) {
        if (cust.expected.wiring === "conduit" && !cableItem.display_name.toLowerCase().includes("conduit")) {
          throw new Error(`INVARIANT VIOLATION: Conduit was selected but line item does not mention Conduit`);
        }
      }

      // Invariant 5: GST and Grand Total Arithmetic
      const subtotal = qData.gross_subtotal;
      const gst = qData.gst_amount;
      const total = qData.total_payable;
      const calculatedGst = Math.round(subtotal * 0.18);
      const calculatedTotal = subtotal + gst;

      if (Math.abs(gst - calculatedGst) > 1) {
        throw new Error(`INVARIANT VIOLATION: GST mismatch. Expected ${calculatedGst}, got ${gst}`);
      }
      if (Math.abs(total - calculatedTotal) > 1) {
        throw new Error(`INVARIANT VIOLATION: Grand total mismatch. Expected ${calculatedTotal}, got ${total}`);
      }

      console.log(`? Invariants Verified:`);
      console.log(`   - Total Cameras: ${totalQuotedCameras} (${actualOutdoor} Bullet + ${actualIndoor} Dome)`);
      console.log(`   - Junction Boxes: ${jBoxItem.qty} units`);
      console.log(`   - Wiring Line: ${cableItem ? cableItem.display_name : 'Pre-cabled (Zero Cable Charge)'}`);
      console.log(`   - Subtotal: Rs. ${subtotal} | GST (18%): Rs. ${gst} | Total: Rs. ${total}`);
      passedTests++;

    } catch (err) {
      console.error(`? FAILED: ${err.message}`);
      failedTests++;
    }
  }

  console.log(`\n================================================================================`);
  console.log(`?? ADVERSARIAL SUITE SUMMARY: ${passedTests} PASSED / ${failedTests} FAILED (Total: ${ADVERSARIAL_CUSTOMERS.length})`);
  console.log(`================================================================================\n`);
  
  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch(console.error);

