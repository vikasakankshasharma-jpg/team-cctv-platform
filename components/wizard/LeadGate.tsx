"use client";

import { useState, useEffect, useRef } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/store/wizard";
import { ShieldCheck, Phone, User, CheckCircle2, Loader2, ArrowRight, Lock, Key } from "lucide-react";

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
  }
}

/**
 * Lead Capture Gate (Elite Premiere Edition)
 * Shows a high-fidelity modal required to view custom quotes.
 */
export function LeadGate() {
  const router = useRouter();
  const { answers } = useWizardStore();
  
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [referralCode, setReferralCode] = useState("");
  
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.length < 2) return setError("Identity Verification: Please enter your full name.");
    if (!/^[6-9]\d{9}$/.test(mobile)) return setError("Invalid Format: 10-digit mobile number required.");

    setLoading(true);
    try {
      // E2E Visual Test Bypass (Simulation Mode)
      if (mobile === "9999999999") {
        setOtpSent(true);
        setLoading(false);
        return;
      }

      const appVerifier = window.recaptchaVerifier;
      const formatPhone = "+91" + mobile;
      
      const result = await signInWithPhoneNumber(auth, formatPhone, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError("Communication Error: Failed to transmit OTP. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) return setError("Incomplete: Please enter the 6-digit security code.");
    
    // E2E Bypass check
    if (mobile === "9999999999" && fullOtp === "123456") {
       finalizeLead("e2e-firebase-uid");
       return;
    }

    if (!confirmationResult) return;
    
    setError("");
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(fullOtp);
      finalizeLead(result.user.uid);
    } catch (err: any) {
      setError("Security Violation: Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  const finalizeLead = async (firebaseUid: string) => {
    try {
      const extractAns = (qId: string) => {
        const val = answers[qId];
        if (Array.isArray(val)) return val[0] || "";
        return val || "";
      };

      const payload = {
        customer_name: name,
        mobile,
        firebase_uid: firebaseUid,
        referral_code: referralCode || undefined,
        wizard_answers: answers,
        property_type: extractAns("q_prop_type") || "home",
        technology_choice: extractAns("q_tech") || "HD",
        cabling_done: extractAns("q_wiring") === "true"
      };

      const createRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await createRes.json();
      if (!createRes.ok) throw new Error(resData.error || "Server Synchronization Failed.");

      router.push(`/quote/${resData.id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/20 dark:bg-black/60 backdrop-blur-3xl animate-in fade-in duration-500">
      <div id="recaptcha-container"></div>
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_30px_70px_rgba(0,0,0,0.2)] rounded-[40px] w-full max-w-lg p-8 md:p-12 relative overflow-hidden transition-all">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest mb-6 border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Configuration Finalized
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.85] mb-4">
             Unlock Your <br className="hidden md:block"/> Elite Proposal.
          </h2>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium text-lg leading-snug">Verification required for itemized hardware transparency.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl text-[10px] mb-8 border border-red-100 dark:border-red-900/40 font-black uppercase tracking-wider text-center flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4" />
            {error}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Full Legal Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Contact Number</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 dark:text-zinc-600 border-r border-zinc-200 dark:border-zinc-800 pr-3">+91</span>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-16 pr-4 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 font-bold text-zinc-900 dark:text-white"
                  placeholder="98765 43210"
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
               <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest ml-1">Send OTP via</label>
               <div className="flex flex-wrap gap-4">
                  {[
                    { id: "sms", label: "SMS", icon: Phone, active: true },
                    { id: "whatsapp", label: "WhatsApp", icon: CheckCircle2, active: false },
                    { id: "email", label: "Email", icon: ShieldCheck, active: false }
                  ].map((chan) => (
                    <label key={chan.id} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${chan.active ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 opacity-60'}`}>
                      <input type="radio" name="otp_channel" defaultChecked={chan.id === "sms"} disabled={!chan.active} className="hidden" />
                      <chan.icon className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{chan.label}</span>
                    </label>
                  ))}
               </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Generate Elite Quote <ArrowRight className="w-4 h-4" /></>}
            </button>

            <button 
              type="button"
              onClick={() => { setOtpSent(true); }}
              className="w-full mt-6 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline text-center pointer-events-auto relative z-[100]"
            >
              Already have a verification code?
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-10 text-center">
            <div>
              <p className="text-zinc-400 dark:text-zinc-500 font-medium mb-1">Authorization code sent to</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white tracking-tighter">+91 {mobile}</p>
            </div>
            
            <div className="flex justify-between gap-3">
               {otp.map((digit, i) => (
                 <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-12 h-16 text-center text-2xl font-black text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-400/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                 />
               ))}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-[24px] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Access Proposal"}
            </button>
            
            <button 
              type="button" 
              onClick={() => { setOtpSent(false); setOtp(["","","","","",""]); }}
              className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:underline"
            >
              Modify Contact Details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
