"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2, 
  Lock,
  MessageCircle,
  Briefcase
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { TranslatedText } from "@/components/shared/TranslatedText";

export function UnifiedLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState<"sms" | "whatsapp">("whatsapp");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRef = useRef<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    } else if (step === 2 && timeLeft === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, timeLeft]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initRecaptcha = () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        delete (window as any).recaptchaVerifier;
      }
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container-unified", {
          size: "invisible",
        });
      } catch (err) {
        console.error("Recaptcha init error:", err);
      }
    };

    const timer = setTimeout(initRecaptcha, 100);

    return () => {
      clearTimeout(timer);
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        delete (window as any).recaptchaVerifier;
      }
    };
  }, []);

  // Request OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      if (method === "sms") {
        // Unified Mobile Route Check
        const res = await fetch("/api/auth/otp/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanMobile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initiate SMS OTP.");
        
        setUserName(data.userName || "");

        // Trigger Firebase Phone Auth SMS
        const appVerifier = (window as any).recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, `+91${cleanMobile}`, appVerifier);
        (window as any).confirmationResult = confirmationResult;

      } else {
        // WhatsApp Meta API Flow
        const res = await fetch("/api/auth/otp/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: cleanMobile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send WhatsApp OTP.");
      }

      setStep(2);
      setTimeLeft(60);
      setCanResend(false);
      
      // Auto focus first OTP input box after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-app-credential" || err.message?.includes("invalid-app-credential")) {
        setError("Mobile SMS OTP unavailable in this environment. Please try WhatsApp.");
      } else {
        setError(err.message || "An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;
    
    setError("");
    setLoading(true);
    try {
      let customToken = "";
      let userRole = "";

      if (method === "sms") {
        // Firebase Phone Auth Verification
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) throw new Error("Verification session expired. Please resend code.");
        
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();

        // Pass ID Token to backend
        const res = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: mobile.replace(/\D/g, ""), otp: idToken, type: "mobile" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to verify session.");
        customToken = data.customToken;
        userRole = data.role;
      } else {
        // WhatsApp OTP Verification
        const res = await fetch("/api/auth/otp/whatsapp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: mobile.replace(/\D/g, ""), otp: code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid WhatsApp OTP.");
        customToken = data.customToken;
        userRole = data.role; // Assuming whatsapp/verify returns role. Let's make sure it does!
      }

      // Final Firebase Custom Token Sign In
      if (customToken && auth) {
        const userCredential = await signInWithCustomToken(auth, customToken);
        const idToken = await userCredential.user.getIdToken();
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });

        // Smart Redirect based on Role
        if (redirectTo) {
          window.location.href = redirectTo;
        } else if (userRole === "super_admin" || userRole === "admin" || userRole === "sales_staff") {
          window.location.href = "/admin";
        } else if (userRole === "partner") {
          window.location.href = "/partner/dashboard";
        } else if (userRole === "installer") {
          window.location.href = "/installer/dashboard";
        } else {
          window.location.href = "/";
        }

      } else {
        throw new Error("Missing authentication token");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    otpRef.current = newOtp;
    if (value !== "" && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      otpRef.current = newOtp;
      if (pastedData.length === 6) {
        otpInputsRef.current[5]?.focus();
      } else {
        otpInputsRef.current[pastedData.length]?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div id="recaptcha-container-unified"></div>
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/20 text-slate-900">
              <Briefcase className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Team<span className="text-blue-500">CCTV</span>
            </span>
          </Link>
          <span className="mt-4 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-blue-400 flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3 h-3" />
            <TranslatedText tKey="secure_portal" defaultText="Company Gateway" />
          </span>
        </div>

        {/* Step 1: Mobile Input */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 text-center">
              Staff & Partner Portal
            </h1>
            <p className="text-sm text-slate-400 mb-8 font-medium text-center">
              Authenticate securely to access your dashboard.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5">
              
              <div className="flex p-1 bg-slate-800 rounded-[20px] border border-slate-700/50">
                <button
                  type="button"
                  onClick={() => { setMethod("sms"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "sms" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> SMS OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("whatsapp"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "whatsapp" ? "bg-slate-700 text-white shadow-sm" : "text-slate-500"}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  <TranslatedText tKey="registered_mobile_number" defaultText="Registered Number" />
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-slate-500 font-black text-sm select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full pl-14 pr-4 py-3.5 bg-slate-950/50 border border-slate-700 rounded-2xl font-black text-white text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-wider transition-all placeholder:text-slate-600 placeholder:font-normal"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <TranslatedText tKey="sending_otp" defaultText="Requesting Access..." />
                  </>
                ) : (
                  <>
                    <TranslatedText tKey="get_otp" defaultText="Secure Login" />
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div>
            <button
              onClick={() => {
                setStep(1);
                setOtp(["", "", "", "", "", ""]);
                otpRef.current = ["", "", "", "", "", ""];
                setError("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <TranslatedText tKey="change_number" defaultText="Change number" />
            </button>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
              <TranslatedText tKey="enter_verification_code" defaultText="Verify Identity" />
            </h1>
            <p className="text-sm text-slate-400 mb-6 font-medium">
              {userName && userName !== "Valued Customer" ? (
                <>Welcome, <strong className="text-white">{userName}</strong>! </>
              ) : null}
              We sent a 6-digit code via {method === "sms" ? "SMS" : "WhatsApp"} to <strong className="text-white">+91 {mobile}</strong>.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* 6 Digit Input boxes */}
              <div className="flex justify-between gap-2 sm:gap-2.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className="w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black bg-slate-950/50 border-2 border-slate-700 rounded-2xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.some((d) => d === "")}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <TranslatedText tKey="verifying" defaultText="Authenticating..." />
                  </>
                ) : (
                  <>
                    <TranslatedText tKey="access_dashboard" defaultText="Enter Dashboard" />
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Resend Link */}
              <div className="text-center pt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs font-black text-blue-500 hover:text-blue-400 underline cursor-pointer"
                  >
                    <TranslatedText tKey="resend_otp" defaultText="Resend verification code" />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-500">
                    Resend code in {timeLeft}s
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            INTERNAL USE ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
