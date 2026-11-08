"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2, 
  Lock,
  MessageCircle,
  Clipboard,
  RotateCw
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken } from "firebase/auth";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { WhatsAppOtpNotice } from "@/components/shared/WhatsAppOtpNotice";
import { toast } from "sonner";

export function CustomerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/customer/dashboard";

  const [mobile, setMobile] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const otpRef = useRef<string[]>(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetEndTime, setTargetEndTime] = useState<number | null>(null);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Clock-based countdown: immune to browser tab background throttling
  useEffect(() => {
    if (step !== 2 || !targetEndTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setCanResend(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [step, targetEndTime]);

  // Request WhatsApp OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
    if (cleanMobile.length !== 10 || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch customer name if previously registered
      try {
        const checkRes = await fetch("/api/customer/auth/otp/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: cleanMobile }),
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData?.customerName) {
            setCustomerName(checkData.customerName);
          }
        }
      } catch (e) {
        // Non-blocking lookup
      }

      // 2. Dispatch 4-digit OTP via official WhatsApp API
      const res = await fetch("/api/auth/otp/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanMobile }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send WhatsApp OTP. Please try again.");
      }

      setStep(2);
      setTargetEndTime(Date.now() + 30000); // 30s fast cooldown
      setTimeLeft(30);
      setCanResend(false);
      setOtp(["", "", "", ""]);
      otpRef.current = ["", "", "", ""];
      toast.success("OTP sent to your WhatsApp.");

      // Auto-focus first input box
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error("WhatsApp OTP Send Error:", err);
      setError(err.message || "Failed to send WhatsApp OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent, explicitCode?: string) => {
    e?.preventDefault();
    const code = (typeof explicitCode === "string" && explicitCode.length === 4) ? explicitCode : otp.join("");
    if (code.length < 4) return;
    
    setError("");
    setLoading(true);
    try {
      const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
      const res = await fetch("/api/auth/otp/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanMobile, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP code. Please check your WhatsApp and try again.");
      }

      const customToken = data.customToken;

      // Final Firebase Custom Token Sign In & Session Cookie creation
      if (customToken && auth) {
        let idToken = "";
        if (customToken === "mock-custom-token") {
          idToken = "mock-jwt-token";
        } else {
          const userCredential = await signInWithCustomToken(auth, customToken);
          idToken = await userCredential.user.getIdToken(true);
        }

        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken, portal: "customer" }),
        });

        if (!sessionRes.ok) {
          const errData = await sessionRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to establish secure session. Please try again.");
        }

        toast.success("Welcome! Redirecting to your dashboard...");
        window.location.href = redirectTo;
      } else {
        throw new Error("Missing authentication token from server.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid OTP code. Please try again.");
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
    if (value !== "" && index < 3) {
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
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      otpRef.current = newOtp;
      if (pastedData.length === 4) {
        otpInputsRef.current[3]?.focus();
      } else {
        otpInputsRef.current[pastedData.length]?.focus();
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-6 md:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-600/5 dark:bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-[440px] relative z-10">
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
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm animate-in fade-in">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 text-center">
              <TranslatedText tKey="customer_login_title" defaultText="Customer Login" />
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium text-center">
              Enter your mobile number to receive your secure 4-digit code on WhatsApp.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  <TranslatedText tKey="registered_mobile_number" defaultText="WhatsApp Mobile Number" />
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
                    className="w-full pl-14 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-black text-zinc-900 dark:text-white text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 tracking-wider transition-all placeholder:text-zinc-400 placeholder:font-normal"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || mobile.replace(/\D/g, "").length !== 10}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-black py-3.5 sm:py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    <span>Get Code on WhatsApp</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setStep(1);
                setOtp(["", "", "", ""]);
                otpRef.current = ["", "", "", ""];
                setError("");
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Change phone number</span>
            </button>

            {customerName && customerName !== "Valued Customer" ? (
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Welcome back, <strong className="text-zinc-900 dark:text-white">{customerName}</strong>!
              </p>
            ) : null}

            <WhatsAppOtpNotice phone={mobile} />

            <form onSubmit={handleVerifyOtp} className="space-y-6 pt-2">
              {/* 4 Digit Input boxes */}
              <div className="flex justify-center gap-3 sm:gap-4">
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
                    className="w-14 sm:w-16 h-16 sm:h-18 text-center text-2xl sm:text-3xl font-black bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all shadow-sm"
                  />
                ))}
              </div>

              <div className="flex justify-center -mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      const clean = text.replace(/\D/g, "").slice(0, 4);
                      if (clean.length === 4) {
                        const arr = clean.split("");
                        setOtp(arr);
                        otpRef.current = arr;
// customer clicks verify button
                      }
                    } catch (e) {
                      console.warn("Clipboard read not supported:", e);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Paste 4-Digit Code
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                id="verify-btn"
                disabled={loading || otp.some((d) => d === "")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white font-black py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Access Dashboard</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Resend Action */}
              <div className="text-center pt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    <span>Resend WhatsApp Code</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 select-none">
                    <span>⏳ Resend code in {timeLeft}s</span>
                  </div>
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
