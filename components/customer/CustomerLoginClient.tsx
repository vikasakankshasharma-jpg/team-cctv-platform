"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Smartphone, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Lock 
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken } from "firebase/auth";
import { TranslatedText } from "@/components/shared/TranslatedText";

export function CustomerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/customer/dashboard";

  const [mobile, setMobile] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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

  // Request OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/otp/mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP. Please try again.");
      }

      setCustomerName(data.customerName || "");
      setStep(2);
      setTimeLeft(60);
      setCanResend(false);

      // Auto focus first OTP input box after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const code = otp.join("").trim();
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.replace(/\D/g, ""), otp: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please check your code.");
      }

      // Establish Firebase client authentication if available
      try {
        if (data.customToken && auth) {
          const userCredential = await signInWithCustomToken(auth, data.customToken);
          const idToken = await userCredential.user.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });
        }
      } catch (authErr) {
        console.warn("Client Firebase Auth sync note:", authErr);
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned && val !== "") return;

    const newOtp = [...otp];
    newOtp[index] = cleaned.slice(-1);
    setOtp(newOtp);

    // Auto advance to next box
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }

    // Auto trigger verify if 6th box is filled
    if (cleaned && index === 5 && newOtp.every((digit) => digit !== "")) {
      setTimeout(() => {
        handleVerifyOtp();
      }, 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      otpInputsRef.current[5]?.focus();
      setTimeout(() => handleVerifyOtp(), 100);
    } else {
      otpInputsRef.current[pasted.length]?.focus();
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl p-8 sm:p-10 relative">
        
        {/* Header Icon */}
        <div className="flex items-center justify-between mb-8">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            {step === 1 ? <Smartphone className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <TranslatedText tKey="customer_portal" defaultText="Customer Portal" />
          </span>
        </div>

        {/* Step 1: Mobile Input */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">
              <TranslatedText tKey="customer_login_title" defaultText="Welcome to Your Portal" />
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-medium">
              <TranslatedText 
                tKey="customer_login_subtitle" 
                defaultText="Enter your mobile number to view your quotations, download tax invoices, and track live installations." 
              />
            </p>

            <form onSubmit={handleSendOtp} className="space-y-5">
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
              We sent a 6-digit code to <strong className="text-zinc-900 dark:text-white">+91 {mobile}</strong>.
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
