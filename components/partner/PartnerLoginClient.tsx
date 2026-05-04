"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Mail, Smartphone, ArrowRight, ArrowLeft, ShieldAlert, BadgeDollarSign, Target, Activity } from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export function PartnerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/partner/dashboard";

  const [method, setMethod] = useState<"email" | "mobile">("mobile");
  const [identifier, setIdentifier] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [partnerName, setPartnerName] = useState("");

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // Setup reCAPTCHA for mobile flow
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
        const res = await fetch("/api/partner/auth/otp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: identifier }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to send code.");
        setPartnerName(data.partnerName);
      } else {
        // Mobile flow
        const res = await fetch("/api/partner/auth/otp/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: identifier }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to initiate mobile verification.");
        setPartnerName(data.partnerName);

        // Call Firebase Phone Auth
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, data.e164Mobile, appVerifier);
        (window as any).confirmationResult = confirmationResult;
      }

      setStep(2);
      setTimeLeft(120);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/unauthorized-domain") {
        setError("Mobile login is restricted in the local environment. Please switch to Email login.");
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
        const res = await fetch("/api/partner/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp: code, type: "email" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid verification code.");
        customToken = data.customToken;
        await signInWithCustomToken(auth, customToken);
      } else {
        // Mobile flow: verify with Firebase client SDK first
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) throw new Error("Verification session expired. Please try again.");
        
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();

        // Send ID token to our backend to upgrade claims and get customToken
        const res = await fetch("/api/partner/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp: idToken, type: "mobile" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upgrade session.");
        customToken = data.customToken;
        await signInWithCustomToken(auth, customToken); // Sign in again with upgraded token
      }

      // Create Server Session
      const finalIdToken = await auth.currentUser?.getIdToken();
      const sessionRes = await fetch("/api/partner/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: finalIdToken }),
      });

      if (!sessionRes.ok) throw new Error("Failed to create secure session.");

      router.push(redirectTo);
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
    
    // Auto submit
    if (value && index === 5 && newOtp.every(v => v !== "")) {
      // Small timeout to allow state to update before submitting
      setTimeout(() => {
        document.getElementById("verify-btn")?.click();
      }, 50);
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
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-amber-600/5 dark:bg-amber-600/10 rounded-full blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-30%] right-[-20%] w-[500px] h-[500px] bg-orange-600/5 dark:bg-orange-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <BadgeDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">TEAM CCTV</p>
              <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">Partner Network</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.88] mb-8">
            Referral<br/>
            <span className="text-amber-500 dark:text-amber-400 border-b-8 border-amber-500/10">Growth</span><br/>
            Portal.
          </h1>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium text-lg leading-relaxed max-w-xs">
            Track your pipeline, monitor closed deals, and manage your commissions in real-time.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: Target, label: "Lead Tracking", sub: "Monitor the status of your referrals" },
            { icon: BadgeDollarSign, label: "Live Commissions", sub: "Instant updates on your earnings" },
            { icon: Activity, label: "Transparent Pipeline", sub: "Full visibility into won & lost deals" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:border-amber-500/30 transition-colors shrink-0 shadow-inner">
                <Icon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest leading-tight">{label}</p>
                <p className="text-[10px] font-medium text-zinc-300 dark:text-zinc-600 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <div id="recaptcha-container"></div>
        <div className="w-full max-w-sm relative z-10">
          
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-amber-500 transition-colors mb-8">
              <ArrowLeft className="w-3 h-3" /> Back to Website
            </Link>
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight mb-2">
              {step === 1 ? "Partner Access" : "Verify Identity"}
            </h2>
            <p className="text-zinc-400 dark:text-zinc-500 font-medium text-sm">
              {step === 1 
                ? "Enter your registered details to receive an access code." 
                : `Enter the code sent to ${identifier}`}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-500 dark:text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3 mb-8 animate-in fade-in slide-in-from-top-4">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

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
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  {method === "mobile" ? "Mobile Number" : "Email Address"}
                </label>
                <div className="relative">
                  {method === "mobile" ? (
                    <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
                  ) : (
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
                  )}
                  <input 
                    type={method === "mobile" ? "tel" : "email"}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-sm font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-700 shadow-sm"
                    placeholder={method === "mobile" ? "9876543210" : "partner@example.com"}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !identifier}
                className="group relative w-full h-16 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-3xl transition-all disabled:opacity-40 mt-6 shadow-xl shadow-amber-500/20 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send Code <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-6 animate-in fade-in slide-in-from-right-8">
              {partnerName && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl mb-6">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest leading-none">Welcome back</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{partnerName}</p>
                  </div>
                </div>
              )}

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
                    className="w-12 h-14 text-center text-xl font-black bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-zinc-900 dark:text-white rounded-xl transition-all outline-none"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                </span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(["","","","","",""]); }}
                  disabled={timeLeft > 0 || loading}
                  className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest disabled:opacity-50 hover:underline"
                >
                  Resend Code
                </button>
              </div>

              <button 
                id="verify-btn"
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="group relative w-full h-16 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-3xl transition-all disabled:opacity-40 mt-6 shadow-xl shadow-amber-500/20 active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Verify Securely"}
                </span>
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
