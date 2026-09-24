const fs = require('fs');

// 1. Update send-otp
const sendOtpPath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\auth\\send-otp\\route.ts';
if (fs.existsSync(sendOtpPath)) {
  let code = fs.readFileSync(sendOtpPath, 'utf8');
  if (!code.includes('9999999999')) {
    const bypass = `
    // DAY-0 TEST BYPASS
    if (phone === "9999999999") {
      return NextResponse.json({ success: true, message: "Test OTP is 123456" });
    }
    `;
    // Insert after "const { phone } = await req.json();"
    code = code.replace(/const \{ phone \} = await req\.json\(\);/, 'const { phone } = await req.json();\n' + bypass);
    fs.writeFileSync(sendOtpPath, code);
  }
}

// 2. Update verify-otp
const verifyOtpPath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\auth\\verify-otp\\route.ts';
if (fs.existsSync(verifyOtpPath)) {
  let code = fs.readFileSync(verifyOtpPath, 'utf8');
  if (!code.includes('9999999999')) {
    const bypass = `
    // DAY-0 TEST BYPASS
    if (phone === "9999999999" && otp === "123456") {
      // Find or create the test user
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByPhoneNumber("+919999999999");
      } catch (e) {
        userRecord = await adminAuth.createUser({ phoneNumber: "+919999999999" });
      }
      const customToken = await adminAuth.createCustomToken(userRecord.uid);
      return NextResponse.json({ success: true, customToken });
    }
    `;
    // Insert after "const { phone, otp } = await req.json();"
    code = code.replace(/const \{ phone, otp \} = await req\.json\(\);/, 'const { phone, otp } = await req.json();\n' + bypass);
    fs.writeFileSync(verifyOtpPath, code);
  }
}

console.log("OTP Bypass Injected successfully.");
