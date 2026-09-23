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
  MessageCircle
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { TranslatedText } from "@/components/shared/TranslatedText";

export function CustomerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/customer/dashboard";

  const [mobile, setMobile] = useState("");
  const [method, setMethod] = useState<"sms" | "whatsapp">("whatsapp");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRef = useRef<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
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
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
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
        // We use our mobile endpoint to lookup customer name first
        const res = await fetch("/api/customer/auth/otp/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanMobile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initiate SMS OTP.");
        
        setCustomerName(data.customerName || "");

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

      if (method === "sms") {
        // Firebase Phone Auth Verification
        const confirmationResult = (window as any).confirmationResult;
        if (!confirmationResult) throw new Error("Verification session expired. Please resend code.");
        
        const result = await confirmationResult.confirm(code);
        const idToken = await result.user.getIdToken();

        // Pass ID Token to our backend to upgrade claims
        const res = await fetch("/api/customer/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: mobile.replace(/\D/g, ""), otp: idToken, type: "mobile" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to verify session.");
        customToken = data.customToken;
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
      }

      // Final Firebase Custom Token Sign In
      if (customToken && auth) {
        let idToken = "";
        if (customToken === "mock-custom-token") {
            idToken = "mock-jwt-token"; // Bypass Firebase Client
        } else {
            const userCredential = await signInWithCustomToken(auth, customToken);
            idToken = await userCredential.user.getIdToken();
        }
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        window.location.href = redirectTo;
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/5 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20 text-white">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Secure<span className="text-blue-600">Easy</span>
            </span>
          </Link>
          <span className="mt-4 px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 shadow-sm">
            <Lock className="w-3 h-3" />
            <TranslatedText tKey="secure_portal" defaultText="Secure Portal" />
          </span>
        </div>

        {/* Step 1: Mobile Input */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 text-center">
              <TranslatedText tKey="customer_login_title" defaultText="Welcome to Your Portal" />
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium text-center">
              <TranslatedText 
                tKey="customer_login_subtitle" 
                defaultText="Enter your mobile number to view your quotations, download tax invoices, and track live installations." 
              />
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5">
              
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-[20px]">
                <button
                  type="button"
                  onClick={() => { setMethod("sms"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "sms" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"}`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> SMS OTP
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("whatsapp"); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-widest transition-all ${method === "whatsapp" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400"}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  <TranslatedText tKey="registered_mobile_number" defaultText="Mobile Number" />
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-zinc-400 font-black text-sm select-none">
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
                    className="w-full pl-14 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-zinc-900 dark:text-white text-base focus:ring-2 focus:ring-blue-600 focus:border-blue-600 tracking-wider transition-all placeholder:text-zinc-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mobile.length !== 10}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <TranslatedText tKey="sending_otp" defaultText="Sending OTP..." />
                  </>
                ) : (
                  <>
                    <TranslatedText tKey="get_otp" defaultText="Get OTP Code" />
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <TranslatedText tKey="change_number" defaultText="Change number" />
            </button>

            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
              <TranslatedText tKey="enter_verification_code" defaultText="Verify Security Code" />
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
              {customerName && customerName !== "Valued Customer" ? (
                <>Welcome back, <strong className="text-zinc-900 dark:text-white">{customerName}</strong>! </>
              ) : null}
              We sent a 6-digit code via {method === "sms" ? "SMS" : "WhatsApp"} to <strong className="text-zinc-900 dark:text-white">+91 {mobile}</strong>.
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
                    className="w-11 sm:w-13 h-14 sm:h-16 text-center text-xl sm:text-2xl font-black bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.some((d) => d === "")}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <TranslatedText tKey="verifying" defaultText="Verifying..." />
                  </>
                ) : (
                  <>
                    <TranslatedText tKey="access_dashboard" defaultText="Access Dashboard" />
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
                    className="text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 underline cursor-pointer"
                  >
                    <TranslatedText tKey="resend_otp" defaultText="Resend verification code" />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-zinc-400">
                    Resend code in {timeLeft}s
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400">
            Need help?{" "}
            <a href="tel:+917357612865" className="text-zinc-600 dark:text-zinc-300 font-bold hover:underline">
              Call Support: +91 73576 12865
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
