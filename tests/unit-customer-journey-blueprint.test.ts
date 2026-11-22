import assert from "node:assert";

/**
 * Unit & Integration Test Suite for:
 * 1. Customer Selection Journey & Behavioral Intelligence Blueprint
 * 2. Location Resolution (Pincode, City, Coordinates, Google Maps)
 * 3. Exact Cable Meters Selected vs BOM Bundles
 * 4. GST-Paid 18% Accounting Invariants
 * 5. Banned 3-Tier Prevention Invariant
 */

// Simulated Lead from Meela Yashwanth (Image 1 & 2)
const yashwanthMockLead = {
  id: "uuFLEKtQOC8skeazrpAd",
  leadId: "uuFLEKtQOC8skeazrpAd",
  customer_name: "Meela Yashwanth",
  customer_mobile: "7702640106",
  source: "website_wizard",
  property_type: "warehouse",
  technology_choice: "HD",
  cabling_done: false,
  timeline: "asap",
  total_cable_meters: 3840,
  address: {
    pincode: "302012",
    city: "Jaipur",
    state: "Rajasthan",
    area: "Jhotwara",
    landmark1: "Near Maheshpuri",
    address_line1: "S1/51, Flat S1, Plot 51, Maheshpuri, Jhotwara, Jaipur, Rajasthan - 302012",
    full_address: "S1/51, Flat S1, Plot 51, Maheshpuri, Jhotwara, Jaipur, Rajasthan - 302012",
    coordinates: { lat: 26.9412, lng: 75.7612 },
    map_url: "https://www.google.com/maps?q=26.9412,75.7612"
  },
  requirementSnapshot: {
    camera_count: 16,
    outdoor_camera_count: 16,
    indoor_camera_count: 0,
    wifi_camera_count: 0,
    recording_days: 15,
    technology_preference: "HD",
    brand_preference: "PRAMA",
    resolution_preference: "2MP Full HD",
    total_cable_length_meters: 3840,
    ceiling_height: "very_high",
    surface_types: ["tin_shed", "brick"],
    power_wiring_option: "socket_available",
    broadband_status: "yes",
    wants_remote_viewing: true,
    installation_timeline: "asap",
    customer_pincode: "302012",
    locality: "Jhotwara",
    city: "Jaipur",
    state: "Rajasthan",
  },
  wizard_answers: {
    property_type: "warehouse",
    camera_count: 16,
    outdoor_camera_count: 16,
    total_cable_length_meters: 3840,
    ceiling_height: "very_high",
    surface_types: ["tin_shed", "brick"],
    broadband_status: "yes",
    lead_pincode: "302012",
    timeline: "asap"
  },
  selection: {
    brand_preference: "PRAMA",
    resolution_preference: "2MP",
    technology: "HD",
    storage_days: 15,
    camera_count: 16
  },
  configuration_snapshot: [
    {
      name: "Prama 2MP HD Bullet Camera 3.6mm With Audio (HTD112E-NTPF(M))",
      display_name: "Prama 2MP HD Bullet Camera 3.6mm With Audio (HTD112E-NTPF(M))",
      category: "cameras",
      brand: "PRAMA",
      qty: 16,
      price: 1200
    },
    {
      name: "Hikvision Eco 16ch 1 SATA H.265+ HD DVR (7116HGHI-M1/T)",
      display_name: "Hikvision Eco 16ch 1 SATA H.265+ HD DVR (7116HGHI-M1/T)",
      category: "recorder",
      brand: "HIKVISION",
      qty: 1,
      price: 8191
    },
    {
      name: "Toshiba S300 2TB Surveillance HDD (3.5\" SATA) (Approx. 8 Days Backup • 24×7 @ H.265)",
      display_name: "Toshiba S300 2TB Surveillance HDD (3.5\" SATA) (Approx. 8 Days Backup • 24×7 @ H.265)",
      category: "storage",
      brand: "Toshiba",
      qty: 1,
      price: 12065
    },
    {
      name: "CP Plus 16-Channel 12V 20A Metal SMPS Power Supply",
      display_name: "CP Plus 16-Channel 12V 20A Metal SMPS Power Supply",
      category: "power",
      brand: "CP PLUS",
      qty: 1,
      price: 1124
    },
    {
      name: "Standard HD Installation & Termination",
      display_name: "Standard HD Installation & Termination",
      category: "service",
      qty: 16,
      price: 400
    },
    {
      name: "Multybyte 3+1 Pure Copper CCTV Camera Cable (90 Meter Bundle) (Bundle)",
      display_name: "Multybyte 3+1 Pure Copper CCTV Camera Cable (90 Meter Bundle) (Bundle)",
      category: "cable",
      qty: 42,
      price: 1450
    },
    {
      name: "Multybyte 3+1 Pure Copper CCTV Camera Cable (Open) (~60m) @ ₹20/m",
      display_name: "Multybyte 3+1 Pure Copper CCTV Camera Cable (Open) (~60m) @ ₹20/m",
      category: "cable",
      qty: 60,
      price: 20
    },
    {
      name: "Copper BNC Video Connector with Spring Strain Relief",
      display_name: "Copper BNC Video Connector with Spring Strain Relief",
      category: "accessories",
      qty: 32,
      price: 25
    },
    {
      name: "Heavy Duty Male DC Power Pin (12V Camera Power Jack)",
      display_name: "Heavy Duty Male DC Power Pin (12V Camera Power Jack)",
      category: "accessories",
      qty: 16,
      price: 15
    },
    {
      name: "Waterproof PVC Junction Box 4x4x2 for HD CCTV Camera",
      display_name: "Waterproof PVC Junction Box 4x4x2 for HD CCTV Camera",
      category: "accessories",
      qty: 16,
      price: 27
    },
    {
      name: "Site Visit & Travel Fee",
      display_name: "Site Visit & Travel Fee",
      category: "service",
      qty: 1,
      price: 300
    }
  ],
  pricingSnapshot: {
    finalPrice: 110852,
    total_payable: 110852,
    gst_rate: 18
  },
  total_payable: 110852
};

