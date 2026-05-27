"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWizardStore } from "@/store/wizard";
import {
  ShieldCheck, Phone, User, CheckCircle2, Loader2,
  ArrowRight, Mail, UploadCloud, MapPin, ChevronDown
} from "lucide-react";
import { trackEvent } from "@/components/shared/TrackingProvider";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Lead Capture Gate — Server-Side OTP Edition
 * Uses /api/send-otp + /api/verify-otp (Firestore-backed, Fast2SMS delivery).
 * No Firebase Phone Auth, no reCAPTCHA, no domain restriction issues.
 */
export function LeadGate({
  isIndustrial,
  mode = "final",
  onSuccess,
}: {
  isIndustrial?: boolean;
  mode?: "final" | "partial";
  onSuccess?: (leadId: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { answers, setPartialLeadId } = useWizardStore();

  // ── Field state ────────────────────────────────────────────────────────────
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState(searchParams.get("pincode") || "");
  const [email, setEmail] = useState("");
  const [showIndustrialSuccess, setShowIndustrialSuccess] = useState(false);

  const [competitorQuote, setCompetitorQuote] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── OTP state ──────────────────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // ── Pincode city auto-detection ────────────────────────────────────────────
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    if (pincode.length !== 6) { setDetectedCity(null); return; }
    const timer = setTimeout(async () => {
      setPincodeLoading(true);
      setDetectedCity(null);
      try {
        const res = await fetch(`/api/pincode/${pincode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.district) setDetectedCity(`${data.district}, ${data.state}`);
        }
      } catch { /* fail silently */ }
      finally { setPincodeLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [pincode]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (countdown === 0 && otpSent) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, otpSent]);

  // ── Auto-focus first OTP input when step 2 appears ─────────────────────────
  useEffect(() => {
    if (otpSent) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [otpSent]);

  // ── SEND OTP (server-side, no Firebase) ───────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(mobile))
      return setError("Enter a valid 10-digit Indian mobile number (starts with 6–9).");
    if (name.length < 2)
      return setError("Please enter your full name (minimum 2 characters).");
    if (!/^\d{6}$/.test(pincode))
      return setError("Enter your 6-digit area pincode — required for dispatch routing.");

    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, email: email || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP. Please try again.");
        return;
      }

      setOtpSent(true);
      setCountdown(30);
      setCanResend(false);

      // If SMS wasn't delivered, show a helpful notice
      if (!data.smsSent) {
        setError(
          data.deliveryMethod === "resend_email"
            ? "Code sent to your email (SMS unavailable). Check your inbox."
            : "⚠️ SMS gateway not configured. Please WhatsApp us at +91-XXXXXXXXXX or call for your code."
        );
      }

      // WebOTP API auto-fill support
      if (typeof window !== "undefined" && "OTPCredential" in window) {
        setTimeout(async () => {
          try {
            const ac = new AbortController();
            const cred = await navigator.credentials.get({
              otp: { transport: ["sms"] },
              signal: ac.signal,
            } as any) as any;
            const code = cred.code.replace(/\D/g, "");
            if (code.length === 6) {
              setOtp(code.split(""));
              setTimeout(() => handleVerifyOtp(), 500);
            }
          } catch { /* silent */ }
        }, 10);
      }
    } catch {
      setError("Network error — please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── VERIFY OTP (server-side) ───────────────────────────────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setError("Please enter the complete 6-digit code.");

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, code: fullOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        setError(data.error || "Incorrect code. Please try again.");
        return;
      }

      // OTP verified — create the lead
      await finalizeLead(`verified_${mobile}_${Date.now()}`);
    } catch {
      setError("Network error — please check your connection and retry.");
    } finally {
      setLoading(false);
    }
  };

  // ── FINALIZE LEAD ─────────────────────────────────────────────────────────
  const finalizeLead = async (verificationId: string) => {
    try {
      const extractAns = (qId: string) => {
        const val = answers[qId];
        if (Array.isArray(val)) return val[0] || "";
        return val || "";
      };

      let competitorQuoteUrl: string | undefined;
      if (competitorQuote) {
        setIsUploading(true);
        try {
          const timestamp = Date.now();
          const ext = competitorQuote.name.split(".").pop() || "pdf";
          const storageRef = ref(storage, `competitor_quotes/${verificationId}_${timestamp}.${ext}`);
          await uploadBytes(storageRef, competitorQuote);
          competitorQuoteUrl = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error("File upload failed, proceeding without it", uploadError);
        }
        setIsUploading(false);
      }

      const payload = {
        customer_name: name,
        mobile_number: mobile,
        email: email || undefined,
        firebase_uid: verificationId,
        wizard_answers: { ...answers, lead_pincode: pincode },
        property_type: extractAns("q_prop_type") || "home",
        technology_choice: extractAns("q_tech") || "HD",
        cabling_done: extractAns("q_wiring") === "true",
        camera_count: parseInt(extractAns("q_cam_count") || "0"),
        competitor_quote_url: competitorQuoteUrl,
        status: mode === "partial" ? "partial" : undefined,
      };

      if (isIndustrial) {
        const indRes = await fetch("/api/leads/industrial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: mobile,
            requested_camera_count: payload.camera_count,
            property_type: payload.property_type,
            technology: payload.technology_choice,
            consent: true,
          }),
        });
        if (!indRes.ok) throw new Error("Failed to register industrial interest.");
        setShowIndustrialSuccess(true);
        if (mode === "partial" && onSuccess) onSuccess("industrial");
        return;
      }

      const createRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await createRes.json();
      if (!createRes.ok) throw new Error(resData.error || "Server Synchronization Failed.");

      trackEvent("generate_lead", {
        customer_name: name,
        property_type: payload.property_type,
        technology_choice: payload.technology_choice,
        cabling_done: payload.cabling_done,
        mode,
      });

      if (mode === "partial") {
        setPartialLeadId(resData.data.id);
        if (onSuccess) onSuccess(resData.data.id);
      } else {
        router.push(`/quote/${resData.data.id}`);
      }
    } catch (error) {
      const err = error as Error;
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-3xl animate-in fade-in duration-500">

      {showIndustrialSuccess ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-2xl rounded-[32px] sm:rounded-[40px] w-full max-w-lg p-8 sm:p-12 text-center animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-[32px] bg-blue-600 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4 uppercase">
            Verification <br /> Successful
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-relaxed mb-10">
            As your requirement exceeds 16 cameras, we provide custom corporate-grade quotations. <br /><br />
            <span className="text-zinc-900 dark:text-white font-black">Our technical team will call you within 2 hours</span>{" "}
            to understand your site requirements.
          </p>
          <Link
            href="/"
            className="w-full h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20"
          >
            Return Home
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_30px_70px_rgba(0,0,0,0.2)] rounded-[32px] sm:rounded-[40px] w-full max-w-lg p-5 sm:p-8 md:p-12 relative overflow-y-auto max-h-[94dvh] sm:max-h-[90vh] transition-all">

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${!otpSent ? "bg-blue-600 text-white" : "bg-emerald-500 text-white"}`}>
                {!otpSent ? "1" : <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${otpSent ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}`}>
                2
              </div>
            </div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Step {otpSent ? "2" : "1"} of 2
            </span>
          </div>

          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest mb-4 border border-emerald-100 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              {isIndustrial ? "Industrial Inquiry" : "Configuration Finalized"}
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.9] mb-3">
              {otpSent
                ? "Enter Your Code"
                : isIndustrial ? "Corporate Setup" : "Unlock Your Proposal"}
            </h2>
            <p className="text-zinc-400 dark:text-zinc-500 font-medium text-sm sm:text-base leading-snug">
              {otpSent
                ? `6-digit code sent to +91 ${mobile}`
                : isIndustrial
                  ? "Enter your details to book an expert site visit."
                  : "One quick verification to access your itemized quote."}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl text-sm font-bold flex items-start gap-3" role="alert" aria-live="polite">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">

              {/* MOBILE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">
                  Contact Number *
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 dark:text-zinc-600 border-r border-zinc-200 dark:border-zinc-800 pr-3">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-16 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="98765 43210"
                    required
                  />
                  {mobile.length === 10 && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
              </div>

              {/* NAME */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">
                  Full Name *
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val.replace(/\b\w/g, (c) => c.toUpperCase()));
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
              </div>

              {/* PINCODE */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Area Pincode *
                </label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-10 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white tracking-widest"
                    placeholder="e.g. 302001"
                    required
                  />
                  {pincodeLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                  )}
                  {!pincodeLoading && pincode.length === 6 && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                  )}
                </div>
                {detectedCity && !pincodeLoading && (
                  <div className="flex items-center gap-2 mt-2 ml-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        ✓ Serving {detectedCity}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[10px] font-bold text-zinc-400 ml-1 mt-1">
                  Required for technician dispatch &amp; service area check
                </p>
              </div>

              {/* EMAIL */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">
                  Email Address{" "}
                  <span className="text-zinc-300 dark:text-zinc-700 normal-case font-medium">(optional)</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* COMPETITOR QUOTE */}
              <details className="group">
                <summary className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest cursor-pointer list-none select-none py-2">
                  <ShieldCheck className="w-3 h-3" />
                  We Beat Competitor Quotes — Upload Yours (Optional)
                  <ChevronDown className="w-3 h-3 ml-auto transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 relative group border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setCompetitorQuote(e.target.files[0]);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center gap-2 pointer-events-none">
                    {competitorQuote ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                          {competitorQuote.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">Click to change file</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          Upload existing quotation
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">PDF, JPG, PNG (Max 5MB)</span>
                      </>
                    )}
                  </div>
                </div>
              </details>

              {/* OTP CHANNEL — SMS only (WhatsApp coming soon) */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">
                  Send OTP via
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-400 transition-all touch-manipulation"
                    aria-pressed="true"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-black uppercase tracking-widest">SMS</span>
                  </button>
                  <div
                    className="flex-1 relative flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-300 dark:text-zinc-600 cursor-not-allowed overflow-hidden"
                    title="WhatsApp OTP — coming soon"
                    aria-disabled="true"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.529 5.845L.057 23.535a.75.75 0 0 0 .908.908l5.69-1.472A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.585-.49-5.088-1.348l-.362-.214-3.742.967.992-3.627-.233-.374A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                    </svg>
                    <span className="text-[11px] font-black uppercase tracking-widest">WhatsApp</span>
                    <span className="absolute top-1.5 right-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                      Soon
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 ml-1">
                  WhatsApp OTP delivery coming soon
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || isUploading}
                id="otp-send-btn"
                className="w-full h-14 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[20px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-2 touch-manipulation"
              >
                {loading || isUploading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>{isIndustrial ? "Request Corporate Consultation" : "Send Verification Code"} <ArrowRight className="w-4 h-4" /></>
                }
              </button>

              <p className="text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 mt-2">
                By continuing you agree to our{" "}
                <a href="/terms-of-service" className="underline hover:text-zinc-600">Terms</a> &amp;{" "}
                <a href="/privacy-policy" className="underline hover:text-zinc-600">Privacy Policy</a>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-8 text-center">
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 font-medium mb-1">
                  Authorization code sent via SMS to
                </p>
                <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  +91 {mobile}
                </p>
              </div>

              <div className="flex gap-2">
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
                    className="flex-1 min-w-0 h-12 sm:h-14 text-center text-xl font-black text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                id="otp-verify-btn"
                disabled={loading || otp.join("").length !== 6}
                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[20px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 touch-manipulation"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Access Proposal"}
              </button>

              <div className="flex flex-col gap-4 items-center pt-2">
                <button
                  type="button"
                  disabled={!canResend || loading}
                  onClick={() => handleSendOtp()}
                  className={`text-xs font-black uppercase tracking-[0.1em] transition-all touch-manipulation ${
                    countdown > 0
                      ? "text-zinc-400"
                      : "text-blue-600 dark:text-blue-400 hover:underline hover:scale-105 active:scale-95"
                  }`}
                >
                  {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Security Code"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(["", "", "", "", "", ""]); setCountdown(0); setError(""); }}
                  className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest hover:underline touch-manipulation"
                >
                  ← Change Contact Details
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
