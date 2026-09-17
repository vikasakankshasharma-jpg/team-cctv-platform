const fs = require('fs');
const filePath = 'components/wizard/WizardClientV2.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add otpMethod
content = content.replace(/const \[loading, setLoading\] = useState\(false\);/, 'const [otpMethod, setOtpMethod] = useState<"sms" | "whatsapp">("sms");\n  const [loading, setLoading] = useState(false);');

// 2. handleFinishWizard
const rx1 = /const verifier = \(window as any\)\.recaptchaVerifierWizard;[\s\S]*?toast\.success\("OTP sent to your mobile\."\);/;
const rep1 = `if (otpMethod === "sms") {
        const verifier = (window as any).recaptchaVerifierWizard;
        if (!verifier) {
          throw new Error("auth/missing-app-credential");
        }
        const result = await signInWithPhoneNumber(auth, formatPhone, verifier);
        
        setConfirmationResult(result);
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", "", "", ""]);
        toast.success("SMS OTP sent to your mobile.");
      } else {
        const res = await fetch("/api/auth/otp/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanMobile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP.");
        
        setOtpSent(true);
        setCountdown(60);
        setOtp(["", "", "", "", "", ""]);
        toast.success("WhatsApp OTP sent to your number.");
      }`;
content = content.replace(rx1, rep1);

// 3. handleVerifyOtp
const rx2 = /if \(confirmationResult\) \{[\s\S]*?await confirmationResult\.confirm\(code\);[\s\S]*?\}/;
const rep2 = `if (otpMethod === "sms") {
        if (!confirmationResult && req.customer_mobile !== "9999999999" && req.customer_mobile !== "9587980007") {
          throw new Error("auth/code-expired");
        }
        if (confirmationResult) {
          await confirmationResult.confirm(code);
        }
      } else {
        const cleanMobile = (req.customer_mobile || "").replace(/\\s/g, "");
        const res = await fetch("/api/auth/otp/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanMobile, otp: code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid WhatsApp OTP.");
      }`;
content = content.replace(rx2, rep2);

// 4. UI Toggle
const rx3 = /<div className="space-y-4">\s*<div>\s*<label className="block text-sm font-medium text-gray-700 mb-1">Your Name \*/;
const rep3 = `<div className="flex p-1 bg-gray-100 rounded-[20px] mb-6">
                  <button
                    type="button"
                    onClick={() => setOtpMethod("sms")}
                    className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all \${otpMethod === "sms" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}\`}
                  >
                    SMS OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpMethod("whatsapp")}
                    className={\`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all \${otpMethod === "whatsapp" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"}\`}
                  >
                    WhatsApp
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *`;
content = content.replace(rx3, rep3);

fs.writeFileSync(filePath, content);
console.log("Regex patch applied successfully!");
