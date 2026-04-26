"use client";

import { useState } from "react";
import { Save, Settings2, Image as ImageIcon, Loader2, CheckCircle2, BadgePercent, Ruler, HardHat, MessageSquare, Zap } from "lucide-react";
import type { AppSettings } from "@/types";
import { updateSettings } from "@/app/actions/settings";
import Image from "next/image";

interface SettingsFormProps {
  initialSettings: AppSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState<AppSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);
    
    try {
      await updateSettings(formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section: Company Profile */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm group hover:border-blue-500/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20 shadow-inner">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Company Identity</h2>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Brand Branding & Assets</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Company Name</label>
              <input 
                required
                type="text" 
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold shadow-inner" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Brand Logo URL</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[20px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:border-blue-500/30 transition-all">
                  {formData.company_logo_url ? (
                    <Image 
                      src={formData.company_logo_url} 
                      alt="Logo" 
                      width={80}
                      height={80}
                      unoptimized={true}
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-zinc-300 dark:text-zinc-700" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    name="company_logo_url"
                    value={formData.company_logo_url || ""}
                    onChange={handleChange}
                    placeholder="https://your-domain.com/logo.png"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium shadow-inner" 
                  />
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 italic">Recommended: Transparent PNG, 512x512px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Pricing & Taxes */}
        <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm group hover:border-emerald-500/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-500 border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Pricing Engine</h2>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Taxation & Global Rates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">GST Compliance (%)</label>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-lg shadow-inner" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Global Wire Rate</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold">₹</span>
                <input 
                  required
                  type="number" 
                  name="wire_cost_per_meter"
                  value={formData.wire_cost_per_meter}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-10 pr-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black text-lg shadow-inner" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-[10px] font-bold uppercase tracking-wider">/ m</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Labor: Fitting Only</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold">₹</span>
                <input 
                  required
                  type="number" 
                  name="labor_fitting_only_rate"
                  value={formData.labor_fitting_only_rate}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-10 pr-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black shadow-inner" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-[9px] font-bold uppercase tracking-wider">/ Cam</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Labor: Full Wiring</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold">₹</span>
                <input 
                 required
                  type="number" 
                  name="labor_full_installation_rate"
                  value={formData.labor_full_installation_rate}
                  onChange={handleChange}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-10 pr-5 py-3.5 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-black shadow-inner" 
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 text-[9px] font-bold uppercase tracking-wider">/ Cam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Brand Tier Management */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm group hover:border-blue-500/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Brand Tier Management</h2>
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Control Profits & Display Names</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Budget Tier */}
            <div className="space-y-4 p-5 rounded-[24px] bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-zinc-300 animate-pulse" />
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-[9px]">Budget Tier (Value)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_budget_label"
                  value={formData.tier_budget_label}
                  onChange={handleChange}
                  placeholder="VALUE:"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-bold text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Multiplier <span className="text-blue-500">(0.85 = -15%)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_budget_multiplier"
                  value={formData.tier_budget_multiplier}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-black text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Recommended Tier */}
            <div className="space-y-4 p-5 rounded-[24px] bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest text-[9px]">Standard Tier (Professional)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_recommended_label"
                  value={formData.tier_recommended_label}
                  onChange={handleChange}
                  placeholder="PROFESSIONAL:"
                  className="w-full bg-white dark:bg-zinc-900 border border-blue-200/50 dark:border-blue-800/50 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-bold text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1">Multiplier <span className="text-zinc-500">(1.0 = Base)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_recommended_multiplier"
                  value={formData.tier_recommended_multiplier}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-zinc-900 border border-blue-200/50 dark:border-blue-800/50 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-black text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Premium Tier */}
            <div className="space-y-4 p-5 rounded-[24px] bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest text-[9px]">Elite Tier (Premium)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_premium_label"
                  value={formData.tier_premium_label}
                  onChange={handleChange}
                  placeholder="ELITE:"
                  className="w-full bg-white dark:bg-zinc-900 border border-indigo-200/50 dark:border-indigo-800/50 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-bold text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Multiplier <span className="text-blue-500">(1.25 = +25%)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_premium_multiplier"
                  value={formData.tier_premium_multiplier}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-zinc-900 border border-indigo-200/50 dark:border-indigo-800/50 text-zinc-900 dark:text-white rounded-xl px-4 py-2.5 outline-none transition-all font-black text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Communications */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm group hover:border-blue-500/20 transition-all">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-100 dark:border-blue-500/20 shadow-inner">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">WhatsApp Orchestration</h2>
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Automated Lead Communication Template</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Dynamic Message Payload</label>
            <textarea 
              required
              name="whatsapp_template"
              value={formData.whatsapp_template}
              onChange={handleChange}
              rows={8}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-[24px] px-6 py-5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-inner"
            />
          </div>
          
          <div className="lg:col-span-2 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[24px] space-y-6 shadow-inner">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest ml-1">Admin Notification Mobile</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 font-bold">+91</span>
                <input 
                  type="text" 
                  name="admin_notification_phone"
                  value={formData.admin_notification_phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notification_phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="97726 99395"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl pl-12 pr-5 py-3 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold shadow-sm" 
                />
              </div>
              <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 italic">Receives real-time alerts for new leads & bookings</p>
            </div>

            <h3 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest pt-2">Available Injection Tokens</h3>
            <div className="grid gap-3">
              {[
                { token: "{{customer_name}}", desc: "Lead full name" },
                { token: "{{company_name}}", desc: "Defined brand name" },
                { token: "{{total_amount}}", desc: "Final payable quote" },
                { token: "{{pdf_url}}", desc: "Dynamic cloud PDF link" }
              ].map((item) => (
                <div key={item.token} className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50 group/token shadow-sm">
                  <code className="text-xs font-black text-zinc-900 dark:text-white group-hover/token:text-blue-500 transition-colors uppercase tracking-widest">{item.token}</code>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Global System Settings */}
      <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl dark:shadow-2xl backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-wrap gap-8 items-center w-full md:w-auto">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Cache Performance (TTL)</label>
            <div className="relative">
              <input 
                required
                type="number" 
                name="pricing_cache_ttl_seconds"
                value={formData.pricing_cache_ttl_seconds}
                onChange={handleChange}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-2.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold w-32 shadow-inner" 
              />
              <span className="ml-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Seconds</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">Primary OTP Gateway</label>
            <select
              name="otp_provider"
              value={formData.otp_provider}
              onChange={handleChange}
              className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-2.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold h-[46px] appearance-none cursor-pointer pr-10 shadow-inner"
            >
                <option value="firebase_phone">Firebase Intelligence</option>
                <option value="other">Internal Mock Provider</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto justify-end">
          {showSuccess && (
            <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-6 py-3.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" />
              Sync Successful
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-300 dark:disabled:text-zinc-600 text-white px-10 py-4 rounded-[24px] font-black uppercase text-xs tracking-[0.25em] transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 group-hover:scale-125 transition-transform duration-300" />
            )}
            {isSubmitting ? "Orchestrating..." : "Publish Config"}
          </button>
        </div>
      </div>

    </form>
  );
}
