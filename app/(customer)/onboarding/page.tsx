"use client";

import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, MapPin, User, Phone, Briefcase } from "lucide-react";
import Link from "next/link";
import { ApplyInstallerSchema, ApplyInstallerInput } from "@/lib/validators";

export default function InstallerOnboardingPage() {
  const [formData, setFormData] = useState<Partial<ApplyInstallerInput>>({
    name: "",
    mobile_number: "",
    company_name: "",
    primary_pincode: "",
    years_experience: 0,
    gstin: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError("");
    setErrors({});

    const validation = ApplyInstallerSchema.safeParse(formData);

    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(issue => {
        newErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/installers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");
      
      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Application Received!</h1>
        <p className="text-zinc-500 max-w-md mx-auto mb-8 font-medium">
          Thank you for applying to join the CCTVQuotation Installer Network. Our team will review your application and contact you shortly.
        </p>
        <Link href="/" className="px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-500/20">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-20 px-6 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/40 mb-6">
            <Building2 className="w-3 h-3" /> Partner Network
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tight mb-4">
            Installer Application
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium">
            Join the network and get verified CCTV installation jobs in your territory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          {serverError && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium border border-rose-100">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input required type="text" name="name" value={formData.name || ""} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="John Doe" />
              </div>
              {errors.name && <p className="text-xs text-rose-500 font-bold">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input required type="tel" name="mobile_number" value={formData.mobile_number || ""} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="9876543210" />
              </div>
              {errors.mobile_number && <p className="text-xs text-rose-500 font-bold">{errors.mobile_number}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Company / Shop Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" name="company_name" value={formData.company_name || ""} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="Optional" />
            </div>
            {errors.company_name && <p className="text-xs text-rose-500 font-bold">{errors.company_name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Primary Pincode *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input required type="text" name="primary_pincode" value={formData.primary_pincode || ""} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="e.g. 302001" />
              </div>
              {errors.primary_pincode && <p className="text-xs text-rose-500 font-bold">{errors.primary_pincode}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">Years of Exp. *</label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input required type="number" min="0" name="years_experience" value={formData.years_experience === undefined ? "" : formData.years_experience} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="2" />
              </div>
              {errors.years_experience && <p className="text-xs text-rose-500 font-bold">{errors.years_experience}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest ml-1">GSTIN Number</label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" name="gstin" value={formData.gstin || ""} onChange={handleChange} className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-blue-500 outline-none transition-all dark:text-white text-sm" placeholder="Optional" />
            </div>
            {errors.gstin && <p className="text-xs text-rose-500 font-bold">{errors.gstin}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Submitting..." : <>Submit Application <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-xs mt-6">
          By submitting this form, you agree to our <Link href="/terms-of-service" className="underline">Terms of Service</Link> and <Link href="/privacy-policy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
