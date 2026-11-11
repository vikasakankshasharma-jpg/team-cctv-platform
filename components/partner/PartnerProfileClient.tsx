"use client";

import { useState } from "react";
import { Settings2, Save, User, Mail, Smartphone, Building, BadgeDollarSign, Loader2, ShieldCheck, FileText } from "lucide-react";
import type { Promoter } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

interface PartnerProfileClientProps {
  initialProfile: Partial<Promoter>;
}

export function PartnerProfileClient({ initialProfile }: PartnerProfileClientProps) {
  const { t } = useTranslation();
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
    pan_number: (initialProfile as any).bank_details?.pan_number || "",
    bank_account_no: (initialProfile as any).bank_details?.account_number || "",
    bank_ifsc: (initialProfile as any).bank_details?.ifsc_code || "",
    bank_beneficiary: (initialProfile as any).bank_details?.account_holder_name || "",
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
      if (!res.ok) throw new Error(data.error || t("inst_prof_update_err", "Failed to update profile."));
      
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
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Settings2 className="w-5 h-5 text-amber-500" />
          </div>
          {t("prt_prof_title", "Account Settings")}
        </h1>
        <p className="text-sm font-medium text-zinc-500 mt-2 max-w-lg">
          {t("prt_prof_sub", "Manage your personal details and business identity. Some fields are locked and require admin approval to change.")}
        </p>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{t("inst_prof_upd_ok", "Profile updated successfully.")}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] overflow-hidden shadow-xl dark:shadow-2xl">
        
        <div className="p-6 lg:p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{t("inst_prof_personal", "Personal Details")}</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2.5 h-auto whitespace-normal bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              {t("inst_prof_edit", "Edit Profile")}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    name: initialProfile.name || "",
                    business_name: initialProfile.business_name || "",
                    email: initialProfile.email || "",
                    mobile_number: initialProfile.mobile_number || "",
                    pan_number: (initialProfile as any).bank_details?.pan_number || (initialProfile as any).pan_number || "",
                    bank_account_no: (initialProfile as any).bank_details?.account_number || (initialProfile as any).bank_details?.account_no || "",
                    bank_ifsc: (initialProfile as any).bank_details?.ifsc_code || (initialProfile as any).bank_details?.ifsc || "",
                    bank_beneficiary: (initialProfile as any).bank_details?.account_holder_name || (initialProfile as any).bank_details?.beneficiary_name || "",
                  });
                }}
                disabled={saving}
                className="px-6 py-2.5 h-auto whitespace-normal text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors disabled:opacity-50"
              >
                {t("del_cancel", "Cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 h-auto whitespace-normal bg-amber-500 hover:bg-amber-400 text-white rounded-[14px] text-[10px] font-black uppercase tracking-[0.2em] transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Save className="w-3.5 h-3.5 shrink-0" />}
                {t("inst_prof_save", "Save Changes")}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("inst_prof_full_name", "Full Name")}</label>
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
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("prt_prof_biz_name", "Business Name")}</label>
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
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("inst_log_email_lbl", "Email Address")}</label>
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
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("inst_log_mob_lbl", "Mobile Number")}</label>
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

        {/* ── BANK DETAILS ────────────────────────────────────────────────── */}
        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 lg:p-8 bg-zinc-50/50 dark:bg-zinc-950/30">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-2">{t("prt_prof_bank_title", "Bank Details (Payouts)")}</h2>
          <p className="text-sm font-medium text-zinc-500 mb-6">{t("prt_prof_bank_sub", "Enter your bank details to receive automated commission payouts.")}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("prt_prof_acc_holder", "Account Holder Name")}</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.bank_beneficiary}
                onChange={(e) => setFormData({...formData, bank_beneficiary: e.target.value})}
                placeholder={t("prt_prof_acc_holder_ph", "Name on Bank Account")}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("inst_prof_acc_num", "Account Number")}</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.bank_account_no}
                onChange={(e) => setFormData({...formData, bank_account_no: e.target.value})}
                placeholder={t("prt_prof_acc_num_ph", "Bank Account Number")}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("inst_prof_ifsc", "IFSC Code")}</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({...formData, bank_ifsc: e.target.value.toUpperCase()})}
                placeholder="e.g. HDFC0001234"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold font-mono uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">{t("prt_prof_pan", "PAN Number")}</label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.pan_number}
                onChange={(e) => setFormData({...formData, pan_number: e.target.value.toUpperCase()})}
                placeholder="e.g. ABCDE1234F"
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 disabled:opacity-70 text-zinc-900 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm font-bold font-mono uppercase"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800/60 p-6 lg:p-8 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-6">{t("prt_prof_comm_cfg", "Commission Configuration")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <BadgeDollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("prt_prof_rate_type", "Rate Type")}</span>
              </div>
              <p className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                {initialProfile.use_global_commission ? t("prt_prof_global_slabs", "Global Slabs") : t("prt_prof_custom_rate", "Custom Rate")}
              </p>
              {!initialProfile.use_global_commission && (
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-500 mt-2">
                  {t("prt_prof_per_ref", "{val} per referral", {
                    val: initialProfile.discount_type === "percent" ? `${initialProfile.discount_value}%` : `₹${initialProfile.discount_value}`,
                  })}
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{t("prt_prof_ref_code", "Referral Code")}</span>
              </div>
              <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] font-mono">
                {initialProfile.referral_code}
              </p>
            </div>

          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-6 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            {t("prt_prof_admin_lock", "Commission rates are managed by the administration team and cannot be modified here.")}
          </p>
        </div>

      </div>
    </div>
  );
}
