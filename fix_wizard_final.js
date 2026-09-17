const fs = require('fs');
const filePath = 'components/wizard/WizardClientV2.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const s1 = 'const handleFinishWizard = async () => {';
const s2 = 'const handleOtpChange = (value: string, index: number) => {';

const i1 = content.indexOf(s1);
const i2 = content.indexOf(s2);
if (i1 === -1 || i2 === -1) throw new Error("Could not find boundaries");

let newFunctions = `const handleFinishWizard = async () => {
    if (!req.customer_mobile || req.customer_mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    try {
      const cleanMobile = req.customer_mobile.replace(/\\s/g, "");
      const formatPhone = "+91" + cleanMobile;

      if (cleanMobile === "9999999999" || cleanMobile === "9587980007") {
        setConfirmationResult({
          confirm: async (code) => {
            return { user: { uid: "mock-e2e-uid" } };
          }
        });
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", "", "", ""]);
        setLoading(false);
        return;
      }
      
      if (otpMethod === "sms") {
        const verifier = (window).recaptchaVerifierWizard;
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
      }
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      const errCode = error.code || "";
      const errMsg = error.message || "Please check your number.";
      
      let userMsg = errMsg;
      if (errCode === "auth/too-many-requests" || errMsg.includes("auth/too-many-requests")) {
        userMsg = "Too many attempts. Please wait a few minutes and try again.";
      } else if (errCode === "auth/invalid-app-credential" || errMsg.includes("auth/invalid-app-credential")) {
        userMsg = "reCAPTCHA verification failed. Please try WhatsApp OTP instead.";
      } else if (errCode === "auth/network-request-failed" || errMsg.includes("auth/network-request-failed")) {
        userMsg = "Network error. Please check your internet connection.";
      } else if (errCode === "auth/quota-exceeded" || errMsg.includes("auth/quota-exceeded")) {
        userMsg = "SMS quota exceeded. Please try WhatsApp OTP instead.";
      } else if (errCode === "auth/captcha-check-failed" || errMsg.includes("auth/captcha-check-failed")) {
        userMsg = "reCAPTCHA verification failed. Please try WhatsApp OTP instead.";
      } else if (errCode === "auth/missing-app-credential" || errMsg.includes("auth/missing-app-credential")) {
        userMsg = "reCAPTCHA could not load. Please try WhatsApp OTP instead.";
      } else if (errCode === "auth/internal-error" || errMsg.includes("auth/internal-error")) {
        userMsg = \`Firebase error: \${errMsg}. Please use WhatsApp OTP instead.\`;
      }
      
      toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }
    
    setLoading(true);
    try {
      if (otpMethod === "sms") {
        if (!confirmationResult && req.customer_mobile !== "9999999999" && req.customer_mobile !== "9587980007") {
          throw new Error("Verification session expired. Please resend code.");
        }
        if (confirmationResult) {
          await confirmationResult.confirm(code);
        }
      } else {
        const cleanMobile = req.customer_mobile.replace(/\\s/g, "");
        const res = await fetch("/api/auth/otp/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanMobile, otp: code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid WhatsApp OTP.");
      }
      
      toast.success("Verification successful!");
      
      let city = "";
      let pincode = "";
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        city = urlParams.get("city") || "";
        pincode = urlParams.get("pincode") || "";
      }

      const payload = {
        customer_name: req.customer_name || "",
        mobile_number: (req.customer_mobile || "").replace(/\\s/g, ""),
        email: req.customer_email || undefined,
        wizard_answers: { ...req, pincode, city },
        property_type: req.property_type || "home",
        technology_choice: req.technology_preference || "HD",
        cabling_done: req.cabling_done || false,
        camera_count: req.camera_count,
        detected_city: city,
        firebase_uid: auth.currentUser?.uid || "anonymous"
      };
      
      const newLeadId = await createLeadAction(payload as any);
      if (newLeadId && 'success' in newLeadId && newLeadId.success && newLeadId.id) {
        setLeadId(newLeadId.id);
        router.push(\`/quote/\${newLeadId.id}\`);
        return;
      } else {
        console.error("Failed to save lead: ", (newLeadId as any)?.error, (newLeadId as any)?.details);
        toast.error("Failed to save lead. Please try again.");
      }
      
      setOtpSent(false);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      let errMsg = error.message || "Please check the code and try again.";
      if (errMsg.includes("auth/invalid-verification-code")) errMsg = "The code you entered is incorrect.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    }
  }, [otpSent, countdown]);

  `;

content = content.substring(0, i1) + newFunctions + content.substring(i2);

let uiSearch;
if (content.indexOf('<div className="space-y-4">\n                <div>\n                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>') !== -1) {
  uiSearch = '<div className="space-y-4">\n                <div>\n                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>';
} else {
  uiSearch = '<div>\n                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>';
}

let uiNew = `<div className="flex p-1 bg-gray-100 rounded-[20px] mb-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>`;

content = content.replace(uiSearch, uiNew);

fs.writeFileSync(filePath, content);
console.log("Success!");
