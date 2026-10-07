const fs = require('fs');

let code = fs.readFileSync('components/wizard/WizardClientV2.tsx', 'utf8');

const oldHandleVerify = `const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    
    setLoading(true);
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(code);
      }`;

const newHandleVerify = `const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    
    setLoading(true);
    try {
      if (otpMethod === "whatsapp") {
        const res = await fetch("/api/auth/otp/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: req.customer_mobile, otp: code }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Invalid OTP");
        await signInWithCustomToken(auth, data.customToken);
      } else {
        if (!confirmationResult) throw new Error("Please request OTP again.");
        await confirmationResult.confirm(code);
      }`;

code = code.replace(oldHandleVerify, newHandleVerify);

// Fix the resend button
code = code.replace(/<button\n\s*type="button"\n\s*disabled=\{countdown > 0 \|\| loading\}\n\s*onClick=\{handleFinishWizard\}/, 
`<button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={() => handleFinishWizard(otpMethod)}`);

fs.writeFileSync('components/wizard/WizardClientV2.tsx', code, 'utf8');
console.log("Replaced handleVerifyOtp and resend button");
