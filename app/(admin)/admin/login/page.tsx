"use client";

import { useState, useEffect } from "react";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldAlert, ShieldCheck, Smartphone, Zap, BarChart2, Users, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

  const [method, setMethod] = useState<"email" | "mobile">("email");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
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
        setError("Mobile Verification is currently unavailable in this environment (App Check / Domain blocked). Please use the EMAIL option instead.");
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

      router.push(redirectTo);
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
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
    if (value && index === 5 && newOtp.every(v => v !== "")) {
      setTimeout(() => document.getElementById("verify-btn")?.click(), 50);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-500">

      {/* ── LEFT BRANDING PANEL ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900/50 shadow-2xl z-20">
        
        {/* Animated background orbs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-30%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* Top Logo/Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.3em]">TEAM CCTV</p>
              <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">Command Centre</p>
            </div>
          </div>
        </div>

        {/* Main Headline */}
        <div className="relative z-10">
          <h1 className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.88] mb-8">
            Intelligence<br/>
            <span className="text-blue-600 dark:text-blue-500 border-b-8 border-blue-600/10">Command</span><br/>
            Platform.
          </h1>
          <p className="text-zinc-400 dark:text-zinc-400 font-medium text-lg leading-relaxed max-w-xs">
            Real-time CRM, AI-assisted quotations, and sales analytics — all in one secured environment.
          </p>
        </div>

        {/* Feature Indicators */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: BarChart2, label: "Live Sales Intelligence", sub: "Real-time KPIs and trend analytics" },
            { icon: Users, label: "Referral Network CRM", sub: "Full promoter commission pipeline" },
            { icon: Zap, label: "Automated Quote Engine", sub: "IP & HD hardware topology calculator" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/30 transition-colors shrink-0 shadow-inner">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest leading-tight">{label}</p>
                <p className="text-[10px] font-medium text-zinc-300 dark:text-zinc-400 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        <div className="w-full max-w-sm relative z-10">
          
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/20 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shadow-inner">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-500" />
               </div>
               <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.3em]">Staff Access Portal</span>
            </div>
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight mb-2">Secure<br/>Sign In</h2>
            <p className="text-zinc-400 dark:text-zinc-400 font-medium text-sm">Authorized personnel only. All sessions are audited.</p>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-500 dark:text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3 mb-8 animate-in fade-in slide-in-from-top-4">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <div id="recaptcha-container"></div>
          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-[20px]">
                <button
                  type="button"
                  onClick={() => { setMethod("mobile"); setIdentifier(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "mobile" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("email"); setIdentifier(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "email" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"}`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
                  {method === "mobile" ? "Mobile Number" : "Email Address"}
                </label>
                <div className="relative">
                  {method === "mobile" ? (
                    <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-400" />
                  ) : (
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-400" />
                  )}
                  <input 
                    type={method === "mobile" ? "tel" : "email"}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-700 shadow-sm"
                    placeholder={method === "mobile" ? "9876543210" : "admin@example.com"}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !identifier}
                className="group relative w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-3xl transition-all disabled:opacity-40 mt-6 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Auth Code <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-8">
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-black bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-zinc-900 dark:text-white rounded-xl transition-all outline-none"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                </span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(["","","","","",""]); }}
                  disabled={timeLeft > 0 || loading}
                  className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest disabled:opacity-50 hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button 
                id="verify-btn"
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="group relative w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-3xl transition-all disabled:opacity-40 mt-6 shadow-xl shadow-blue-600/20 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Verify Securely"}
                </span>
              </button>
            </form>
          )}

          <p className="text-center text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest mt-8">
            End-to-end encrypted · Firebase Auth · Session-gated
          </p>
        </div>
      </div>
    </div>
  );
}

