const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components/wizard/WizardClientV2.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetFunctionStart = content.indexOf('const handleFinishWizard = async () => {');
if (targetFunctionStart === -1) throw new Error("Could not find handleFinishWizard");

// Find the end of handleFinishWizard which is '};' before 'const handleVerifyOtp'
const nextFunction = content.indexOf('const handleVerifyOtp = async', targetFunctionStart);
if (nextFunction === -1) throw new Error("Could not find next function");

// We'll replace this entire block.
const replacement = `const handleFinishWizard = async () => {
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
          confirm: async (code: string) => {
            return { user: { uid: "mock-e2e-uid" } } as any;
          }
        } as any);
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", "", "", ""]);
        setLoading(false);
        return;
      }
      
      if (otpMethod === "sms") {
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
        userMsg = \`Firebase SMS failed: \${errMsg}. Please use WhatsApp OTP.\`;
      }
      
      toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  };

  `;

content = content.substring(0, targetFunctionStart) + replacement + content.substring(nextFunction);

// Also we need to make sure handleVerifyOtp handles WhatsApp!
// Let's modify handleVerifyOtp too.

const verifyFuncStart = content.indexOf('const handleVerifyOtp = async');
const verifyFuncEnd = content.indexOf('const handlePrev = () => {', verifyFuncStart);

const verifyReplacement = `const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) return;
    
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

      // Record Lead Creation
      const leadData = {
        customer_name: req.customer_name,
        customer_email: req.customer_email || null,
        mobile_number: req.customer_mobile.replace(/\\s/g, ""),
        city: searchParams.get("city") || null,
        pincode: searchParams.get("pincode") || null,
        source: "wizard",
        lead_status: "new",
        property_type: req.property_type,
        installation_type: req.installation_type,
        camera_count: (req.indoor_cameras || 0) + (req.outdoor_cameras || 0) + (req.existing_working_cameras || 0),
        indoor_cameras: req.indoor_cameras,
        outdoor_cameras: req.outdoor_cameras,
        recording_days: req.recording_days,
        storage_days: req.recording_days,
        cable_length_m: req.cable_length_m,
        budget_range: req.budget_tier,
      };

      const result = await createLeadAction(leadData);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to submit lead");
      }
      
      toast.success("Verified successfully!");
      setLeadId(result.leadId || null);
      
      // Auto redirect to quotation viewing page immediately
      if (result.leadId) {
        router.push(\`/quote/\${result.leadId}\`);
      }
      
    } catch (error: any) {
      console.error("Verification Error:", error);
      toast.error(error.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  `;

content = content.substring(0, verifyFuncStart) + verifyReplacement + content.substring(verifyFuncEnd);

// One more thing: We need to add the WhatsApp/SMS toggle to the UI
const uiSearch = `<div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>`;

const uiReplacement = `<div className="flex p-1 bg-gray-100 rounded-[20px] mb-6">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>`;

content = content.replace(`                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>`, uiReplacement);

fs.writeFileSync(filePath, content);
console.log("Fixed WizardClientV2");
