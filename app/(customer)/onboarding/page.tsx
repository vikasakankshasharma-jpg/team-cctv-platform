"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, User, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { CreateInstallerSchema, CreateInstallerInput } from "@/lib/validators";

export default function InstallerOnboardingPage() {
  const [formData, setFormData] = useState<Partial<CreateInstallerInput>>({
    skills: []
  });
  const [pincodesString, setPincodesString] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setServerError(null);

    const pincodes = pincodesString
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length === 6 && /^\d+$/.test(p));

    // Validate
    const validation = CreateInstallerSchema.safeParse({
      ...formData,
      serviceable_pincodes: pincodes
    });

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        newErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/dealer/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || "Failed to submit application");

      setIsSuccess(true);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center shadow-xl">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-4">Application Received!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
            Thank you for applying to join the TEAM CCTV Verified Installer Network. Our dispatch team will review your application and contact you for KYC.
          </p>
          <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-md">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex">
      {/* Left Banner */}
      <div className="hidden lg:flex flex-col justify-between w-1/3 bg-zinc-950 dark:bg-zinc-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors mb-20">
             <ArrowRight className="w-4 h-4 rotate-180" /> Back
          </Link>
          <h1 className="text-4xl xl:text-5xl font-black mb-6 leading-tight tracking-tight">
            Become a <br/><span className="text-blue-500">Verified Installer</span>.
          </h1>
          <p className="text-zinc-400 font-medium leading-relaxed max-w-sm">
            Join our network to receive steady installation and service jobs directly in your serviceable area.
          </p>
        </div>

        <div className="relative z-10 border-t border-zinc-800 pt-8 mt-12">
          <div className="flex items-center gap-4 text-zinc-500 font-black uppercase tracking-widest text-xs">
            <ShieldCheck className="w-4 h-4" /> 
            <span>Verification Process</span>
          </div>
          <ul className="mt-6 space-y-4 text-sm font-medium text-zinc-400">
            <li className="flex gap-3">
              <span className="text-blue-500 font-black">01</span> Submit Details
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-600 font-black">02</span> Complete KYC Check
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-600 font-black">03</span> Receive Dispatch Jobs
            </li>
          </ul>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative">
        <div className="max-w-xl w-full">
          
          <div className="lg:hidden mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors mb-6">
              <ArrowRight className="w-4 h-4 rotate-180" /> Back
            </Link>
            <h1 className="text-3xl font-black tracking-tight">Installer Application</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {serverError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium">
                {serverError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
              />
              {errors.name && <p className="text-xs text-rose-500 font-bold">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> Mobile Number *
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.mobile_number || ""}
                  onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                />
                {errors.mobile_number && <p className="text-xs text-rose-500 font-bold">{errors.mobile_number}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@example.com"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium"
                />
                {errors.email && <p className="text-xs text-rose-500 font-bold">{errors.email}</p>}
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Serviceable Pincodes *
                </label>
                <textarea
                  placeholder="Enter the pincodes you can service, separated by commas (e.g. 302001, 302002)"
                  value={pincodesString}
                  onChange={(e) => setPincodesString(e.target.value)}
                  className="w-full h-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium resize-none"
                />
                {errors.serviceable_pincodes && <p className="text-xs text-rose-500 font-bold">{errors.serviceable_pincodes}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"} <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">
              By submitting, you agree to our Terms of Service & Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
