export async function sendSmsOtp(mobile: string, otp: string): Promise<boolean> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey || apiKey === "FAST2SMS_API_KEY=placeholder" || apiKey.includes("placeholder")) {
    console.warn(`[SMS Provider] FAST2SMS_API_KEY missing or placeholder. Skipping real SMS for ${mobile}. OTP is: ${otp}`);
    return false;
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "otp",
        variables_values: otp,
        numbers: mobile
      })
    });

    const data = await response.json();
    if (data.return) {
      console.log(`✅ [SMS Provider] OTP sent successfully to ${mobile}`);
      return true;
    } else {
      console.error(`❌ [SMS Provider] Failed to send OTP:`, data);
      return false;
    }
  } catch (error) {
    console.error(`❌ [SMS Provider] Error calling Fast2SMS:`, error);
    return false;
  }
}
