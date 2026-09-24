"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, Loader2, CheckCircle2, ChevronRight, User } from "lucide-react";
import { toast } from "sonner";

export function OnboardingClient() {
  const router = useRouter();
  
  const [panNumber, setPanNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [kycData, setKycData] = useState<{ valid: boolean; name: string } | null>(null);
  
  const [gstNumber, setGstNumber] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-trigger when PAN is 10 chars
  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
    setPanNumber(val);

    if (val.length === 10) {
      verifyPan(val);
    } else {
      setKycData(null);
    }
  };

  const verifyPan = async (pan: string) => {
    try {
      setIsVerifying(true);
      const res = await fetch("/api/auth/kyc/verify-pan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pan_number: pan })
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid) {
        setKycData({ valid: true, name: data.registeredName });
        toast.success("Identity Verified Successfully!");
      } else {
        setKycData({ valid: false, name: "" });
        toast.error(data.error || data.message || "Invalid PAN Number");
      }
    } catch (e) {
      toast.error("Verification Service Error");
      setKycData({ valid: false, name: "" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!kycData || !kycData.valid) {
      toast.error("Please provide a valid PAN number first.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/auth/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalName: kycData.name,
          panNumber,
          gstNumber
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Profile Setup Complete!");
        router.push(data.redirectUrl);
      } else {
        toast.error(data.error || "Failed to complete onboarding");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      
      {/* Header */}
      <div className="bg-zinc-900 px-8 py-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-bl-[100px] -z-10" />
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10 backdrop-blur-md">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white">Complete Your Profile</h1>
        <p className="text-zinc-400 text-sm mt-2 font-medium">
          You have been invited to join the platform. Please verify your identity to activate your account.
        </p>
      </div>

      {/* Form Area */}
      <div className="p-8 space-y-6">
        
        {/* PAN Input (The trigger) */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
            <span>Permanent Account Number (PAN) <span className="text-red-500">*</span></span>
            {isVerifying && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </label>
          <div className="relative">
            <input 
              type="text" 
              value={panNumber}
              onChange={handlePanChange}
              placeholder="ABCDE1234F"
              className={\`w-full px-4 py-3 rounded-xl border-2 font-bold tracking-widest uppercase transition-all outline-none 
                \${kycData?.valid ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 
                  kycData?.valid === false ? 'border-red-500 bg-red-50 text-red-900' : 
                  'border-gray-200 focus:border-zinc-900'}\`}
              disabled={kycData?.valid} // Lock it if successful!
            />
            {kycData?.valid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-emerald-100 px-2 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Verified</span>
              </div>
            )}
            {kycData?.valid === false && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-red-100 px-2 py-1 rounded-md">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-red-700">Invalid</span>
              </div>
            )}
          </div>
        </div>

        {/* Locked Official Name */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Official Legal Name</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              value={kycData?.name || ""}
              readOnly
              placeholder="Auto-filled via Govt Database"
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 font-bold text-gray-900 cursor-not-allowed"
            />
          </div>
          <p className="text-xs font-bold text-gray-400 flex items-center gap-1 mt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            This prevents fraud and ensures your TDS filings match exactly.
          </p>
        </div>

        {/* Optional GST */}
        <div className="space-y-2 pt-4 border-t">
          <label className="text-sm font-bold text-gray-700">GST Number (Optional)</label>
          <input 
            type="text" 
            value={gstNumber}
            onChange={e => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
            placeholder="22AAAAA0000A1Z5"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-zinc-900 font-bold tracking-widest outline-none transition-all"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!kycData?.valid || isSubmitting}
          className="w-full mt-4 bg-zinc-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Activate Account
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

      </div>
    </div>
  );
}
