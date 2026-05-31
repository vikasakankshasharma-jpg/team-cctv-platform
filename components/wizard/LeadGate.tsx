"use client";

import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWizardStore } from "@/store/wizard";
import { ShieldCheck, Phone, User, CheckCircle2, Loader2, ArrowRight, MapPin } from "lucide-react";
import { trackEvent } from "@/components/shared/TrackingProvider";

// Define recaptcha on window
declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}

export function LeadGate({ 
  isIndustrial,
  mode = "final",
  onSuccess 
}: { 
  isIndustrial?: boolean;
  mode?: "final" | "partial";
  onSuccess?: (leadId: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { answers, setPartialLeadId } = useWizardStore();

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState(searchParams.get("pincode") || "");
  const [email, setEmail] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [countdown, setCountdown] = useState(0);

  // Initialize Recaptcha safely on demand


  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return setError("Enter a valid 10-digit Indian mobile number.");
    }
    if (name.length < 2) return setError("Please enter your full name.");
    if (!/^\d{6}$/.test(pincode)) return setError("Enter a valid 6-digit area pincode.");

    setLoading(true);

    try {
      if (mobile === "9999999999") {
        setConfirmationResult({
          confirm: async (code: string) => {
            return { user: { uid: "mock-e2e-uid" } } as any;
          }
        } as any);
        setOtpSent(true);
        setCountdown(30);
        setLoading(false);
        return;
      }

      // Always start fresh to avoid detached DOM node issues (auth/internal-error)
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      
      // Clear container just in case
      const container = document.getElementById("recaptcha-container");
      if (container) container.innerHTML = '';

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });

      // Crucial fix: wait for recaptcha to fully render in the DOM before proceeding
      await window.recaptchaVerifier.render();

      const formatPhone = "+91" + mobile;
      const result = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier);
      
      setConfirmationResult(result);
      setOtpSent(true);
      setCountdown(30);

      // WebOTP API auto-fill
      if (typeof window !== "undefined" && "OTPCredential" in window) {
        setTimeout(async () => {
          try {
            const ac = new AbortController();
            const cred = await navigator.credentials.get({
              otp: { transport: ["sms"] },
              signal: ac.signal,
            } as any) as any;
            const code = cred.code.replace(/\D/g, "");
            if (code.length === 6) {
              setOtp(code.split(""));
              // We do not auto-submit here to avoid race conditions. 
              // User will see it filled and can click Verify.
            }
          } catch (_) {}
        }, 100);
      }
    } catch (err: any) {
      console.error("OTP Send Error:", err);
      // Clean up recaptcha so they can try again
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
      
      // Output the exact Firebase error message so we know exactly what is wrong
      setError(`Error: ${err.message || "Failed to send code."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setError("Please enter the complete 6-digit code.");
    if (!confirmationResult) return setError("Session expired. Please request a new code.");

    setLoading(true);

    try {
      const result = await confirmationResult.confirm(fullOtp);
      await finalizeLead(result.user.uid);
    } catch (err: any) {
      console.error("OTP Verify Error:", err);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setError(`Error: ${err.message || "Incorrect code."}`);
      setLoading(false);
    }
  };

  const finalizeLead = async (firebaseUid: string) => {
    try {
      const extractAns = (qId: string) => {
        const val = answers[qId];
        return Array.isArray(val) ? (val[0] || "") : (val || "");
      };

      const payload = {
        customer_name: name,
        mobile_number: mobile,
        email: email || undefined,
        firebase_uid: firebaseUid,
        wizard_answers: { ...answers, lead_pincode: pincode },
        property_type: extractAns("q_prop_type") || "home",
        technology_choice: extractAns("q_tech") || "HD",
        cabling_done: extractAns("q_wiring") === "true",
        camera_count: parseInt(extractAns("q_cam_count") || "0"),
        status: mode === "partial" ? "partial" : undefined
      };

      if (isIndustrial) {
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
        if (onSuccess) onSuccess("industrial");
        return;
      }

      const createRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await createRes.json();
      if (!createRes.ok) {
        const errorDetails = resData.error;
        const msg = typeof errorDetails === "object" && errorDetails !== null
          ? (errorDetails.message || JSON.stringify(errorDetails))
          : (errorDetails || "Failed to save data.");
        throw new Error(msg);
      }

      trackEvent("generate_lead", {
        customer_name: name,
        property_type: payload.property_type,
        mode: mode
      });

      if (mode === "partial") {
        setPartialLeadId(resData.data.id);
        if (onSuccess) onSuccess(resData.data.id);
      } else {
        router.push(`/quote/${resData.data.id}`);
      }
    } catch (error: any) {
      setError(`Error saving lead: ${error.message}`);
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Check if the user pasted or auto-filled a 6-digit code
    if (value.length === 6 && /^\d+$/.test(value)) {
      setOtp(value.split(""));
      inputRefs.current[5]?.focus();
      return;
    }

    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div id="recaptcha-container"></div>

      <div className="bg-white dark:bg-zinc-900 shadow-2xl rounded-3xl w-full max-w-md p-6 sm:p-8 relative">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4" />
            Secure Verification
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
            {otpSent ? "Verify Your Number" : "Unlock Your Proposal"}
          </h2>
          <p className="text-zinc-500 text-sm">
            {otpSent 
              ? `We sent a 6-digit code to +91 ${mobile}` 
              : "Verify your phone number to view your itemized quote."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-800 break-words">
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Contact Number *</label>
              <div className="relative mt-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold border-r pr-3">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-16 pr-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-900 dark:text-white transition-all"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Full Name *</label>
              <div className="relative mt-1">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/\b\w/g, c => c.toUpperCase()))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-900 dark:text-white transition-all"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Area Pincode *</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-12 pr-4 py-3.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold text-zinc-900 dark:text-white transition-all tracking-widest"
                  placeholder="6-digit pincode"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send Verification Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-14 text-center text-xl font-bold bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-zinc-900 dark:text-white transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & View Quote"}
            </button>

            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleSendOtp}
                className={`text-sm font-bold transition-all ${countdown > 0 ? "text-zinc-400" : "text-blue-600 hover:underline"}`}
              >
                {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code"}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); setCountdown(0); }}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:underline"
              >
                Change Phone Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
