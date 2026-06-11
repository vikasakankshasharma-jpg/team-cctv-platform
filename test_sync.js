const fetch = require('node-fetch');

async function testSync() {
  const payload = {
    products: [
      {
        title: "Test Camera 5MP Bullet",
        baseCost: 1500,
        imgUrl: "https://example.com/test.jpg",
        inStock: true,
        vendorProductId: "TEST-001"
      }
    ],
    vendorId: "VND-TEST",
    vendorPrefix: "TST",
    syncMode: "all"
  };

  try {
    console.log("Sending test sync request...");
    const res = await fetch("http://localhost:3000/api/admin/vendor/sync-json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testSync();
