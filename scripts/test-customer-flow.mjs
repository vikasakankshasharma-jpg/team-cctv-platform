import fetch from "node-fetch";

async function testCustomerFlow() {
  console.log("🚀 Starting Customer Auth & Dashboard Flow Test...");
  const baseUrl = "http://localhost:3000";
  const testMobile = "9876543210";

  // 1. Request OTP
  console.log("\n1️⃣ Requesting OTP for", testMobile);
  const otpRes = await fetch(`${baseUrl}/api/customer/auth/otp/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile }),
  });

  const otpData = await otpRes.json();
  console.log("OTP Response Status:", otpRes.status);
  console.log("OTP Response Body:", otpData);

  if (!otpRes.ok) {
    throw new Error(`OTP request failed: ${JSON.stringify(otpData)}`);
  }

  const otp = otpData.devOtp;
  if (!otp) {
    console.log("⚠️ devOtp not returned (production mode). Check logs for OTP.");
    return;
  }

  // 2. Verify OTP
  console.log("\n2️⃣ Verifying OTP:", otp);
  const verifyRes = await fetch(`${baseUrl}/api/customer/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile: testMobile, otp }),
  });

  const verifyData = await verifyRes.json();
  console.log("Verify Response Status:", verifyRes.status);
  console.log("Verify Response Body:", verifyData);

  if (!verifyRes.ok) {
    throw new Error(`Verify failed: ${JSON.stringify(verifyData)}`);
  }

  // Extract cookies
  const rawCookies = verifyRes.headers.raw()["set-cookie"];
  console.log("Set-Cookie headers:", rawCookies);

  console.log("\n✅ Customer Auth Flow Successfully Validated!");
}

testCustomerFlow().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
