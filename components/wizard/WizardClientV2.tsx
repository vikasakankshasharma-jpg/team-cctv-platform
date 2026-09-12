"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CCTVRequirement } from "@/types";
import { QuoteComparison } from "@/components/QuoteComparison";
import { CameraCustomizer } from "@/components/CameraCustomizer";
import { EditConfigurationDrawer } from "@/components/EditConfigurationDrawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithCustomToken, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createLeadAction } from "@/app/actions/lead";
import { ShieldCheck, Loader2, Sparkles, Wrench } from "lucide-react";



export function WizardClientV2() {
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"sms" | "whatsapp">("sms");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(0);

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first OTP input when OTP screen opens
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [otpSent]);

  // WebOTP API auto-fill support for mobile browsers
  useEffect(() => {
    if (!otpSent) return;
    if (typeof window !== "undefined" && "OTPCredential" in window) {
      const ac = new AbortController();
      (navigator.credentials as any)
        ?.get({
          otp: { transport: ["sms"] },
          signal: ac.signal,
        })
        .then((otpCred: any) => {
          if (otpCred && otpCred.code) {
            const digits = otpCred.code.replace(/\D/g, "").slice(0, 6).split("");
            if (digits.length === 6) {
              setOtp(digits);
              inputRefs.current[5]?.focus();
            }
          }
        })
        .catch(() => {});
      return () => ac.abort();
    }
  }, [otpSent]);

  const handleOtpChange = (value: string, index: number) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length > 1) {
      const digits = clean.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (digits.length === 6) {
        handleVerifyOtp(digits.join(""));
      }
      return;
    }

    if (value && isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = clean;
    setOtp(newOtp);

    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (newOtp.join("").length === 6) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && otp.join("").length === 6) {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split("");
    const newOtp = ["", "", "", "", "", ""];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (digits.length === 6) {
      handleVerifyOtp(digits.join(""));
    }
  };
    
  useEffect(() => {
    // Send session start
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        source: "wizard",
        eventType: "SESSION_START",
        step: 1
      })
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (step > 1) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          source: "wizard",
          eventType: "STEP_VIEWED",
          step
        })
      }).catch(console.error);
    }
  }, [step, sessionId]);

  const [req, setReq] = useState<Partial<CCTVRequirement>>({
    installation_type: "new",
    camera_count: 4,
    indoor_camera_count: 2,
    outdoor_camera_count: 2,
    recording_days: 7,
    recording_mode: "motion",
    technology_preference: "IP",
    wants_remote_viewing: true,
    cabling_done: false
  });
  
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const totalSteps = req.installation_type === "addon" ? 6 : 5;
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [customizerPlanId, setCustomizerPlanId] = useState<string | null>(null);

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => Math.min(s + 1, 5));
  };
  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step === 5 && otpSent) {
      setOtpSent(false);
      setOtp(["", "", "", "", "", ""]);
      return;
    }
    setStep(s => Math.max(s - 1, 1));
  };

  const generateQuote = async (finalReq: CCTVRequirement) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalReq)
      });
      
      const text = await res.text();
      console.log("API RESPONSE TEXT:", text.substring(0, 500));
      try {
        const data = JSON.parse(text);
        if (data.success) {
          setQuoteResult(data);
        } else {
          console.error("API error success:false", data);
          toast.error("Error generating quote");
        }
      } catch (err) {
        console.error("Failed to parse JSON. Response text was:", text.substring(0, 500));
        toast.error("Error generating quote");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error generating quote");
    }
    setLoading(false);
  };

  const handleFinishWizard = async () => {
    if (!req.customer_mobile || req.customer_mobile.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setLoading(true);
    try {
      const cleanMobile = req.customer_mobile.replace(/\s/g, "");
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
      }
      
      
        if ((window as any).recaptchaVerifierWizard) {
          try {
            (window as any).recaptchaVerifierWizard.clear();
          } catch (e) {}
          (window as any).recaptchaVerifierWizard = null;
        }
        
        const oldContainer = document.getElementById("recaptcha-container-wizard");
        if (oldContainer) {
          oldContainer.remove();
        }

        const recaptchaContainer = document.createElement("div");
        recaptchaContainer.id = "recaptcha-container-wizard";
        document.body.appendChild(recaptchaContainer);
        
        const verifier = new RecaptchaVerifier(auth, "recaptcha-container-wizard", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            toast.error("reCAPTCHA expired. Please try again.");
          },
        });
        (window as any).recaptchaVerifierWizard = verifier;
    

      // Explicitly render reCAPTCHA widget first to catch load errors early
      await verifier.render();
      
      const result = await signInWithPhoneNumber(auth, formatPhone, verifier);
      
      setConfirmationResult(result);
      setOtpSent(true);
      setCountdown(30);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP sent to your mobile.");
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      const errCode = error.code || "";
      const errMsg = error.message || "Please check your number.";
      
      let userMsg = errMsg;
      if (errCode === "auth/too-many-requests" || errMsg.includes("auth/too-many-requests")) {
        userMsg = "Too many attempts. Please wait a few minutes and try again.";
      } else if (errCode === "auth/invalid-app-credential" || errMsg.includes("auth/invalid-app-credential")) {
        userMsg = "reCAPTCHA verification failed. Please refresh the page and try again.";
      } else if (errCode === "auth/network-request-failed" || errMsg.includes("auth/network-request-failed")) {
        userMsg = "Network error. Please check your internet connection.";
      } else if (errCode === "auth/quota-exceeded" || errMsg.includes("auth/quota-exceeded")) {
        userMsg = "SMS quota exceeded. Please try again later.";
      } else if (errCode === "auth/captcha-check-failed" || errMsg.includes("auth/captcha-check-failed")) {
        userMsg = "reCAPTCHA verification failed. Please refresh the page and try again.";
      } else if (errCode === "auth/missing-app-credential" || errMsg.includes("auth/missing-app-credential")) {
        userMsg = "reCAPTCHA could not load. Please disable ad blockers and refresh.";
      } else if (errCode === "auth/internal-error" || errMsg.includes("auth/internal-error")) {
        userMsg = "Firebase service error. Please try again in a moment.";
      }
      
      toast.error("Failed to send OTP. " + userMsg);
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
      if (confirmationResult) {
        await confirmationResult.confirm(code);
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
        mobile_number: (req.customer_mobile || "").replace(/\s/g, ""),
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
        router.push(`/quote/${newLeadId.id}`);
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
      else if (errMsg.includes("auth/code-expired")) errMsg = "The code has expired. Please resend.";
      else if (errMsg.includes("auth/too-many-requests")) errMsg = "Too many attempts. Please try again later.";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };



  const handleUpdateQuote = (newReq: CCTVRequirement) => {
    setReq(newReq);
    generateQuote(newReq);
    setIsEditDrawerOpen(false);
  };

  const updateReq = (updates: Partial<CCTVRequirement>) => {
    setReq(prev => ({ ...prev, ...updates }));
  };

  
  const handleSelectBasePlan = (planId: string) => {
    setCustomizerPlanId(planId);
  };

  const handleConfirmCustomizer = async (planType: string, modifiedPricingSnapshot?: any, updatedRequirement?: CCTVRequirement) => {
    const mobile = quoteResult.requirement.customer_mobile;
    const name = quoteResult.requirement.customer_name;
    
    if (!mobile) {
      toast.error("Mobile number is required.");
      return;
    }
    
    setLoading(true);
    try {
      const pricingToSave = modifiedPricingSnapshot || quoteResult.plans[planType];
      const reqToSave = updatedRequirement || quoteResult.requirement;
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId,
          customer_mobile: mobile,
          customer_name: name,
          requirementSnapshot: reqToSave,
          configurationSnapshot: quoteResult.configuration,
          pricingSnapshot: pricingToSave,
          selectedPlan: planType
        })
      });
      const data = await res.json();
      if (data.success) {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            source: "wizard",
            eventType: "QUOTE_GENERATED",
            metadata: { quoteId: data.quoteId }
          })
        }).catch(console.error);

        // Redirect to unified rich quotation and comparison experience
        const targetId = data.leadId || data.quoteId;
        router.push(`/quote/${targetId}`);
        return;
      } else {
        toast.error(data.message || "Failed to save quote.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };







    if (customizerPlanId && quoteResult) {
    return (
      <CameraCustomizer
        basePlanId={customizerPlanId}
        basePlan={quoteResult.plans[customizerPlanId]}
        requirement={quoteResult.requirement}
        availableAddons={quoteResult.addons || []}
        storageDrives={quoteResult.storageDrives || []}
        onBack={() => setCustomizerPlanId(null)}
        onConfirm={(modifiedPlan, updatedReq) => handleConfirmCustomizer(customizerPlanId, modifiedPlan, updatedReq)}
        isSaving={loading}
      />
    );
  }

  if (quoteResult) {

    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Your CCTV Options</h1>
          <p className="text-gray-600">Select the plan that best fits your needs, or edit the configuration to instantly update pricing.</p>
        </div>
        
        <QuoteComparison 
            plans={quoteResult.plans}
            requirement={quoteResult.requirement}
            onSelectPlan={handleSelectBasePlan}
          onEditConfiguration={() => setIsEditDrawerOpen(true)}
        />

        <EditConfigurationDrawer 
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          currentRequirement={quoteResult.requirement}
          onUpdate={handleUpdateQuote}
          isUpdating={loading}
        />
      </div>
    );
  }


  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2 text-center text-slate-900">How would you like to build your quote?</h2>
            <p className="text-center text-slate-500 mb-8 max-w-lg mx-auto">Choose between our easy guided setup or our advanced professional builder for custom configurations.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setStep(1)}
                className="p-8 rounded-2xl border-2 text-left hover:border-blue-500 transition-all group bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-blue-900 group-hover:text-blue-700 mb-2"><Sparkles className="w-5 h-5 mr-1.5 inline-block" /> Guided Setup (Recommended)</span>
                <span className="block text-sm text-blue-800 font-medium leading-relaxed">Answer a few simple questions about your property, and our AI will calculate the perfect, most compatible CCTV package for you instantly.</span>
              </button>
              
              <button onClick={() => window.location.href = '/pro-builder'}
                className="p-8 rounded-2xl border-2 text-left hover:border-zinc-900 transition-all group bg-white border-zinc-200 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-zinc-900 group-hover:text-black mb-2"><Wrench className="w-5 h-5 mr-1.5 inline-block" /> Custom Build (Advanced)</span>
                <span className="block text-sm text-zinc-500 font-medium leading-relaxed">I already know exactly what cameras and technical specifications I need. Let me build my own custom package from the catalog.</span>
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">What kind of installation do you need?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { updateReq({ installation_type: "new", property_type: "home" }); handleNext(); }}
                className={`p-6 rounded-xl border-2 text-left hover:border-blue-500 transition-all group ${req.installation_type === "new" ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">Completely New System</span>
                <span className="block text-sm text-gray-500 mt-1">I don't have any CCTV cameras installed right now.</span>
              </button>
              <button onClick={() => { updateReq({ installation_type: "addon", existing_system_known: undefined }); }}
                className={`p-6 rounded-xl border-2 text-left hover:border-blue-500 transition-all group ${req.installation_type === "addon" ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">Add to Existing System</span>
                <span className="block text-sm text-gray-500 mt-1">I already have a CCTV system and want to add more cameras.</span>
              </button>
            </div>
            
            {req.installation_type === "addon" && (
              <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200 animate-in fade-in">
                <h3 className="font-semibold text-lg text-yellow-900 mb-4">Do you know the technical specifications of your existing system?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => handleNext()}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">Yes, I know</span>
                    <span className="block text-xs text-gray-500 mt-1">I know my DVR channels and technology.</span>
                  </button>
                  <button onClick={() => updateReq({ existing_system_known: false })}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">No, I don't know</span>
                    <span className="block text-xs text-gray-500 mt-1">Help me check compatibility.</span>
                  </button>
                </div>
              </div>
            )}
            
            {req.installation_type === "addon" && req.existing_system_known === false && (
              <div className="mt-6 p-6 border rounded-xl bg-white shadow-sm animate-in fade-in">
                <h3 className="font-bold text-xl mb-2 text-blue-900">We need to check your system's compatibility!</h3>
                <p className="text-gray-600 mb-4">Since you already have a system, our engineer needs to check your existing DVR compatibility before adding new cameras.</p>
                <div className="space-y-4 mb-4">
                  <input type="text" placeholder="Your Name" value={req.customer_name || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} className="w-full p-3 border rounded-xl" />
                  <input type="tel" placeholder="Mobile Number" value={req.customer_mobile || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} className="w-full p-3 border rounded-xl" maxLength={10} />
                </div>
                <Button onClick={handleFinishWizard} disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} className="w-full h-12">
                  Request a Free Callback
                </Button>
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">💡 Typical Add-on Pricing</h4>
                  <ul className="text-sm text-blue-800 space-y-1.5">
                    <li>• Adding 1-2 cameras: ₹8,000 – ₹15,000</li>
                    <li>• Adding 3-4 cameras: ₹15,000 – ₹28,000</li>
                    <li>• DVR upgrade (if needed): ₹4,000 – ₹8,000 extra</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-3">* Exact pricing depends on your existing system compatibility. Our engineer will verify during the callback.</p>
                </div>
              </div>
            )}
            
            
          </div>
        );
      case 2:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Existing System Details</h2>
               <p className="text-gray-600 mb-6">Tell us about your current recorder so we can calculate compatibility.</p>
               
               <h3 className="font-semibold text-lg">1. Technology</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "HD" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'HD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>Analog HD (BNC Wire)</button>
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "IP" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'IP' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>IP / Network (CAT6 Wire)</button>
               </div>
               
               <h3 className="font-semibold text-lg mt-6">2. Existing Recorder Channels</h3>
               <div className="grid grid-cols-4 gap-2">
                  {[4, 8, 16, 32].map(ch => (
                    <button key={ch} onClick={() => setReq(prev => ({ ...prev, existing_recorder_channels: ch }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_recorder_channels === ch ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{ch} Ch</button>
                  ))}
               </div>
               
               <h3 className="font-semibold text-lg mt-6">3. Currently Working Cameras</h3>
               <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: Math.max(0, (prev.existing_working_cameras || 0) - 1) }))}>-</Button>
                  <span className="text-2xl font-bold w-12 text-center">{req.existing_working_cameras || 0}</span>
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: (prev.existing_working_cameras || 0) + 1 }))}>+</Button>
               </div>
               
               <div className="pt-6">
                 <Button onClick={handleNext} disabled={!req.existing_technology || !req.existing_recorder_channels} className="w-full h-12">Next Step</Button>
               </div>
             </div>
           );
        } else {
           const currentOutdoor = req.outdoor_camera_count !== undefined ? req.outdoor_camera_count : 2;
           const currentIndoor = req.indoor_camera_count !== undefined ? req.indoor_camera_count : 2;
           const totalCams = currentOutdoor + currentIndoor;

           return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">How many cameras do you need?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Outdoor Cameras</h3>
                      <p className="text-xs text-gray-500">Weatherproof Bullet</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))} disabled={currentOutdoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                  </div>
                </div>
  
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Indoor Cameras</h3>
                      <p className="text-xs text-gray-500">Ceiling Dome</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))} disabled={currentIndoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="font-semibold text-blue-900">Total Cameras:</span>
                <span className="text-2xl font-black text-blue-700">{totalCams}</span>
              </div>
  
              <div className="pt-2">
                <Button onClick={handleNext} disabled={totalCams === 0 || req.indoor_camera_count === undefined || req.outdoor_camera_count === undefined} className="w-full h-12 text-sm font-semibold">Confirm Cameras</Button>
              </div>
            </div>
          );
        }
      case 3:
        if (req.installation_type === "addon") {
           const currentOutdoor = req.outdoor_camera_count || 0;
           const currentIndoor = req.indoor_camera_count || 0;
           const newTotal = currentOutdoor + currentIndoor;
           const existingTotal = req.existing_working_cameras || 0;
           const combinedTotal = newTotal + existingTotal;
           const maxChannels = req.existing_recorder_channels || 4;
           
           const needsNewRecorder = combinedTotal > maxChannels;

           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Add New Cameras</h2>
               <p className="text-gray-600 mb-6">Select how many cameras you want to add.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Outdoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" className="bg-white border-2" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                     <Button variant="outline" size="icon" className="bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                   </div>
                 </div>
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Indoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" className="bg-white border-2" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                     <Button variant="outline" size="icon" className="bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                   </div>
                 </div>
               </div>
               
               {newTotal > 0 && (
                 <div className={`p-4 rounded-xl border ${needsNewRecorder ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                   {needsNewRecorder ? (
                     <>
                       <h4 className="font-bold text-red-800 mb-1">Recorder Upgrade Required</h4>
                       <p className="text-sm text-red-700">Your total active cameras ({combinedTotal}) exceed your {maxChannels}-channel DVR limit. We will automatically quote a new upgraded DVR.</p>
                     </>
                   ) : (
                     <>
                       <h4 className="font-bold text-green-800 mb-1">DVR Compatible!</h4>
                       <p className="text-sm text-green-700">Your total active cameras ({combinedTotal}) fit perfectly within your {maxChannels}-channel DVR limit. You save money!</p>
                     </>
                   )}
                 </div>
               )}
               
               <div className="pt-4">
                 <Button onClick={handleNext} disabled={newTotal === 0} className="w-full h-12">Next Step</Button>
               </div>
             </div>
           );
        } else {
           return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Recording & Storage Backup</h2>
              <p className="text-gray-600 mb-6">How long do you want to keep the CCTV recordings?</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[0, 7, 15, 30, 45, 60].map(days => (
                  <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))}
                    className={`p-4 rounded-xl border-2 text-center text-xl font-bold transition-all ${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:border-blue-300 hover:bg-gray-50 text-gray-700'}`}>
                    {days === 0 ? "No Recording" : `${days} Days`}
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-semibold mb-3">Recording Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'}`}>
                  <span className="block font-bold text-gray-900 text-lg">24x7 Continuous</span>
                  <span className="block text-sm text-gray-500 mt-1">Records everything non-stop. Requires standard hard disk capacity.</span>
                </button>
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:border-gray-300'}`}>
                  <span className="block font-bold text-gray-900 text-lg flex items-center">Smart Motion</span>
                  <span className="block text-sm text-gray-500 mt-1">Records only when movement is detected. <strong className="text-green-700">Saves up to 50% hard disk cost!</strong></span>
                </button>
              </div>
              
              <div className="pt-6">
                <Button onClick={handleNext} className="w-full h-12 text-lg font-semibold">
                  Confirm Recording
                </Button>
              </div>
            </div>
          );
        }
      case 6:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Storage Update</h2>
               <p className="text-gray-600 mb-6">Adding new cameras will reduce how many days your existing Hard Disk can store recordings.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: true, recording_days: 7 }))} className={`p-5 rounded-xl border-2 text-left ${req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">Keep Existing Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Don't buy a new one. (Saves money)</span>
                 </button>
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: false }))} className={`p-5 rounded-xl border-2 text-left ${!req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">Buy New Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Upgrade storage capacity.</span>
                 </button>
               </div>
               
               {!req.retain_existing_storage && (
                 <div className="animate-in fade-in bg-gray-50 p-6 rounded-xl border">
                   <h3 className="font-semibold mb-4 text-gray-900">Target Recording Days</h3>
                   <div className="grid grid-cols-3 gap-3 mb-4">
                     {[7, 15, 30].map(days => (
                       <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))} className={`p-3 rounded-xl border-2 text-center font-bold ${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{days} Days</button>
                     ))}
                   </div>
                   <h3 className="font-semibold mb-3 text-gray-900 mt-4">Recording Mode</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'bg-white'}`}>24x7 Continuous</button>
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50' : 'bg-white'}`}>Smart Motion</button>
                   </div>
                 </div>
               )}
               
               <div className="pt-6">
                 <Button onClick={handleNext} className="w-full h-12">Confirm & Proceed</Button>
               </div>
             </div>
           );
        } else {
            return null;
        }
      case 4:
          return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Site & Preferences</h2>
              <p className="text-gray-600 mb-6">Help us fine-tune your quote with a few site details.</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">1. Approximate Mounting Height</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => updateReq({ ceiling_height: "standard" })}
                      className={`p-3 rounded-xl border text-sm text-center ${req.ceiling_height === 'standard' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      Standard (&lt;10ft)
                    </button>
                    <button onClick={() => updateReq({ ceiling_height: "high" })}
                      className={`p-3 rounded-xl border text-sm text-center ${req.ceiling_height === 'high' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      High (10-15ft)
                    </button>
                    <button onClick={() => updateReq({ ceiling_height: "very_high" })}
                      className={`p-3 rounded-xl border text-sm text-center ${req.ceiling_height === 'very_high' ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      Very High (15ft+)
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">2. Surface Type</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => {
                        const types = req.surface_types || [];
                        const newTypes = types.includes('brick') ? types.filter((t: string) => t !== 'brick') : [...types, 'brick'];
                        updateReq({ surface_types: newTypes });
                      }}
                      className={`p-3 rounded-xl border text-sm text-center ${(req.surface_types || []).includes('brick') ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      Concrete / Brick Wall
                    </button>
                    <button onClick={() => {
                        const types = req.surface_types || [];
                        const newTypes = types.includes('false_ceiling') ? types.filter((t: string) => t !== 'false_ceiling') : [...types, 'false_ceiling'];
                        updateReq({ surface_types: newTypes });
                      }}
                      className={`p-3 rounded-xl border text-sm text-center ${(req.surface_types || []).includes('false_ceiling') ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      False Ceiling
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">3. Existing Cabling</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => updateReq({ cabling_done: false })}
                      className={`p-3 rounded-xl border text-sm text-center ${!req.cabling_done ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      No, include new cables
                    </button>
                    <button onClick={() => updateReq({ cabling_done: true })}
                      className={`p-3 rounded-xl border text-sm text-center ${req.cabling_done ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold' : 'bg-white hover:border-gray-300'}`}>
                      Yes, cables already installed
                    </button>
                  </div>

                  {!req.cabling_done && (
                    <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                      <div>
                        <span className="block font-semibold text-gray-900 text-sm">Approx. Total Cable Required</span>
                        <span className="block text-xs text-gray-500">
                          Estimated ~15m per camera ({req.camera_count || 4} cameras = {(req.camera_count || 4) * 15}m)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm self-start sm:self-auto">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            const defaultMeters = (req.camera_count || 4) * 15;
                            const current = req.total_cable_length_meters || defaultMeters;
                            const next = Math.max(10, current - 10);
                            updateReq({ total_cable_length_meters: next });
                          }}
                          disabled={((req.total_cable_length_meters || ((req.camera_count || 4) * 15)) <= 10)}
                        >
                          -
                        </Button>
                        <span className="font-bold text-blue-800 min-w-[80px] text-center text-sm">
                          {req.total_cable_length_meters || ((req.camera_count || 4) * 15)} Meters
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            const defaultMeters = (req.camera_count || 4) * 15;
                            const current = req.total_cable_length_meters || defaultMeters;
                            const next = current + 10;
                            updateReq({ total_cable_length_meters: next });
                          }}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  onClick={handleNext} 
                  disabled={!req.ceiling_height || !(req.surface_types && req.surface_types.length > 0)}
                  className="w-full h-12 text-lg font-semibold"
                >
                  Confirm Details
                </Button>
              </div>
            </div>
          );

        case 5:
          if (otpSent) {
            return (
              <div className="space-y-6 animate-in fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-3 mx-auto">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-slate-900">Enter Verification Code</h2>
                  <p className="text-gray-600 text-sm">
                    We've sent a 6-digit verification code to{" "}
                    <span className="font-semibold text-slate-900">+91 {req.customer_mobile}</span>
                  </p>
                </div>

                <div className="py-2">
                  <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white text-gray-900"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.join("").length !== 6}
                  size="lg"
                  className="w-full text-lg h-14 font-semibold shadow-md bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" /> Verifying OTP...
                    </span>
                  ) : (
                    "Submit OTP & View Quotation"
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(["", "", "", "", "", ""]);
                    }}
                    className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
                  >
                    ← Change Mobile Number
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleFinishWizard}
                    className={`font-semibold transition-colors ${
                      countdown > 0
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-blue-600 hover:text-blue-700 hover:underline"
                    }`}
                  >
                    {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Final Step: Get Your Quotation</h2>
              <p className="text-gray-600 mb-6">Please enter your details to view your personalized CCTV options instantly.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Kumar" 
                    value={req.customer_name || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} 
                    className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="10-digit mobile number" 
                    maxLength={10}
                    value={req.customer_mobile || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} 
                    className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input 
                    type="email" 
                    placeholder="e.g. rahul@email.com" 
                    value={req.customer_email || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_email: e.target.value }))} 
                    className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <Button 
                onClick={handleFinishWizard} 
                disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} 
                size="lg" 
                className="w-full text-lg h-14 mt-6"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...
                  </span>
                ) : (
                  "View My CCTV Options"
                )}
              </Button>
            </div>
          );
    }
  };
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      
      <h1 className="sr-only">CCTV Quotation Wizard</h1>
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            Exit
          </Link>
          <span className="text-xs text-gray-400 font-medium">CCTVQuotation.com</span>
        </div>
        {step > 0 && (
          <div className="mb-8">
            <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-right">Step {Math.min(step, totalSteps)} of {totalSteps}</p>
          </div>
        )}

        {renderStep()}

        {step > 0 && !otpSent && (
          <div className="mt-12 flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={step <= 1 || loading}>
              Back
            </Button>
          </div>
        )}
      </div>

      
    </div>
  );
}
