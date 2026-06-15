"use client";

import { useState, useEffect, useRef } from "react";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock, Mail, ShieldAlert, ShieldCheck, Smartphone, Zap,
  BarChart2, Users, ArrowRight, CheckCircle2, AlertCircle,
} from "lucide-react";

// ─── Animated Background Orbs ─────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-500/8 dark:bg-blue-500/12 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute top-1/2 -left-24 w-[400px] h-[400px] bg-indigo-500/6 dark:bg-indigo-500/10 rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
      <div className="absolute -bottom-32 right-1/4 w-[300px] h-[300px] bg-violet-500/5 dark:bg-violet-500/8 rounded-full blur-[80px] animate-[pulse_7s_ease-in-out_infinite_1s]" />
    </div>
  );
}

// ─── Dot Grid ────────────────────────────────────────────────────────────────
function DotGrid() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
      style={{
        backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

// ─── OTP Input Component ─────────────────────────────────────────────────────
function OtpInput({
  otp, onChange, onKeyDown, error,
}: {
  otp: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent) => void;
  error: boolean;
}) {
  return (
    <div className={`flex justify-between gap-2 ${error ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
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
            w-12 h-14 text-center text-xl font-black rounded-2xl
            bg-[var(--surface2)]
            border-2 transition-all outline-none
            text-white
            ${digit ? "border-[var(--gold)] shadow-[0_0_0_4px_var(--gold-dim)]" : "border-[var(--border)]"}
            ${error ? "border-red-500 bg-red-500/5" : "focus:border-[var(--gold)] focus:shadow-[0_0_0_4px_var(--gold-dim)]"}
          `}
        />
      ))}
    </div>
  );
}

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

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
        await signInWithCustomToken(auth, customToken);
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
        await signInWithCustomToken(auth, customToken);
      }
      const finalIdToken = await auth.currentUser?.getIdToken();
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: finalIdToken }),
      });
      if (!sessionRes.ok) throw new Error("Failed to create secure session.");
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

      <div className="min-h-screen flex bg-[var(--bg)] overflow-hidden transition-colors duration-500">

        {/* ── LEFT BRANDING PANEL ──────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden bg-gradient-to-br from-[var(--bg)] to-[var(--surface2)] z-20">

          {/* Orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-[var(--gold-dim)] rounded-full blur-[120px] animate-[pulse_6s_ease-in-out_infinite]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-[var(--gold-dim)] rounded-full blur-[100px] animate-[pulse_8s_ease-in-out_infinite_2s]" />
          </div>

          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
          />

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[var(--gold)] flex items-center justify-center shadow-md shadow-[var(--gold-dim)]">
                <ShieldCheck className="w-5 h-5 text-[#0A0E1A]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[var(--gold)] uppercase tracking-[0.35em]">TEAM CCTV</p>
                <p className="text-sm font-black text-white leading-none">Command Centre</p>
              </div>
            </div>
          </div>

          {/* Main Headline */}
          <div className="relative z-10">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-[1.2] md:leading-[1.1] mb-6">
              Intelligence<br />
              <span className="text-[var(--gold)] relative">Command
                <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--gold)] to-[#b0792e] rounded-full" />
              </span><br />
              Platform.
            </h1>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed max-w-xs">
              Real-time CRM, AI-assisted quotations, and sales analytics — all in one secured environment.
            </p>
          </div>

          {/* Features */}
          <div className="relative z-10 space-y-4">
            {[
              { icon: BarChart2, label: "Live Sales Intelligence", sub: "Real-time KPIs and trend analytics" },
              { icon: Users, label: "Referral Network CRM", sub: "Full promoter commission pipeline" },
              { icon: Zap, label: "Automated Quote Engine", sub: "IP & HD hardware topology calculator" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-xl bg-[var(--surface)] border border-white/10 flex items-center justify-center group-hover:border-[var(--gold)] group-hover:bg-[var(--gold-dim)] transition-all shrink-0">
                  <Icon className="w-4 h-4 text-[var(--gold)]" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-widest">{label}</p>
                  <p className="text-[10px] font-medium text-[var(--muted)] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ─────────────────────────────────────────────── */}
        <div className="flex-1 flex items-center justify-center p-8 relative bg-[var(--bg)]">
          <BackgroundOrbs />
          <DotGrid />

          <div className="w-full max-w-sm relative z-10">

            {/* Header */}
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[var(--gold-dim)] flex items-center justify-center border border-[var(--gold)] border-opacity-20">
                  <Lock className="w-4 h-4 text-[var(--gold)]" />
                </div>
                <span className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.3em]">Staff Access Portal</span>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter leading-tight mb-2">
                {step === 1 ? "Secure\nSign In" : "Verify\nIdentity"}
              </h2>
              <p className="text-[var(--muted)] font-medium text-sm">
                {step === 1 ? "Authorized personnel only. All sessions are audited." : `A 6-digit code was sent to your ${method}.`}
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-bold">Access granted! Redirecting...</span>
              </div>
            )}

            <div id="recaptcha-container" />

            {/* STEP 1 — Identifier */}
            {step === 1 && (
              <form onSubmit={handleSendCode} className="space-y-5">
                {/* Method Toggle */}
                <div className="flex p-1 bg-[var(--surface2)] rounded-2xl border border-[var(--border)]">
                  {(["mobile", "email"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMethod(m); setIdentifier(""); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all ${
                        method === m
                          ? "bg-[var(--surface3)] text-white shadow-md"
                          : "text-[var(--muted)] hover:text-white"
                      }`}
                    >
                      {m === "mobile" ? <Smartphone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                      {m}
                    </button>
                  ))}
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] ml-1">
                    {method === "mobile" ? "Mobile Number" : "Email Address"}
                  </label>
                  <div className="relative">
                    {method === "mobile"
                      ? <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      : <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                    }
                    <input
                      type={method === "mobile" ? "tel" : "email"}
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-[var(--surface2)] border-2 border-[var(--border)] hover:border-[var(--border2)] focus:border-[var(--gold)] focus:shadow-[0_0_0_4px_var(--gold-dim)] text-white rounded-2xl pl-11 pr-5 py-4 outline-none transition-all text-sm font-medium placeholder:text-[var(--muted)] shadow-sm"
                      placeholder={method === "mobile" ? "9876543210" : "admin@example.com"}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !identifier}
                  className="group relative w-full h-14 bg-[var(--gold)] hover:bg-[#c28630] text-[#0A0E1A] font-black uppercase text-[11px] tracking-[0.25em] rounded-2xl transition-all disabled:opacity-40 shadow-md shadow-[var(--gold-dim)] hover:shadow-md active:scale-[0.98] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><span>Send Auth Code</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    }
                  </span>
                </button>
              </form>
            )}

            {/* STEP 2 — OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleKeyDown} error={otpError} />

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold tabular-nums ${timeLeft < 30 ? "text-red-500" : "text-[var(--muted)]"}`}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")} remaining
                  </span>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    disabled={timeLeft > 0 || loading}
                    className="text-[10px] font-black text-[var(--gold)] uppercase tracking-widest disabled:opacity-40 hover:underline"
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  id="verify-btn"
                  type="submit"
                  disabled={loading || otp.join("").length < 6 || success}
                  className="group relative w-full h-14 bg-[var(--gold)] hover:bg-[#c28630] text-[#0A0E1A] font-black uppercase text-[11px] tracking-[0.25em] rounded-2xl transition-all disabled:opacity-40 shadow-md shadow-[var(--gold-dim)] hover:shadow-md active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : success
                        ? <><CheckCircle2 className="w-4 h-4" /> Access Granted</>
                        : "Verify Securely"
                    }
                  </span>
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)]">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">End-to-end encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface2)] border border-[var(--border)]">
                <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Firebase Auth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
