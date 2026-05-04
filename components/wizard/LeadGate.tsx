"use client";

import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/store/wizard";
import { ShieldCheck, Phone, User, CheckCircle2, Loader2, ArrowRight, Mail, UploadCloud, MapPin } from "lucide-react";
import { trackEvent } from "@/components/shared/TrackingProvider";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

/**
 * Lead Capture Gate (Elite Premiere Edition)
 * Shows a high-fidelity modal required to view custom quotes.
 */
export function LeadGate({ isIndustrial }: { isIndustrial?: boolean }) {
  const router = useRouter();
  const { answers } = useWizardStore();
  
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pincode, setPincode] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("sms");
  const [showIndustrialSuccess, setShowIndustrialSuccess] = useState(false);
  const referralCode = ""; // referralCode input to be implemented
  
  const [competitorQuote, setCompetitorQuote] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // Timer for Resend OTP
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && otpSent) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, otpSent]);

  useEffect(() => {
    // Defensive check: only initialize if element exists and auth is safe
    const container = document.getElementById("recaptcha-container");
    if (container && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch (error) {
        const err = error as Error;
        console.error("🔒 Recaptcha Initialization Fault:", err);
        setError("Security System Error: Recaptcha failed to initialize. Please check your connection or refresh.");
      }
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) return setError("Please enter your full name (minimum 2 characters).");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Enter a valid 10-digit Indian mobile number (starts with 6–9).");
    if (!/^\d{6}$/.test(pincode)) return setError("Enter your 6-digit area pincode — required for dispatch routing.");

    setLoading(true);
    try {
      // E2E / Internal Bypass check
      if (mobile === "9999999999") {
        setOtpSent(true);
        setLoading(false);
        setCountdown(30);
        setCanResend(false);
        return;
      }

      const appVerifier = window.recaptchaVerifier;
      const formatPhone = "+91" + mobile;
      
      const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setCountdown(30); // 30 second cooldown
      setCanResend(false);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      console.error("🔥 OTP Transmission Fault:", err);

      // Reset recaptcha so it can be retried cleanly
      try {
        window.recaptchaVerifier?.clear?.();
        // @ts-ignore — force re-init on next attempt
        window.recaptchaVerifier = undefined;
      } catch (_) { /* ignore cleanup errors */ }

      if (err.code === "auth/invalid-app-credential" || err.message?.includes("invalid-app-credential")) {
        setError(
          "Firebase reCAPTCHA Error on localhost: Go to Firebase Console → Authentication → Settings → Authorized Domains and add 'localhost'. " +
          "For testing right now use mobile: 9999999999 and OTP: 123456."
        );
      } else if (err.code === "auth/invalid-api-key" || err.message?.includes("invalid-api-key")) {
        setError("Configuration Error: Firebase API key is incorrect. Check your .env.local file.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Security Throttling: Too many attempts. Please wait a few minutes and try again.");
      } else if (err.message?.includes("auth/operation-not-allowed") || err.code === "auth/operation-not-allowed") {
        setError("Configuration Error: Phone Authentication is not enabled in Firebase Console → Authentication → Sign-in method.");
      } else if (err.message?.includes("auth/unauthorized-domain") || err.code === "auth/unauthorized-domain") {
        setError(`Domain Error: '${window.location.hostname}' is not whitelisted. Add it in Firebase Console → Authentication → Settings → Authorized Domains.`);
      } else {
        setError(`OTP Error: ${err.message || "Failed to send OTP. Please retry."}`);
      }
    } finally {
      setLoading(false);
    }
  };


  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setError("Incomplete: Please enter the 6-digit security code.");
    
    // E2E / Internal Bypass check
    if (mobile === "9999999999" && fullOtp === "123456") {
       finalizeLead("e2e-bypass-uid");
       return;
    }

    if (!confirmationResult) return;
    
    setError("");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(fullOtp);
      finalizeLead(result.user.uid);
    } catch (err) {
      setError("Security Violation: Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeLead = async (firebaseUid: string) => {
    try {
      const extractAns = (qId: string) => {
        const val = answers[qId];
        if (Array.isArray(val)) return val[0] || "";
        return val || "";
      };

      let competitorQuoteUrl = undefined;

      if (competitorQuote) {
        setIsUploading(true);
        try {
          const timestamp = new Date().getTime();
          const ext = competitorQuote.name.split('.').pop() || 'pdf';
          const storageRef = ref(storage, `competitor_quotes/${firebaseUid}_${timestamp}.${ext}`);
          await uploadBytes(storageRef, competitorQuote);
          competitorQuoteUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("File upload failed, proceeding without it", uploadError);
          // Don't block lead creation if upload fails, just proceed
        }
        setIsUploading(false);
      }

      const payload = {
        customer_name: name,
        mobile_number: mobile,
        email: email || undefined,
        firebase_uid: firebaseUid,
        referral_code: referralCode || undefined,
        wizard_answers: { ...answers, lead_pincode: pincode },
        property_type: extractAns("q_prop_type") || "home",
        technology_choice: extractAns("q_tech") || "HD",
        cabling_done: extractAns("q_wiring") === "true",
        camera_count: parseInt(extractAns("q_cam_count") || "0"),
        competitor_quote_url: competitorQuoteUrl
      };

      if (isIndustrial) {
        // Special API for Industrial Leads
        const indRes = await fetch("/api/leads/industrial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: mobile,
            requested_camera_count: payload.camera_count,
            property_type: payload.property_type,
            technology: payload.technology_choice,
            consent: true
          })
        });
        if (!indRes.ok) throw new Error("Failed to register industrial interest.");
        
        setShowIndustrialSuccess(true);
        return;
      }

      const createRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await createRes.json();
      if (!createRes.ok) throw new Error(resData.error || "Server Synchronization Failed.");

      // ───────────────────────────────────────────────────────────────────────
      // TRACK CONVERSION
      // ───────────────────────────────────────────────────────────────────────
      trackEvent("generate_lead", {
        customer_name: name,
        property_type: payload.property_type,
        technology_choice: payload.technology_choice,
        cabling_done: payload.cabling_done
      });

      router.push(`/quote/${resData.id}`);
    } catch (error) {
      const err = error as Error;
      setError(err.message);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-3xl animate-in fade-in duration-500">
      <div id="recaptcha-container"></div>
      {/* NOTE: overflow-y-auto ensures errors + new fields are always visible */}
      
      {showIndustrialSuccess ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl rounded-[40px] w-full max-w-lg p-12 text-center animate-in zoom-in-95 duration-500">
           <div className="w-20 h-20 rounded-[32px] bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/20">
             <ShieldCheck className="w-10 h-10 text-white" />
           </div>
           <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4 uppercase">Verification <br/> Successful</h2>
           <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-relaxed mb-10">
             As your requirement exceeds 16 cameras, we provide custom corporate-grade quotations. <br/><br/>
             <span className="text-zinc-900 dark:text-white font-black">Our technical team will call you within 2 hours</span> to understand your site requirements.
           </p>
           <button 
             onClick={() => router.push("/")}
             className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20"
           >
             Return Home
           </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_30px_70px_rgba(0,0,0,0.2)] rounded-[40px] w-full max-w-lg p-8 md:p-12 relative overflow-y-auto max-h-[90vh] transition-all">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest mb-6 border border-emerald-100 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              {isIndustrial ? "Industrial Inquiry" : "Configuration Finalized"}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.85] mb-4">
               {isIndustrial ? "Corporate Setup" : "Unlock Your"} <br className="hidden md:block"/> {isIndustrial ? "Requirement" : "Elite Proposal"}.
            </h2>
            <p className="text-zinc-400 dark:text-zinc-500 font-medium text-lg leading-snug">
              {isIndustrial ? "Capture contact to book your expert site visit." : "Verification required for itemized hardware transparency."}
            </p>
          </div>

          {/* ... rest of the existing form logic ... */}
          {error && (
            <div className="bg-red-500 text-white px-5 py-4 rounded-2xl text-sm mb-6 font-bold text-center flex items-start gap-3 shadow-lg shadow-red-500/20">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const capitalized = val.replace(/\b\w/g, char => char.toUpperCase());
                      setName(capitalized);
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Contact Number</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 dark:text-zinc-600 border-r border-zinc-200 dark:border-zinc-800 pr-3">+91</span>
                  <input 
                    type="tel" 
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-16 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="98765 43210"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* PINCODE — mandatory for lead routing & dispatch */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Area Pincode *
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white tracking-widest"
                    placeholder="e.g. 302001"
                    required
                  />
                  {pincode.length === 6 && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                <p className="text-[10px] font-bold text-zinc-400 ml-1">Required for technician dispatch &amp; service area check</p>
              </div>

              {/* COMPETITOR QUOTE UPLOAD */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest ml-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  We Beat Competitor Quotes (Optional)
                </label>
                <div className="relative group border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCompetitorQuote(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    {competitorQuote ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">{competitorQuote.name}</span>
                        <span className="text-[10px] text-zinc-500 font-medium">Click to change file</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">Upload existing quotation</span>
                        <span className="text-[10px] text-zinc-500 font-medium">PDF, JPG, PNG (Max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Send OTP via</label>
                 <div className="flex flex-wrap gap-4">
                    <div className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                      <Phone className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">SMS</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-300 dark:text-zinc-700 relative overflow-hidden">
                      <Phone className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">WhatsApp</span>
                      <span className="absolute top-1 right-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">Soon</span>
                    </div>
                 </div>
              </div>

              <button 
                type="submit"
                disabled={loading || isUploading}
                className="w-full h-16 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
              >
                {loading || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{isIndustrial ? "Request Corporate Consultation" : "Generate Elite Quote"} <ArrowRight className="w-4 h-4" /></>}
              </button>

              {otpSent && (
                <button 
                  type="button"
                  onClick={() => { setOtpSent(true); }}
                  className="w-full mt-6 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline text-center pointer-events-auto relative z-[100]"
                >
                  Already have a verification code?
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-10 text-center">
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 font-medium mb-1">Authorization code sent to</p>
                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  +91 {mobile}
                </p>
              </div>
              
              <div className="flex justify-between gap-3">
                 {otp.map((digit, i) => (
                   <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-12 h-16 text-center text-2xl font-black text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                   />
                 ))}
              </div>

              <button 
                type="submit"
                disabled={loading || isUploading || otp.join("").length !== 6}
                className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
              >
                {loading || isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Access Proposal"}
              </button>
              
              <div className="flex flex-col gap-6 items-center pt-4">
                <button 
                  type="button" 
                  disabled={!canResend || loading}
                  onClick={handleSendOtp}
                  className={`text-xs font-black uppercase tracking-[0.1em] transition-all ${countdown > 0 ? "text-zinc-400" : "text-blue-600 dark:text-blue-400 hover:underline hover:scale-105 active:scale-95"}`}
                >
                  {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Security Code"}
                </button>

                <button 
                  type="button" 
                  onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); setCountdown(0); }}
                  className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest hover:underline"
                >
                  Modify Contact Details
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
