"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, Phone, CheckCircle2, Loader2, ArrowRight, X, Sparkles } from "lucide-react";

interface PhoneCaptureModalProps {
  pincode: string;
  onClose: () => void;
}

export function PhoneCaptureModal({ pincode, onClose }: PhoneCaptureModalProps) {
  const [step, setStep] = useState<"phone" | "otp" | "success">("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Verification Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && step === "otp") {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, step]);

  // 2. WebOTP auto-fill integration
  useEffect(() => {
    if (step !== "otp") return;

    // Check if WebOTP API is supported
    if (typeof window !== "undefined" && "OTPCredential" in window) {
      try {
        // Create an abort controller to prevent hanging background listeners
        const ac = new AbortController();
        abortControllerRef.current = ac;

        navigator.credentials
          .get({
            otp: { transport: ["sms"] },
            signal: ac.signal,
          } as any)
          .then((content) => {
            const credential = content as any;
            if (credential && credential.code) {
              const code = credential.code.replace(/\D/g, "");
              if (code.length === 6) {
                const otpArray = code.split("");
                setOtp(otpArray);
                // Trigger auto-submit with a small dynamic micro-delay
                setTimeout(() => handleAutoSubmit(otpArray), 400);
              }
            }
          })
          .catch((err) => {
            console.log("[WebOTP Debug]:", err);
          });
      } catch (e) {
        console.warn("[WebOTP Init Error]:", e);
      }
    }

    return () => {
      // Abort background credential listener if modal closes or step changes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Sends the OTP via the mock endpoint
  const sendOtpCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return setError("Enter a valid 10-digit Indian mobile number (starts with 6–9).");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to transmit verification code.");

      // In development, alert the code for local convenience
      if (process.env.NODE_ENV === "development" && data.devCode) {
        console.log(`%c[DEV MOCK OTP]: ${data.devCode}`, "color: #10B981; font-weight: bold; font-size: 14px;");
      }

      setStep("otp");
      setCountdown(30);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
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

  // Handles manual submission
  const handleVerifyAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setError("Please enter the complete 6-digit code.");

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/interest-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          mobile,
          code: fullOtp,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Verification failed.");

      setStep("success");
    } catch (err: any) {
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setError(err.message || "Incorrect code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handles WebOTP automatic submit without manual button clicks
  const handleAutoSubmit = async (otpArray: string[]) => {
    const fullOtp = otpArray.join("");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interest-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pincode,
          mobile,
          code: fullOtp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setStep("success");
    } catch (err: any) {
      setOtp(["", "", "", "", "", ""]);
      setError(err.message || "Auto-fill verification failed. Please enter code manually.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/40 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 shadow-2xl rounded-[32px] w-full max-w-md p-6 sm:p-8 relative overflow-hidden transition-all animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step 1: Phone Capture */}
        {step === "phone" && (
          <form onSubmit={sendOtpCode} className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold px-4.5 py-1.5 rounded-full text-[10px] uppercase tracking-widest mb-4 border border-indigo-100 dark:border-indigo-800">
                <Sparkles className="w-3.5 h-3.5" />
                Service Expansion
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none mb-3">
                Unlock Installation
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm">
                Enter your mobile number to authorize the lookup for PIN-code <strong className="text-zinc-900 dark:text-white font-bold">{pincode}</strong>.
              </p>
            </div>

            {error && (
              <div className="bg-red-500 text-white px-4 py-3 rounded-2xl text-xs font-bold text-center flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest ml-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 dark:text-zinc-600 border-r border-zinc-200 dark:border-zinc-800 pr-3">+91</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl pl-16 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 dark:focus:border-indigo-400 font-bold text-zinc-900 dark:text-white"
                  placeholder="98765 43210"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full h-13 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 touch-manipulation"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Verify Pincode <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyAndSave} className="space-y-6 text-center">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                Enter verification code sent to
              </p>
              <p className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                +91 {mobile}
              </p>
            </div>

            {error && (
              <div className="bg-red-500 text-white px-4 py-3 rounded-2xl text-xs font-bold text-center flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* OTP input boxes */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-13 text-center text-xl font-black text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all"
                />
              ))}
            </div>

            {/* WebOTP visual hint */}
            {typeof window !== "undefined" && "OTPCredential" in window && (
              <div className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Tap 'Allow' on pop-up to auto-fill
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-13 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 touch-manipulation"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>

            <div className="flex flex-col gap-3 items-center pt-2">
              <button
                type="button"
                disabled={!canResend || loading}
                onClick={() => sendOtpCode()}
                className={`text-xs font-black uppercase tracking-[0.1em] transition-all touch-manipulation ${
                  countdown > 0
                    ? "text-zinc-400"
                    : "text-indigo-600 dark:text-indigo-400 hover:underline"
                }`}
              >
                {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Security Code"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", "", "", ""]);
                  setCountdown(0);
                  setError("");
                }}
                className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:underline touch-manipulation mt-1"
              >
                ← Change Contact Details
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success Notification */}
        {step === "success" && (
          <div className="text-center py-4 space-y-6">
            <div className="w-16 h-16 rounded-[24px] bg-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase">
                Waitlist Confirmed!
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium text-xs sm:text-sm leading-relaxed px-2">
                We are not actively serving PIN-code <strong className="text-zinc-900 dark:text-white font-bold">{pincode}</strong> yet, but we are expanding fast! 
                <br/><br/>
                Your request has been registered. We will notify you immediately as soon as we start operations in your area.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full h-13 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-md touch-manipulation"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
