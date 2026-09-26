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
import { RecaptchaVerifier, signInWithCustomToken, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { createLeadAction } from "@/app/actions/lead";
import { ShieldCheck, Loader2, Sparkles, Wrench } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function WizardClientV2() {
  const { t } = useTranslation();
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState<"sms" | "whatsapp">("whatsapp");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === "undefined") return;

    const initRecaptcha = () => {
      if ((window as any).recaptchaVerifierWizard) {
        try {
          (window as any).recaptchaVerifierWizard.clear();
        } catch (e) {}
        delete (window as any).recaptchaVerifierWizard;
      }
      try {
        (window as any).recaptchaVerifierWizard = new RecaptchaVerifier(auth, "recaptcha-container-wizard", {
          size: "invisible",
          callback: () => {},
          "expired-callback": () => {
            toast.error("reCAPTCHA expired. Please try again.");
          },
        });
      } catch (err) {
        console.error("Recaptcha init error:", err);
      }
    };

    const timer = setTimeout(initRecaptcha, 100);

    return () => {
      clearTimeout(timer);
      if ((window as any).recaptchaVerifierWizard) {
        try {
          (window as any).recaptchaVerifierWizard.clear();
        } catch (e) {}
        delete (window as any).recaptchaVerifierWizard;
      }
    };
  }, []);

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
            const digits = otpCred.code.replace(/\D/g, "").slice(0, 4).split("");
            if (digits.length === 4) {
              setOtp(digits);
              inputRefs.current[3]?.focus();
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
      const digits = clean.slice(0, 4).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 3);
      inputRefs.current[nextIdx]?.focus();
      if (digits.length === 4) {
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
    
    if (newOtp.join("").length === 4) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && otp.join("").length === 4) {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    const digits = pasted.split("");
    const newOtp = ["", "", "", ""];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    const focusIdx = Math.min(digits.length, 3);
    inputRefs.current[focusIdx]?.focus();
    if (digits.length === 4) {
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
    technology_preference: "HD",
    wants_remote_viewing: true
  });
  
  // Auto-capture referral code from URL parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref") || urlParams.get("partner_id") || urlParams.get("promo");
      if (ref) {
        setReq(prev => ({ ...prev, partner_id: ref.toUpperCase() }));
      }
    }
  }, []);

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
      setOtp(["", "", "", ""]);
      return;
    }
    setStep(s => Math.max(s - 1, 0));
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

      if (false) {
        setConfirmationResult({
          confirm: async (code: string) => {
            return { user: { uid: "mock-e2e-uid" } } as any;
          }
        } as any);
        setOtpSent(true);
        setCountdown(30);
        setOtp(["", "", "", ""]);
        setLoading(false);
        return;
      }
      
      const endpoint = otpMethod === "sms" ? "/api/auth/otp/sms" : "/api/auth/otp/whatsapp";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanMobile }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (otpMethod === "sms") {
          toast.error(data.error ? `SMS failed: ${data.error}` : "SMS failed to send. Please try WhatsApp OTP instead.", { duration: 8000 });
        } else {
          toast.error(data.error || "Failed to send WhatsApp OTP.");
        }
        return;
      }
      
      setOtpSent(true);
      setCountdown(otpMethod === "sms" ? 30 : 60);
      setOtp(["", "", "", ""]);
      toast.success(`${otpMethod === "sms" ? "SMS" : "WhatsApp"} OTP sent to your number.`);
      
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 4) {
      toast.error("Please enter the 4-digit OTP.");
      return;
    }
    
    setLoading(true);
    try {
      const cleanMobile = (req.customer_mobile || "").replace(/\s/g, "");
      
      const verifyEndpoint = otpMethod === "sms" ? "/api/auth/otp/sms/verify" : "/api/auth/otp/whatsapp/verify";
      const res = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanMobile, otp: code }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP code.");
      }
      
      // We get a custom token back, sign in with it!
      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
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
        mobile_number: cleanMobile,
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
      toast.error(error.message || "Please check the code and try again.");
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
      <div className="max-w-6xl mx-auto py-6 md:py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("wz_your_cctv_options")}</h1>
          <p className="text-gray-600">{t("wz_select_the_plan_that_best_fits")}</p>
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


  if (!isMounted) {
    return <div className="max-w-3xl mx-auto py-6 md:py-12 px-4 sm:px-6 animate-pulse bg-gray-100 rounded-2xl h-[400px]"></div>;
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2 text-center text-slate-900">{t("wz_how_would_you_like_to_build_yo")}</h2>
            <p className="text-center text-slate-500 mb-8 max-w-lg mx-auto">{t("wz_choose_between_our_easy_guided")}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setStep(1)}
                className="p-4 md:p-8 rounded-2xl border-2 text-left hover:border-blue-500 transition-all group bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-blue-900 group-hover:text-blue-700 mb-2"><Sparkles className="w-5 h-5 mr-1.5 inline-block" />  {t("wz_guided_setup_recommended")}</span>
                <span className="block text-sm text-blue-800 font-medium leading-relaxed">{t("wz_answer_a_few_simple_questions_")}</span>
              </button>
              
              <button onClick={() => window.location.href = '/pro-builder'}
                className="p-4 md:p-8 rounded-2xl border-2 text-left hover:border-zinc-900 transition-all group bg-white border-zinc-200 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-zinc-900 group-hover:text-black mb-2"><Wrench className="w-5 h-5 mr-1.5 inline-block" />  {t("wz_custom_build_advanced")}</span>
                <span className="block text-sm text-zinc-500 font-medium leading-relaxed">{t("wz_i_already_know_exactly_what_ca")}</span>
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{t("wz_what_kind_of_installation_do_y")}</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">Select your setup type to calculate appropriate wiring and hardware.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <button onClick={() => { updateReq({ installation_type: "new", property_type: "home" }); handleNext(); }}
                className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left hover:border-blue-500 transition-all cursor-pointer group ${req.installation_type === "new" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"}`}>
                <span className="block font-bold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-blue-600">{t("wz_completely_new_system")}</span>
                <span className="block text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">{t("wz_i_dont_have_any_cctv_cameras_i")}</span>
              </button>
              <button onClick={() => { updateReq({ installation_type: "addon", existing_system_known: undefined }); }}
                className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left hover:border-blue-500 transition-all cursor-pointer group ${req.installation_type === "addon" ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40" : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"}`}>
                <span className="block font-bold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-blue-600">{t("wz_add_to_existing_system")}</span>
                <span className="block text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1">{t("wz_i_already_have_a_cctv_system_a")}</span>
              </button>
            </div>
            
            {req.installation_type === "addon" && (
              <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200 animate-in fade-in">
                <h3 className="font-semibold text-lg text-yellow-900 mb-4">{t("wz_do_you_know_the_technical_spec")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => handleNext()}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">{t("wz_yes_i_know")}</span>
                    <span className="block text-xs text-gray-500 mt-1">{t("wz_i_know_my_dvr_channels_and_tec")}</span>
                  </button>
                  <button onClick={() => updateReq({ existing_system_known: false })}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">{t("wz_no_i_dont_know")}</span>
                    <span className="block text-xs text-gray-500 mt-1">{t("wz_help_me_check_compatibility")}</span>
                  </button>
                </div>
              </div>
            )}
            
            {req.installation_type === "addon" && req.existing_system_known === false && (
              <div className="mt-6 p-6 border rounded-xl bg-white shadow-sm animate-in fade-in">
                <h3 className="font-bold text-xl mb-2 text-blue-900">{t("wz_we_need_to_check_your_systems_")}</h3>
                <p className="text-gray-600 mb-4">{t("wz_since_you_already_have_a_syste")}</p>
                <div className="space-y-4 mb-4">
                  <input type="text" placeholder="Your Name" value={req.customer_name || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} className="w-full p-3 border rounded-xl" />
                  <input type="tel" placeholder="Mobile Number" value={req.customer_mobile || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} className="w-full p-3 border rounded-xl" maxLength={10} />
                </div>
                <Button onClick={handleFinishWizard} disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} className="w-full h-12">
                  
                                              {t("wz_request_a_free_callback")}
                                            </Button>
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">{t("wz__typical_addon_pricing")}</h4>
                  <ul className="text-sm text-blue-800 space-y-1.5">
                    <li>{t("wz__adding_12_cameras_8000__15000")}</li>
                    <li>{t("wz__adding_34_cameras_15000__2800")}</li>
                    <li>{t("wz__dvr_upgrade_if_needed_4000__8")}</li>
                  </ul>
                  <p className="text-xs text-blue-600 mt-3">{t("wz__exact_pricing_depends_on_your")}</p>
                </div>
              </div>
            )}
            {req.installation_type !== "addon" && (
              <div className="pt-2 sm:pt-4">
                <Button variant="outline" onClick={handlePrev} className="h-11 px-5 rounded-xl font-bold text-gray-700 dark:text-gray-200 border-2">
                  {t("wz_back")}
                </Button>
              </div>
            )}
          </div>
        );
      case 2:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">{t("wz_existing_system_details")}</h2>
               <p className="text-gray-600 mb-6">{t("wz_tell_us_about_your_current_rec")}</p>
               
               <h3 className="font-semibold text-lg">{t("wz_1_technology")}</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "HD" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'HD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>{t("wz_analog_hd_bnc_wire")}</button>
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "IP" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'IP' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>{t("wz_ip__network_cat6_wire")}</button>
               </div>
               
               <h3 className="font-semibold text-lg mt-6">{t("wz_2_existing_recorder_channels")}</h3>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[4, 8, 16, 32].map(ch => (
                    <button key={ch} onClick={() => setReq(prev => ({ ...prev, existing_recorder_channels: ch }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_recorder_channels === ch ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{ch} Ch</button>
                  ))}
               </div>
               
               <h3 className="font-semibold text-lg mt-6">{t("wz_3_currently_working_cameras")}</h3>
               <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: Math.max(0, (prev.existing_working_cameras || 0) - 1) }))}>-</Button>
                  <span className="text-2xl font-bold w-12 text-center">{req.existing_working_cameras || 0}</span>
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: (prev.existing_working_cameras || 0) + 1 }))}>+</Button>
               </div>
               
               <div className="pt-6">
                 <Button onClick={handleNext} disabled={!req.existing_technology || !req.existing_recorder_channels} className="w-full h-12">{t("wz_next_step")}</Button>
               </div>
             </div>
           );
        } else {
           const currentOutdoor = req.outdoor_camera_count !== undefined ? req.outdoor_camera_count : 2;
           const currentIndoor = req.indoor_camera_count !== undefined ? req.indoor_camera_count : 2;
           const totalCams = currentOutdoor + currentIndoor;

            return (
            <div className="space-y-3 sm:space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{t("wz_how_many_cameras_do_you_need")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">Select the number of outdoor and indoor cameras.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-2.5 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{t("wz_outdoor_cameras")}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t("wz_weatherproof_bullet")}</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-white dark:bg-zinc-900 border text-base font-black hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))} disabled={currentOutdoor === 0}>-</Button>
                    <span className="text-lg sm:text-xl font-black w-8 sm:w-10 text-center text-blue-700 dark:text-blue-400">{currentOutdoor}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-white dark:bg-zinc-900 border text-base font-black hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                  </div>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">{t("wz_indoor_cameras")}</h3>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400">{t("wz_ceiling_dome")}</p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-white dark:bg-zinc-900 border text-base font-black hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))} disabled={currentIndoor === 0}>-</Button>
                    <span className="text-lg sm:text-xl font-black w-8 sm:w-10 text-center text-blue-700 dark:text-blue-400">{currentIndoor}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 bg-white dark:bg-zinc-900 border text-base font-black hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2.5 sm:p-3 rounded-xl flex justify-between items-center border border-blue-100 dark:border-blue-900">
                <span className="font-bold text-[11px] sm:text-sm text-blue-900 dark:text-blue-200 tracking-tight">{t("wz_total_cameras")}</span>
                <span className="text-xl sm:text-2xl font-black text-blue-700 dark:text-blue-400">{totalCams}</span>
              </div>

              <div className="pt-2 sm:pt-4 flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={handlePrev} className="h-11 sm:h-12 px-3 sm:px-6 rounded-xl font-bold text-gray-700 dark:text-gray-200 border-2">
                  {t("wz_back")}
                </Button>
                <Button onClick={handleNext} disabled={totalCams === 0 || req.indoor_camera_count === undefined || req.outdoor_camera_count === undefined} className="flex-1 h-11 sm:h-12 text-[13px] sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis px-2">
                  {t("wz_confirm_cameras")}
                </Button>
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
               <h2 className="text-3xl font-semibold mb-2">{t("wz_add_new_cameras")}</h2>
               <p className="text-gray-600 mb-6">{t("wz_select_how_many_cameras_you_wa")}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">{t("wz_new_outdoor")}</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" className="bg-white border-2" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                     <Button variant="outline" size="icon" className="bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                   </div>
                 </div>
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">{t("wz_new_indoor")}</h3>
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
                       <h4 className="font-bold text-red-800 mb-1">{t("wz_recorder_upgrade_required")}</h4>
                       <p className="text-sm text-red-700">{t("wz_your_total_active_cameras_")}{combinedTotal}{t("wz__exceed_your")} {maxChannels}{t("wz_channel_dvr_limit_we_will_auto")}</p>
                     </>
                   ) : (
                     <>
                       <h4 className="font-bold text-green-800 mb-1">{t("wz_dvr_compatible")}</h4>
                       <p className="text-sm text-green-700">{t("wz_your_total_active_cameras_")}{combinedTotal}{t("wz__fit_perfectly_within_your")} {maxChannels}{t("wz_channel_dvr_limit_you_save_mon")}</p>
                     </>
                   )}
                 </div>
               )}
               
               <div className="pt-4">
                 <Button onClick={handleNext} disabled={newTotal === 0} className="w-full h-12">{t("wz_next_step")}</Button>
               </div>
             </div>
           );
        } else {
            return (
            <div className="space-y-3 sm:space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{t("wz_recording__storage_backup")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">{t("wz_how_long_do_you_want_to_keep_t")}</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {[0, 7, 15, 30, 45, 60].map(days => (
                  <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))}
                    className={`py-2 sm:py-3 px-1 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.recording_days === days ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-gray-50 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900'}`}>
                    {days === 0 ? "No Recording" : `${days} Days`}
                  </button>
                ))}
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-2">{t("wz_recording_mode")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))}
                    className={`p-2.5 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900'}`}>
                    <span className="block font-bold text-gray-900 dark:text-white text-xs sm:text-sm">{t("wz_24x7_continuous")}</span>
                    <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">Records non-stop 24/7</span>
                  </button>
                  <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))}
                    className={`p-2.5 sm:p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${req.recording_mode === 'motion' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900'}`}>
                    <span className="block font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center justify-between">
                      <span>{t("wz_smart_motion")}</span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1 py-0.5 rounded font-black">50% SAVE</span>
                    </span>
                    <span className="block text-[10px] sm:text-xs text-gray-500 dark:text-zinc-400 mt-0.5 leading-tight">Records movement only</span>
                  </button>
                </div>
              </div>
              
              <div className="pt-2 sm:pt-4 flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={handlePrev} className="h-11 sm:h-12 px-3 sm:px-6 rounded-xl font-bold text-gray-700 dark:text-gray-200 border-2">
                  {t("wz_back")}
                </Button>
                <Button onClick={handleNext} className="flex-1 h-11 sm:h-12 text-[13px] sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis px-2">
                  {t("wz_confirm_recording")}
                </Button>
              </div>
            </div>
          );
        }
      case 6:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">{t("wz_storage_update")}</h2>
               <p className="text-gray-600 mb-6">{t("wz_adding_new_cameras_will_reduce")}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: true, recording_days: 7 }))} className={`p-5 rounded-xl border-2 text-left ${req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">{t("wz_keep_existing_hard_disk")}</span>
                   <span className="block text-sm text-gray-500 mt-1">{t("wz_dont_buy_a_new_one_saves_money")}</span>
                 </button>
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: false }))} className={`p-5 rounded-xl border-2 text-left ${!req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">{t("wz_buy_new_hard_disk")}</span>
                   <span className="block text-sm text-gray-500 mt-1">{t("wz_upgrade_storage_capacity")}</span>
                 </button>
               </div>
               
               {!req.retain_existing_storage && (
                 <div className="animate-in fade-in bg-gray-50 p-6 rounded-xl border">
                   <h3 className="font-semibold mb-4 text-gray-900">{t("wz_target_recording_days")}</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                     {[7, 15, 30].map(days => (
                       <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))} className={`p-3 rounded-xl border-2 text-center font-bold ${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{days}  {t("wz_days")}</button>
                     ))}
                   </div>
                   <h3 className="font-semibold mb-3 text-gray-900 mt-4">{t("wz_recording_mode")}</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'bg-white'}`}>{t("wz_24x7_continuous")}</button>
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50' : 'bg-white'}`}>{t("wz_smart_motion")}</button>
                   </div>
                 </div>
               )}
               
               <div className="pt-6">
                 <Button onClick={handleNext} className="w-full h-12">{t("wz_confirm__proceed")}</Button>
               </div>
             </div>
           );
        } else {
            return null;
        }
      case 4:
          return (
            <div className="space-y-3.5 sm:space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{t("wz_site__preferences")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">{t("wz_help_us_finetune_your_quote_wi")}</p>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">{t("wz_1_approximate_mounting_height")}</h3>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                    <button onClick={() => updateReq({ ceiling_height: "standard" })}
                      className={`py-2 sm:py-3 px-1 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.ceiling_height === 'standard' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-gray-50 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900'}`}>
                      {t("wz_standard_lt10ft")}
                    </button>
                    <button onClick={() => updateReq({ ceiling_height: "high" })}
                      className={`py-2 sm:py-3 px-1 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.ceiling_height === 'high' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-gray-50 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900'}`}>
                      {t("wz_high_1015ft")}
                    </button>
                    <button onClick={() => updateReq({ ceiling_height: "very_high" })}
                      className={`py-2 sm:py-3 px-1 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.ceiling_height === 'very_high' ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-blue-300 hover:bg-gray-50 text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900'}`}>
                      {t("wz_very_high_15ft")}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">{t("wz_2_surface_type")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <button onClick={() => {
                        const types = req.surface_types || [];
                        const newTypes = types.includes('brick') ? types.filter((t: string) => t !== 'brick') : [...types, 'brick'];
                        updateReq({ surface_types: newTypes });
                      }}
                      className={`py-2 sm:py-3 px-2 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${(req.surface_types || []).includes('brick') ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300'}`}>
                      {t("wz_concrete__brick_wall")}
                    </button>
                    <button onClick={() => {
                        const types = req.surface_types || [];
                        const newTypes = types.includes('false_ceiling') ? types.filter((t: string) => t !== 'false_ceiling') : [...types, 'false_ceiling'];
                        updateReq({ surface_types: newTypes });
                      }}
                      className={`py-2 sm:py-3 px-2 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${(req.surface_types || []).includes('false_ceiling') ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300'}`}>
                      {t("wz_false_ceiling")}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">{t("wz_3_existing_cabling")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    <button onClick={() => updateReq({ cabling_done: false })}
                      className={`py-2 sm:py-3 px-2 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.cabling_done === false ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300'}`}>
                      No
                    </button>
                    <button onClick={() => updateReq({ cabling_done: true })}
                      className={`py-2 sm:py-3 px-2 rounded-xl border-2 text-center text-xs sm:text-sm font-bold transition-all cursor-pointer ${req.cabling_done === true ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-sm' : 'border-gray-200 dark:border-zinc-800 hover:border-gray-300 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300'}`}>
                      {t("wz_yes")}
                    </button>
                  </div>

                  {req.cabling_done === false && (
                    <div className="mt-2.5 p-2.5 sm:p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between gap-2 animate-in fade-in">
                      <div>
                        <span className="block font-bold text-gray-900 dark:text-white text-xs">{t("wz_approx_total_cable_required")}</span>
                        <span className="block text-[10px] text-gray-500 dark:text-zinc-400">
                          {t("wz_estimated_15m_per_camera_")}{req.camera_count || 4} {t("wz_cameras_")} ({(req.camera_count || 4) * 15}m)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-2 py-1 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-gray-700 dark:text-gray-200 hover:bg-gray-100 font-bold"
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
                        <span className="font-black text-blue-800 dark:text-blue-300 min-w-[60px] text-center text-xs">
                          {req.total_cable_length_meters || ((req.camera_count || 4) * 15)} {t("wz_meters")}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 text-gray-700 dark:text-gray-200 hover:bg-gray-100 font-bold"
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

              <div className="pt-2 sm:pt-4 flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={handlePrev} className="h-11 sm:h-12 px-3 sm:px-6 rounded-xl font-bold text-gray-700 dark:text-gray-200 border-2">
                  {t("wz_back")}
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!req.ceiling_height || !(req.surface_types && req.surface_types.length > 0) || req.cabling_done === undefined}
                  className="flex-1 h-11 sm:h-12 text-[13px] sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis px-2"
                >
                  {t("wz_confirm_details")}
                </Button>
              </div>
            </div>
          );

        case 5:
          if (otpSent) {
            return (
              <div className="space-y-4 sm:space-y-6 animate-in fade-in">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-blue-600 mb-2 mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">{t("wz_enter_verification_code")}</h2>
                  <p className="text-gray-500 dark:text-zinc-400 text-xs sm:text-sm">
                    {t("wz_weve_sent_a_6digit_verificatio")}{" "}
                    <span className="font-bold text-slate-900 dark:text-white">+91 {req.customer_mobile}</span>
                  </p>
                </div>

                <div className="py-1 sm:py-2">
                  <div className="flex justify-center gap-1.5 sm:gap-3" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        maxLength={4}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-10 h-12 sm:w-13 sm:h-16 text-center text-lg sm:text-2xl font-black border-2 rounded-xl border-gray-200 dark:border-zinc-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => handleVerifyOtp()}
                  disabled={loading || otp.join("").length !== 4}
                  size="lg"
                  className="w-full text-sm sm:text-base h-12 sm:h-14 font-bold shadow-md bg-blue-600 hover:bg-blue-700 rounded-xl text-white"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("wz_verifying_otp")}
                    </span>
                  ) : (
                    "Submit OTP & View Quotation"
                  )}
                </Button>

                <div className="flex items-center justify-between pt-1 sm:pt-2 text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp(["", "", "", ""]);
                    }}
                    className="text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold transition-colors"
                  >
                    {t("wz__change_mobile_number")}
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleFinishWizard}
                    className={`font-bold transition-colors ${
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
            <div className="space-y-3.5 sm:space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{t("wz_final_step_get_your_quotation")}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 font-medium">{t("wz_please_enter_your_details_to_v")}</p>
              </div>
              
              <div className="space-y-2.5 sm:space-y-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">{t("wz_your_name_")}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Kumar" 
                    value={req.customer_name || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} 
                    className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">{t("wz_mobile_number_")}</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="10-digit mobile number" 
                    maxLength={10}
                    value={req.customer_mobile || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} 
                    className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1">{t("wz_email_optional")}</label>
                  <input 
                    type="email" 
                    placeholder="e.g. rahul@email.com" 
                    value={req.customer_email || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, customer_email: e.target.value }))} 
                    className="w-full py-2.5 px-3.5 sm:p-3.5 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="p-2.5 sm:p-3 bg-green-50/80 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-green-950 dark:text-green-300">Referral Code (Optional)</label>
                    <span className="text-[10px] text-green-700 dark:text-green-400 font-medium">Get discount</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. P102" 
                    value={req.partner_id || ''} 
                    onChange={(e) => setReq(prev => ({ ...prev, partner_id: e.target.value.toUpperCase() }))} 
                    className="w-full py-2 px-3 text-sm border border-green-300 dark:border-green-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all uppercase placeholder-normal bg-white dark:bg-zinc-800 text-gray-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 sm:pt-4 flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={handlePrev} className="h-11 sm:h-12 px-3 sm:px-6 rounded-xl font-bold text-gray-700 dark:text-gray-200 border-2" disabled={loading}>
                  {t("wz_back")}
                </Button>
                <Button 
                  onClick={handleFinishWizard} 
                  disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} 
                  size="lg" 
                  className="flex-1 h-11 sm:h-12 text-[13px] sm:text-base font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 whitespace-nowrap overflow-hidden text-ellipsis px-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> {t("wz_sending_otp")}
                    </span>
                  ) : (
                    "View My CCTV Options"
                  )}
                </Button>
              </div>
            </div>
          );
    }
  };
  return (
    <div className="max-w-2xl mx-auto py-0 sm:py-6 md:py-10 px-0 sm:px-4 md:px-6 w-full">
      <h1 className="sr-only">{t("wz_cctv_quotation_wizard")}</h1>
      <div className="bg-white dark:bg-zinc-900 rounded-none sm:rounded-3xl shadow-none sm:shadow-sm border-0 sm:border border-gray-100 dark:border-zinc-800 p-4 sm:p-6 md:p-8 min-h-[100dvh] sm:min-h-0 flex flex-col w-full overflow-x-hidden">
        <div className="flex justify-between items-center mb-2.5 sm:mb-4">
          <Link href="/" className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 font-medium">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {t("wz_exit")}
          </Link>
          <span className="text-[11px] sm:text-xs text-gray-400 font-medium">{t("wz_cctvquotationcom")}</span>
        </div>
        {step > 0 && (
          <div className="mb-3.5 sm:mb-6">
            <div className="h-1.5 sm:h-2 bg-gray-100 dark:bg-zinc-800 rounded-full w-full overflow-hidden">
              <div className="h-1.5 sm:h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}></div>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 sm:mt-1.5 text-right font-medium">{t("wz_step")} {Math.min(step, totalSteps)} of {totalSteps}</p>
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
}
