"use client";

import { useState } from "react";
import { Settings2, Save, User, Mail, Smartphone, Activity, BadgeDollarSign, Loader2, ShieldCheck, CheckCircle, Clock } from "lucide-react";
import type { Installer } from "@/types";
import { useRouter } from "next/navigation";

interface InstallerProfileClientProps {
  initialProfile: Partial<Installer>;
}

export function InstallerProfileClient({ initialProfile }: InstallerProfileClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: initialProfile.name || "",
    email: initialProfile.email || "",
    mobile_number: initialProfile.mobile_number || "",
    bank_account: initialProfile.bank_account || "",
    bank_ifsc: initialProfile.bank_ifsc || "",
  });

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/installer/me", {
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
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-indigo-500" />
          </div>
          Installer Profile
        </h1>
        <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">
          Manage your personal details and payout accounts. Bank details must be verified by admin after updating.
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
                    email: initialProfile.email || "",
                    mobile_number: initialProfile.mobile_number || "",
                    bank_account: initialProfile.bank_account || "",
                    bank_ifsc: initialProfile.bank_ifsc || "",
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
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-bold"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-bold"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-bold"
                />
              </div>
            </div>

          </div>
        </div>
        
        {/* Bank details section */}
        <div className="p-6 lg:p-8 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Payout Account (Bank Details)</h2>
            {initialProfile.bank_account_verified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Verified
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Account Number</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.bank_account}
                onChange={(e) => setFormData({...formData, bank_account: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-bold font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">IFSC Code</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({...formData, bank_ifsc: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-bold font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">Performance & Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-indigo-500" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">SLA Score</span>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {initialProfile.sla_score}/100
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Avg Rating</span>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {initialProfile.avg_rating?.toFixed(1) || "N/A"}
              </p>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Jobs Completed</span>
              </div>
              <p className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {initialProfile.jobs_completed}
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
