"use client";

import { useState, useEffect } from "react";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Lock, Mail, ShieldCheck, Smartphone, Zap,
  BarChart2, Users, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

// ─── Animated Background Ambient Glow ──────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -right-32 w-[450px] h-[450px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 -left-28 w-[380px] h-[380px] bg-indigo-500/8 dark:bg-indigo-600/12 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute -bottom-24 right-1/4 w-[320px] h-[320px] bg-sky-500/8 dark:bg-cyan-500/10 rounded-full blur-[80px] animate-[pulse_7s_ease-in-out_infinite_1s]" />
    </div>
  );
}

// ─── Subtle Dot Grid ──────────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06]"
      style={{
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
  );
}

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OtpInput({
  otp, onChange, onKeyDown, error,
}: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  error: boolean;
}) {
  return (
    <div className={`flex justify-between gap-2.5 ${error ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className={`
            w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-2xl
            bg-slate-50 dark:bg-slate-900/90
            border-2 transition-all outline-none
            text-slate-900 dark:text-white
            ${digit 
              ? "border-blue-600 dark:border-blue-500 shadow-md shadow-blue-500/10" 
              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }
            ${error ? "border-red-500 bg-red-500/5 text-red-600" : "focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"}
          `}
        />
      ))}
    </div>
  );
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin/leads";

  const [method, setMethod] = useState<"email" | "mobile">("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [success, setSuccess] = useState(false);

  // Shake animation reset
  useEffect(() => {
    if (otpError) {
      const t = setTimeout(() => setOtpError(false), 500);
      return () => clearTimeout(t);
    }
  }, [otpError]);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (method === "email") {
        const res = await fetch("/api/auth/otp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send code.");
      } else {
        const res = await fetch("/api/auth/otp/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: identifier }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unauthorized mobile number.");
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, data.e164Mobile, appVerifier);
        (window as any).confirmationResult = confirmationResult;
      }
      setStep(2);
      setTimeLeft(120);
    } catch (err: any) {
      if (err.code === "auth/invalid-app-credential" || err.message?.includes("invalid-app-credential")) {
        setError("Mobile OTP unavailable in this environment. Please use Email.");
      } else if (err.code === "auth/internal-error" || err.message?.includes("internal-error")) {
        setError(`Firebase error: Ensure '${window.location.hostname}' is in Authorized Domains.`);
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;
    setError("");
    setLoading(true);
    try {
      let customToken = "";
      if (method === "email") {
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp: code, type: "email" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid verification code.");
        customToken = data.customToken;
        if (customToken !== "mock-custom-token") await signInWithCustomToken(auth, customToken);
      } else {
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) throw new Error("Verification session expired.");
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp: idToken, type: "mobile" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upgrade session.");
        customToken = data.customToken;
        if (customToken !== "mock-custom-token") await signInWithCustomToken(auth, customToken);
      }

      const finalIdToken = customToken === "mock-custom-token" 
        ? "mock-jwt-token" 
        : await auth.currentUser?.getIdToken(true);

      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: finalIdToken }),
      });
      
      if (!sessionRes.ok) {
        const errData = await sessionRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to establish secure session.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(redirectTo);
        router.refresh();
      }, 800);
    } catch (err: any) {
      console.error(err);
      setOtpError(true);
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    if (value && index === 5 && newOtp.every((v) => v !== "")) {
      setTimeout(() => document.getElementById("verify-btn")?.click(), 50);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <>
      {/* Shake keyframe injected globally */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>

      <div className="min-h-screen flex bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-500">

        {/* ── LEFT BRANDING PANEL ──────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[50%] xl:w-[52%] relative flex-col justify-between p-8 md:p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-slate-100 dark:from-[#0B101D] dark:via-[#0E1527] dark:to-[#070A12] border-r border-slate-200/80 dark:border-slate-800/80 z-20">

          {/* Glowing Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[420px] h-[420px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
          </div>

          {/* Grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
            style={{ 
              backgroundImage: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)", 
              backgroundSize: "40px 40px" 
            }}
          />

          {/* Brand Header */}
          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-3.5 group active:scale-95 transition-transform">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 text-white group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.3em]">TEAM CCTV</p>
                <p className="text-base font-black text-slate-900 dark:text-white leading-tight">Command Centre</p>
              </div>
            </Link>
          </div>

          {/* Main Headline */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.25em] mb-6">
              <Zap className="w-3.5 h-3.5" /> Enterprise Control Hub
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.12] mb-6">
              Intelligence<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-400 relative">
                Command
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-cyan-400 rounded-full" />
              </span><br />
              Platform.
            </h1>
            
            <p className="text-slate-600 dark:text-slate-300 font-medium text-base sm:text-lg leading-relaxed max-w-sm">
              Real-time CRM, AI-assisted quotations, and sales analytics — all in one unified secure environment.
            </p>
          </div>

          {/* Feature Badges */}
          <div className="relative z-10 space-y-3.5">
            {[
              { icon: BarChart2, label: "Live Sales Intelligence", sub: "Real-time KPIs and trend analytics" },
              { icon: Users, label: "Referral Network CRM", sub: "Full promoter commission pipeline" },
              { icon: Zap, label: "Automated Quote Engine", sub: "IP & HD hardware topology calculator" },
            ].map(({ icon: Icon, label, sub }) => (
              <div 
                key={label} 
                className="flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{label}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative bg-white dark:bg-[#070A12] overflow-y-auto">
          <BackgroundOrbs />
          <DotGrid />

          {/* Top Controls Header */}
          <div className="relative z-20 flex items-center justify-between w-full mb-6">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to CCTVQuotation</span>
            </Link>

            <ThemeToggle />
          </div>

          {/* Form Container */}
          <div className="w-full max-w-sm mx-auto my-auto relative z-10 py-6">

            {/* Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-500/30 mb-4 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-[0.25em]">Staff Access Portal</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {step === 1 ? "Secure Sign In" : "Verify Identity"}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {step === 1 ? "Authorized personnel only. All access sessions are logged." : `A 6-digit code was dispatched to your ${method}.`}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Access verified! Entering Command Centre...</span>
              </div>
            )}

            <div id="recaptcha-container" />

            {/* STEP 1 — Identifier */}
            {step === 1 && (
              <form onSubmit={handleSendCode} className="space-y-5">
                {/* Method Switcher */}
                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {(["mobile", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setIdentifier(""); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        method === m
                          ? "bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm font-bold"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      {m === "mobile" ? <Smartphone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {m}
                    </button>
                  ))}
                </div>

                {/* Input Field */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">
                    {method === "mobile" ? "Mobile Number" : "Email Address"}
                  </label>
                  <div className="relative">
                    {method === "mobile"
                      ? <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      : <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    }
                    <input
                      type={method === "mobile" ? "tel" : "email"}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/90 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-4 focus:ring-blue-500/10 text-slate-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 outline-none transition-all text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                      placeholder={method === "mobile" ? "9876543210" : "admin@example.com"}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={loading || !identifier}
                  className="group relative w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Auth Code</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2 — OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleKeyDown} error={otpError} />

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold tabular-nums ${timeLeft < 30 ? "text-red-500" : "text-slate-500 dark:text-slate-400"}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} remaining
                  </span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    disabled={timeLeft > 0 || loading}
                    className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider disabled:opacity-40 hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  id="verify-btn"
                  type="submit"
                  disabled={loading || otp.join("").length < 6 || success}
                  className="group relative w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Access Granted</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Securely</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(""); }}
                    className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    ← Change login method / number
                  </button>
                </div>
              </form>
            )}

            {/* Footer Badges */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Firebase Auth</span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="text-center pt-4 relative z-10">
            <p className="text-[11px] text-slate-400 dark:text-slate-600">
              © {new Date().getFullYear()} TEAM CCTV Command Centre. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
