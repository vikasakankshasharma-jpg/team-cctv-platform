"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  CheckCircle2, 
  IndianRupee, 
  Gift, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  Share2, 
  Loader2, 
  ArrowLeft,
  Clock,
  ChevronRight
} from "lucide-react";
import { auth } from "@/lib/firebase-client";
import { signInWithCustomToken } from "firebase/auth";
import { toast } from "sonner";

export default function ReferAndEarnClient() {
  const router = useRouter();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP Countdown Timer
  useEffect(() => {
    if (step === "otp" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/refer-and-earn/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: cleanMobile,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code.");

      setStep("otp");
      setTimeLeft(60);
      toast.success("Verification code sent to your WhatsApp/SMS!");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Digit Change Handler
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Handle paste
      const digits = val.replace(/\D/g, "").slice(0, 4).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 4) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(digits.length, 3);
      inputRefs.current[nextIdx]?.focus();
      if (digits.length === 4) handleVerifyOtp(digits.join(""));
      return;
    }

    const digit = val.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "") && newOtp.join("").length === 4) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP, Auto-Create Promoter, Create Session
  const handleVerifyOtp = async (codeOverride?: string) => {
    const code = codeOverride || otp.join("");
    if (code.length !== 4) {
      setError("Please enter the complete 4-digit code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, "");
      const res = await fetch("/api/refer-and-earn/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          mobile: cleanMobile,
          otp: code,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid verification code.");

      // Sign in client Firebase SDK
      if (data.customToken) {
        await signInWithCustomToken(auth, data.customToken);
      }

      // Establish server session cookie
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        const sessionRes = await fetch("/api/partner/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!sessionRes.ok) throw new Error("Failed to initialize partner session.");
      }

      toast.success("Welcome aboard! Your referral account is ready.");
      router.push("/partner/dashboard");
      router.refresh();
    } catch (err: any) {
      console.error("[Refer & Earn Verify Error]", err);
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Navigation Bar */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            T
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white block leading-none">
              TEAM CCTV
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              Partner Network
            </span>
          </div>
        </Link>

        <Link
          href="/partner/login"
          className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          Already a partner? Log in <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Container */}
      <section className="max-w-6xl mx-auto px-4 pt-6 pb-20 lg:pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero & Value Proposition */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest animate-in fade-in">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Direct Cash Rewards Program
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.08]">
                Earn Flat <span className="text-emerald-600 dark:text-emerald-400">₹500 Cash</span> for Every CCTV Refer!
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-medium max-w-xl leading-relaxed">
                Recommend TEAM CCTV to friends, neighbors, or business owners. When their cameras are installed, you get <strong>₹500 cash directly to your bank account</strong>, and they get an instant <strong>₹500 discount</strong>.
              </p>
            </div>

            {/* Two-Way Incentive Highlight Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Your Reward
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    ₹500 Per Deal
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    No limits. 10 referrals = ₹5,000 take-home.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Your Friend's Benefit
                  </span>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    ₹500 Off Quote
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Instant discount applied at quotation checkout.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works 3-Step Strip */}
            <div className="pt-4 border-t border-slate-200 dark:border-zinc-800 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                Simple 3-Step Process
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-semibold">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <span>Get Your Referral Code</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-black">
                    2
                  </div>
                  <span>Share on WhatsApp</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-black">
                    3
                  </div>
                  <span>Receive ₹500 Payout</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Card */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative">
              
              {/* Badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                    Instant Activation
                  </span>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Zero Fees
                </span>
              </div>

              {step === "details" ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Start Earning Today
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      No business license or documentation required.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-[11px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                        Your Full Name
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                        WhatsApp Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                          +91
                        </span>
                        <input
                          required
                          type="tel"
                          maxLength={10}
                          placeholder="9876543210"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                          className="w-full pl-14 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-normal placeholder:text-slate-400"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
                        We will send a 4-digit code to verify your phone.
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !fullName || mobileNumber.length !== 10}
                    className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Get My Referral Code <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500">
                    By continuing, you agree to TEAM CCTV's Partner Terms of Service.
                  </p>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in">
                  <div>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-3"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to details
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      Verify Your Mobile
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      Enter the 4-digit code sent to <strong>+91 {mobileNumber}</strong>
                    </p>
                  </div>

                  {/* 4-digit OTP Inputs */}
                  <div className="flex justify-between gap-3">
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-14 h-16 text-center text-2xl font-black rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    ))}
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">
                      {error}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={loading || otp.join("").length !== 4}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Verify & Access Dashboard
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-xs font-bold pt-2">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {timeLeft > 0 ? `00:${timeLeft.toString().padStart(2, "0")}` : "Code expired"}
                    </span>
                    <button
                      type="button"
                      disabled={timeLeft > 0 || loading}
                      onClick={handleSendOtp}
                      className="text-blue-600 disabled:text-slate-400 disabled:cursor-not-allowed hover:underline"
                    >
                      Resend Code
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* Trust & Guarantee Strip */}
      <section className="bg-white dark:bg-zinc-900 border-y border-slate-200 dark:border-zinc-800 py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                Verified Direct Payouts
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Funds deposited directly into your bank account as soon as the project is marked won.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                WhatsApp Ready Tools
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Get pre-built shareable links and QR codes to share directly to contacts or stories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">
                100% Transparent Tracking
              </h4>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Track each customer's stage in real-time from survey to installation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
