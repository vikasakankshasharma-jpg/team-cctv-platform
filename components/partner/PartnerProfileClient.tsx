"use client";

import { useState } from "react";
import { Settings2, Save, User, Mail, Smartphone, Building, BadgeDollarSign, Loader2, ShieldCheck, FileText } from "lucide-react";
import type { Promoter } from "@/types";
import { useRouter } from "next/navigation";

interface PartnerProfileClientProps {
  initialProfile: Partial<Promoter>;
}

export function PartnerProfileClient({ initialProfile }: PartnerProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: initialProfile.name || "",
    business_name: initialProfile.business_name || "",
    email: initialProfile.email || "",
    mobile_number: initialProfile.mobile_number || "",
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/partner/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      
      setSuccess(true);
      setIsEditing(false);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-amber-500" />
          </div>
          Account Settings
        </h1>
        <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">
          Manage your personal details and business identity. Some fields are locked and require administrative approval to change.
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-sm font-bold">Profile updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl">
        
        <div className="p-6 lg:p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Personal Details</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: initialProfile.name || "",
                    business_name: initialProfile.business_name || "",
                    email: initialProfile.email || "",
                    mobile_number: initialProfile.mobile_number || "",
                  });
                }}
                disabled={saving}
                className="px-6 py-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Business Name</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text"
                  disabled={!isEditing}
                  value={formData.business_name}
                  onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="email"
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Mobile Number</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="tel"
                  disabled={!isEditing}
                  value={formData.mobile_number}
                  onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Commission Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Rate Type</span>
              </div>
              <p className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {initialProfile.use_global_commission ? "Global Slabs" : "Custom Rate"}
              </p>
              {!initialProfile.use_global_commission && (
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500 mt-2">
                  {initialProfile.discount_type === "percent" ? `${initialProfile.discount_value}%` : `₹${initialProfile.discount_value}`} per referral
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Referral Code</span>
              </div>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] font-mono">
                {initialProfile.referral_code}
              </p>
            </div>

          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-6 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Commission rates are managed by the administration team and cannot be modified here.
          </p>
        </div>

      </div>
    </div>
  );
}
