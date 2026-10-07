const fs = require('fs');

let code = fs.readFileSync('components/wizard/WizardClientV2.tsx', 'utf8');

const oldHandleFinish = `const handleFinishWizard = async () => {
    if (!req.customer_mobile || req.customer_mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    try {
      const cleanMobile = req.customer_mobile.replace(/\\s/g, "");
      const formatPhone = "+91" + cleanMobile;

      if (cleanMobile === "9999999999") {
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
      }`;

const newHandleFinish = `const handleFinishWizard = async (method: "sms" | "whatsapp" = "sms") => {
    if (!req.customer_mobile || req.customer_mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    try {
      const cleanMobile = req.customer_mobile.replace(/\\s/g, "");
      const formatPhone = "+91" + cleanMobile;

      if (cleanMobile === "9999999999") {
        setOtpMethod("sms");
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
      
      if (method === "whatsapp") {
        setOtpMethod("whatsapp");
        const res = await fetch("/api/auth/otp/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: formatPhone }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed to send WhatsApp OTP");
        
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", "", "", ""]);
        toast.success("WhatsApp OTP sent!");
        setLoading(false);
        return;
      } else {
        setOtpMethod("sms");
      }`;

code = code.replace(oldHandleFinish, newHandleFinish);
fs.writeFileSync('components/wizard/WizardClientV2.tsx', code, 'utf8');
console.log("Replaced handleFinishWizard");