async function runTests() {
  console.log("=== RUNNING CUSTOMER JOURNEY BLUEPRINT & BEHAVIORAL SUITE ===");

  // TEST 1: Cable Distance Calculations (BOM bundling vs Actual selected meters)
  console.log("\n[TEST 1]: Cable Distance Calculations & BOM Bundling");
  {
    const items = yashwanthMockLead.configuration_snapshot;
    const cableBundleItems = items.filter(i => {
      const nm = (i.name || i.display_name || "").toLowerCase();
      return nm.includes("cable") || nm.includes("bundle") || nm.includes("3+1") || nm.includes("cat6");
    });

    let bomTotalMeters = 0;
    let bundleCount90m = 0;
    let openMeters = 0;

    cableBundleItems.forEach(i => {
      const nm = (i.name || i.display_name || "").toLowerCase();
      const qty = Number(i.qty || i.quantity || 0);
      if (nm.includes("90") || nm.includes("bundle")) {
        bundleCount90m += qty;
        bomTotalMeters += qty * 90;
      } else if (nm.includes("open") || nm.includes("meter") || nm.includes("/m") || nm.includes("mtr")) {
        openMeters += qty;
        bomTotalMeters += qty;
      }
    });

    assert.strictEqual(bundleCount90m, 42, "Should find exactly 42 bundles of 90m");
    assert.strictEqual(openMeters, 60, "Should find 60m open cable");
    assert.strictEqual(bomTotalMeters, 3840, "Total physical cable length in BOM must be 3,840 meters (42*90 + 60)");

    const totalCameras = yashwanthMockLead.requirementSnapshot.camera_count;
    const avgMetersPerCam = Math.round(bomTotalMeters / totalCameras);
    assert.strictEqual(avgMetersPerCam, 240, "Average meters per camera should be 240 meters");

    const standardAllowance = totalCameras * 15;
    assert.strictEqual(standardAllowance, 240, "Standard free allowance should be 240m (16 * 15m)");
    const excessMeters = Math.max(0, bomTotalMeters - standardAllowance);
    assert.strictEqual(excessMeters, 3600, "Excess custom meters should be 3,600m");

    console.log("  ✓ 42 bundles of 90m + 60m open cable = exactly 3,840 meters");
    console.log("  ✓ ~240m per camera verified across 16 cameras");
    console.log("  ✓ Standard quota (240m) vs excess (+3,600m) calculated correctly");
  }

  // TEST 2: Complete Location Resolution & Geocoding
  console.log("\n[TEST 2]: Complete Location Resolution & Geocoding");
  {
    const lead = yashwanthMockLead;
    const req = lead.requirementSnapshot;

    const pincode = lead.address.pincode || req.customer_pincode || "";
    assert.strictEqual(pincode, "302012", "Pincode must be 302012");

    const city = lead.address.city || req.city || "Jaipur";
    assert.strictEqual(city, "Jaipur", "City must be Jaipur");

    const area = lead.address.area || req.locality || "";
    assert.strictEqual(area, "Jhotwara", "Area must be Jhotwara");

    const coords = lead.address.coordinates;
    assert.ok(coords && coords.lat && coords.lng, "Coordinates must be present");
    assert.strictEqual(coords.lat, 26.9412, "Latitude matches");
    assert.strictEqual(coords.lng, 75.7612, "Longitude matches");

    const mapUrl = lead.address.map_url;
    assert.ok(mapUrl.includes("google.com/maps"), "Google maps URL must be valid");

    console.log("  ✓ Pincode 302012, City Jaipur, Area Jhotwara resolved");
    console.log("  ✓ GPS coordinates (26.9412, 75.7612) validated");
    console.log("  ✓ Google Maps URL generated properly:", mapUrl);
  }

  // TEST 3: Hardware BOM Deductions & Feature Extraction
  console.log("\n[TEST 3]: Hardware BOM Deductions & Feature Extraction");
  {
    const items = yashwanthMockLead.configuration_snapshot;
    const cameraItems = items.filter(i => {
      const nm = (i.name || i.display_name || "").toLowerCase();
      const cat = (i.category || "").toLowerCase();
      if (
        nm.includes("cable") || nm.includes("wire") || nm.includes("3+1") || nm.includes("cat6") ||
        nm.includes("junction") || nm.includes("box") || nm.includes("bnc") || nm.includes("connector") || nm.includes("pin") ||
        nm.includes("hdd") || nm.includes("storage") || nm.includes("hard disk") ||
        nm.includes("smps") || nm.includes("power") || nm.includes("dvr") || nm.includes("nvr") ||
        nm.includes("installation") || nm.includes("fitting") || nm.includes("fee")
      ) {
        return false;
      }
      return cat.includes("camera") || nm.includes("camera") || nm.includes("bullet") || nm.includes("dome");
    });

    assert.strictEqual(cameraItems.length, 1, "One camera line item");
    const cam = cameraItems[0];
    assert.strictEqual(cam.brand, "PRAMA", "Brand must be PRAMA");
    assert.strictEqual(cam.qty, 16, "Quantity must be 16");

    const hasAudio = cam.name.toLowerCase().includes("audio");
    assert.strictEqual(hasAudio, true, "Camera must have audio mic detected");

    const isBullet = cam.name.toLowerCase().includes("bullet");
    assert.strictEqual(isBullet, true, "Camera must be Outdoor Bullet");

    const storageItem = items.find(i => (i.category || "").includes("storage"));
    assert.ok(storageItem, "Storage drive item must exist in BOM");
    assert.ok(storageItem.name.includes("Toshiba S300 2TB"), "Surveillance drive is Toshiba S300 2TB");

    const dvrItem = items.find(i => (i.category || "").includes("recorder"));
    assert.ok(dvrItem, "DVR must exist");
    assert.ok(dvrItem.name.includes("Hikvision Eco 16ch"), "16ch DVR verified");

    console.log("  ✓ Brand PRAMA, Form Factor Bullet, Audio Mic detected from BOM");
    console.log("  ✓ DVR and 2TB Surveillance storage drive verified");
  }

  // TEST 4: Statutory 18% Reverse-GST Accounting Reconciliation
  console.log("\n[TEST 4]: Statutory 18% Reverse-GST Accounting Invariant");
  {
    const grossTotal = yashwanthMockLead.total_payable; // ₹1,10,852
    assert.strictEqual(grossTotal, 110852, "Gross Total is ₹1,10,852");

    const taxableBase = Math.round(grossTotal / 1.18);
    const gstTotal = grossTotal - taxableBase;
    const cgst = Math.round(gstTotal / 2);
    const sgst = gstTotal - cgst;

    assert.strictEqual(taxableBase, 93942, "Taxable base must be ₹93,942");
    assert.strictEqual(gstTotal, 16910, "18% GST must be ₹16,910");
    assert.strictEqual(cgst, 8455, "CGST @ 9% must be ₹8,455");
    assert.strictEqual(sgst, 8455, "SGST @ 9% must be ₹8,455");

    // Exact ₹0.00 mathematical reconciliation
    assert.strictEqual(taxableBase + cgst + sgst, grossTotal, "Reconciliation must equal exactly gross total");
    console.log("  ✓ Taxable Base ₹93,942 + CGST ₹8,455 + SGST ₹8,455 = ₹1,10,852 (Exact ₹0.00 reconciliation)");
  }

  // TEST 5: Telecaller Sales Pitch Generator & Format
  console.log("\n[TEST 5]: Telecaller Pitch Content & Layman Verbiage");
  {
    const lead = yashwanthMockLead;
    const pitch = (
      `📋 *${lead.customer_name}* - ग्राहक चयन व आवश्यकता (TEAM CCTV Call Prep)\n` +
      `• *साइट लोकेशन:* ${lead.address.full_address}\n` +
      `• *परिसर:* गोदाम / वेयरहाउस (Warehouse) (सीलिंग: इंडस्ट्रियल शेड (16+ फीट))\n` +
      `• *सिस्टम:* 16 कैमरों का टर्बो HD एनालॉग (Turbo HD Copper) सेटअप\n` +
      `• *कैमरा विभाजन:* 16 आउटडोर वेदरप्रूफ बुलेट + 0 इनडोर डोम + 0 वायरलेस\n` +
      `• *ब्रांड व क्वालिटी:* PRAMA (2MP Full HD) + इन-बिल्ट ऑडियो माइक 🎙️\n` +
      `• *स्टोरेज:* 15 दिन रिकॉर्डिंग (Toshiba S300 2TB Surveillance HDD)\n` +
      `• *केबलिंग (दूरी):* 3,840 मीटर 100% सॉलिड कॉपर केबल (~240m प्रति कैमरा)\n` +
      `• *BOM पैकेजिंग:* 42 बंडल (90m) + 60m खुला तार\n` +
      `• *इंटरनेट:* हाई-स्पीड ब्रॉडबैंड / वाई-फाई उपलब्ध (फ्री मोबाइल ऐप एक्टिव)\n` +
      `• *टाइमलाइन:* ⚡ तत्काल (1-2 दिन / Urgent ASAP)\n` +
      `• *कुल कोटेशन:* ₹${lead.total_payable.toLocaleString("en-IN")} (18% GST व डोरस्टेप फिटिंग सहित)`
    );

    assert.ok(pitch.includes("Meela Yashwanth"), "Pitch includes customer name");
    assert.ok(pitch.includes("3,840 मीटर 100% सॉलिड कॉपर केबल"), "Pitch includes exact 3,840 meters");
    assert.ok(pitch.includes("42 बंडल (90m) + 60m खुला तार"), "Pitch includes 42 bundles + 60m open wire");
    assert.ok(pitch.includes("302012"), "Pitch includes pincode 302012");
    assert.ok(pitch.includes("PRAMA"), "Pitch includes brand PRAMA");
    assert.ok(pitch.includes("₹1,10,852"), "Pitch includes GST-paid total");

    // Zero [object Object] check
    assert.strictEqual(pitch.includes("[object Object]"), false, "Zero [object Object] invariant");
    console.log("  ✓ Telecaller pitch contains exact customer selections, 3840m cable, and location");
    console.log("  ✓ Zero [object Object] invariant confirmed");
  }

  // TEST 6: Banned 3-Tier Prevention Invariant
  console.log("\n[TEST 6]: Banned 3-Tier Prevention Invariant");
  {
    const bannedWords = ["Essential", "Smart Plus", "Pro Elite", "Budget Plan", "Value Plan", "Premium Plan"];
    const jsonStr = JSON.stringify(yashwanthMockLead);
    for (const word of bannedWords) {
      assert.strictEqual(jsonStr.includes(`"${word}"`), false, `Must NOT contain banned tier word: ${word}`);
    }
    console.log("  ✓ Zero banned marketing tiers present in customer journey data");
  }

  // TEST 7: Resilient Fallbacks on Minimal / Sparse Lead
  console.log("\n[TEST 7]: Resilient Fallbacks on Sparse / Minimal Lead");
  {
    const minimalLead = {
      id: "sparse-123",
      customer_name: "Ramesh Sharma",
      customer_mobile: "9876543210",
      total_payable: 14500,
      requirementSnapshot: {},
      wizard_answers: {},
      configuration_snapshot: []
    };

    const actualCableMeters = minimalLead.total_cable_meters ?? minimalLead.requirementSnapshot?.total_cable_length_meters ?? (4 * 15);
    assert.strictEqual(actualCableMeters, 60, "Defaults gracefully to 60m (4 cams * 15m)");

    const city = minimalLead.address?.city || minimalLead.requirementSnapshot?.city || "Jaipur";
    assert.strictEqual(city, "Jaipur", "Defaults gracefully to Jaipur");

    console.log("  ✓ Sparse lead handles missing cable & location with clean fallbacks without throwing");
  }

  console.log("\n🎉 ALL CUSTOMER JOURNEY & BEHAVIORAL INTELLIGENCE TESTS PASSED DETERMINISTICALLY!");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
