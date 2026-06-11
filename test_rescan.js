const fetch = require('node-fetch');

async function testRescan() {
  const payload = {
    raw_title: "Test Camera 5MP Bullet",
    image_url: "",
    action: "internal_match"
  };

  try {
    console.log("Sending test rescan internal_match request...");
    const res = await fetch("http://localhost:3000/api/admin/vendor/rescan", {
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

testRescan();
