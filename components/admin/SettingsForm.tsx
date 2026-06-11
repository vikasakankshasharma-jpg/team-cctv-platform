"use client";

import { useState } from "react";
import { Save, Settings2, Image as ImageIcon, Loader2, CheckCircle2, BadgePercent, Ruler, HardHat, MessageSquare, Zap } from "lucide-react";
import type { AppSettings } from "@/types";
import { updateSettings } from "@/app/actions/settings";
import Image from "next/image";
import { toast } from "sonner";

interface SettingsFormProps {
  initialSettings: AppSettings;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [formData, setFormData] = useState<AppSettings>({
    ...initialSettings,
    default_sla_operating_hours: initialSettings.default_sla_operating_hours || {
      start_time: "10:00",
      end_time: "18:00",
      days_off: [0] // Sunday
    }
  });
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
      toast.error("Error saving settings. Please try again.");
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

  const handleSlaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      default_sla_operating_hours: {
        ...prev.default_sla_operating_hours!,
        [name]: value
      }
    }));
  };

  const toggleDayOff = (dayIndex: number) => {
    setFormData(prev => {
      const days = prev.default_sla_operating_hours?.days_off || [];
      const newDays = days.includes(dayIndex) 
        ? days.filter(d => d !== dayIndex) 
        : [...days, dayIndex];
      return {
        ...prev,
        default_sla_operating_hours: {
          ...prev.default_sla_operating_hours!,
          days_off: newDays
        }
      };
    });
  };

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-700">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section: Company Profile */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Company Identity</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Brand Branding & Assets</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Company Name</label>
              <input 
                required
                type="text" 
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium shadow-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Brand Logo URL</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:border-primary/30 transition-all">
                  {formData.company_logo_url ? (
                    <Image 
                      src={formData.company_logo_url} 
                      alt="Logo" 
                      width={64}
                      height={64}
                      unoptimized={true}
                      className="w-full h-full object-contain p-2" 
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    name="company_logo_url"
                    value={formData.company_logo_url || ""}
                    onChange={handleChange}
                    placeholder="https://your-domain.com/logo.png"
                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium shadow-sm" 
                  />
                  <p className="text-[10px] font-medium text-muted-foreground italic">Recommended: Transparent PNG, 512x512px</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Pricing & Taxes */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-success/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Pricing Engine</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Taxation & Global Rates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">GST Compliance (%)</label>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Global Wire Rate</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <input 
                  required
                  type="number" 
                  name="wire_cost_per_meter"
                  value={formData.wire_cost_per_meter}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-medium uppercase tracking-wider">/ m</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Conduit Pipe Rate</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <input 
                  required
                  type="number" 
                  name="conduit_cost_per_meter"
                  value={formData.conduit_cost_per_meter || 20}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-medium uppercase tracking-wider">/ m</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Labor: Fitting Only</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <input 
                  required
                  type="number" 
                  name="labor_fitting_only_rate"
                  value={formData.labor_fitting_only_rate}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-medium shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">/ Cam</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Labor: Full Wiring</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                <input 
                 required
                  type="number" 
                  name="labor_full_installation_rate"
                  value={formData.labor_full_installation_rate}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-medium shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">/ Cam</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Brand Tier Management */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Brand Tier Management</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Control Profits & Display Names</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Budget Tier */}
            <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Budget Tier (Value)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_budget_label"
                  value={formData.tier_budget_label}
                  onChange={handleChange}
                  placeholder="VALUE:"
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 outline-none transition-all font-medium text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Multiplier <span className="text-primary">(0.85 = -15%)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_budget_multiplier"
                  value={formData.tier_budget_multiplier}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 outline-none transition-all font-semibold text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Recommended Tier */}
            <div className="space-y-4 p-5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider">Standard Tier (Pro)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_recommended_label"
                  value={formData.tier_recommended_label}
                  onChange={handleChange}
                  placeholder="PROFESSIONAL:"
                  className="w-full bg-background border border-primary/20 text-foreground rounded-lg px-3 py-2 outline-none transition-all font-medium text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider ml-1">Multiplier <span className="text-muted-foreground">(1.0 = Base)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_recommended_multiplier"
                  value={formData.tier_recommended_multiplier}
                  onChange={handleChange}
                  className="w-full bg-background border border-primary/20 text-foreground rounded-lg px-3 py-2 outline-none transition-all font-semibold text-sm shadow-sm"
                />
              </div>
            </div>

            {/* Premium Tier */}
            <div className="space-y-4 p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <h3 className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider">Elite Tier (Premium)</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-indigo-500/70 uppercase tracking-wider ml-1">Label Prefix</label>
                <input 
                  type="text" 
                  name="tier_premium_label"
                  value={formData.tier_premium_label}
                  onChange={handleChange}
                  placeholder="ELITE:"
                  className="w-full bg-background border border-indigo-500/20 text-foreground rounded-lg px-3 py-2 outline-none transition-all font-medium text-xs shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-indigo-500/70 uppercase tracking-wider ml-1">Multiplier <span className="text-primary">(1.25 = +25%)</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  name="tier_premium_multiplier"
                  value={formData.tier_premium_multiplier}
                  onChange={handleChange}
                  className="w-full bg-background border border-indigo-500/20 text-foreground rounded-lg px-3 py-2 outline-none transition-all font-semibold text-sm shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: High-Fidelity Logic (PDF Alignment) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-warning/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Technical Logic Alignment</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Real PDF Matching Parameters</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Max System Cameras</label>
              <input 
                type="number" name="max_supported_cameras" value={formData.max_supported_cameras} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Labor IP (/Cam)</label>
              <input 
                type="number" name="labor_ip_per_camera" value={formData.labor_ip_per_camera} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Labor HD (/Cam)</label>
              <input 
                type="number" name="labor_hd_per_camera" value={formData.labor_hd_per_camera} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Quote Validity (Days)</label>
              <input 
                type="number" name="quote_validity_days" value={formData.quote_validity_days} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cable: IP Copper</label>
              <input 
                type="number" name="cable_copper_coated_ip" value={formData.cable_copper_coated_ip} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cable: HD Copper</label>
              <input 
                type="number" name="cable_copper_coated_hd" value={formData.cable_copper_coated_hd} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cable: Pure Copper</label>
              <input 
                type="number" name="cable_pure_copper" value={formData.cable_pure_copper} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Connector: RJ45 (Per Pair)</label>
              <input 
                type="number" name="connector_rj45_cost" value={formData.connector_rj45_cost} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Connector: BNC/DC (Per Set)</label>
              <input 
                type="number" name="connector_bnc_dc_cost" value={formData.connector_bnc_dc_cost} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cable Overage (/mtr)</label>
              <input 
                type="number" name="cable_overage_per_mtr" value={formData.cable_overage_per_mtr} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Visit Charge</label>
              <input 
                type="number" name="visit_charge" value={formData.visit_charge} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">AMC 1 Year (%)</label>
              <input 
                type="number" name="amc_1yr_pct" value={formData.amc_1yr_pct} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">AMC 2 Year (%)</label>
              <input 
                type="number" name="amc_2yr_pct" value={formData.amc_2yr_pct} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">AMC 3 Year (%)</label>
              <input 
                type="number" name="amc_3yr_pct" value={formData.amc_3yr_pct} onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium" 
              />
            </div>
          </div>
        </div>

        {/* Section: Service Level Agreements (SLA) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-destructive/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive border border-destructive/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Service Level Agreements (SLA)</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Global Franchise Operating Hours</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Hours (24H Format)</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Opening Time</label>
                  <input 
                    type="time" 
                    name="start_time"
                    value={formData.default_sla_operating_hours?.start_time || "10:00"}
                    onChange={handleSlaChange}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 outline-none transition-all font-medium text-sm shadow-sm"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Closing Time</label>
                  <input 
                    type="time" 
                    name="end_time"
                    value={formData.default_sla_operating_hours?.end_time || "18:00"}
                    onChange={handleSlaChange}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 outline-none transition-all font-medium text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly Days Off</h3>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day, idx) => {
                  const isOff = formData.default_sla_operating_hours?.days_off.includes(idx);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDayOff(idx)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                        isOff 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: PDF Generation */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-primary/20 transition-all mt-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Settings2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">PDF Quotation Generator</h2>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Customize Downloadable Quotations</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">PDF Header Logo</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                name="pdf_logo_url"
                value={formData.pdf_logo_url || ""}
                onChange={handleChange}
                placeholder="Leave blank to use main brand logo"
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium shadow-sm" 
              />
              <p className="text-[10px] font-medium text-muted-foreground italic">Use a clean, high-resolution logo for PDFs</p>
            </div>
          </div>

          <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bank Details</h3>
            <div className="space-y-2">
              <textarea 
                name="bank_details"
                value={formData.bank_details || ""}
                onChange={handleChange}
                placeholder="A/c Name: TEAM CCTV\nA/c No: 5020...\nIFSC: HDFC...\nUPI ID: teamcctv@okhdfc"
                rows={5}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-xs leading-relaxed whitespace-pre-wrap transition-all shadow-sm"
              />
              <p className="text-[10px] font-medium text-muted-foreground italic">Printed on TAX INVOICE for payment collection.</p>
            </div>
          </div>
          
          <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Terms & Conditions</h3>
            <div className="space-y-2">
              <textarea 
                name="pdf_terms"
                value={formData.pdf_terms || ""}
                onChange={handleChange}
                placeholder="1. Prices valid for 7 days...\n2. 1-Year AMC included..."
                rows={5}
                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-xs leading-relaxed whitespace-pre-wrap transition-all shadow-sm"
              />
              <p className="text-[10px] font-medium text-muted-foreground italic">This text prints at the footer of every generated PDF</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Communications */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm group hover:border-primary/20 transition-all">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">WhatsApp Orchestration</h2>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Automated Lead Communication Template</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Dynamic Message Payload</label>
            <textarea 
              required
              name="whatsapp_template"
              value={formData.whatsapp_template}
              onChange={handleChange}
              rows={8}
              className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap transition-all shadow-sm"
            />
          </div>
          
          <div className="lg:col-span-2 bg-secondary/30 border border-border p-6 rounded-xl space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-primary uppercase tracking-wider ml-1">Admin Notification Mobile</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">+91</span>
                <input 
                  type="text" 
                  name="admin_notification_phone"
                  value={formData.admin_notification_phone || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notification_phone: e.target.value.replace(/\D/g, "") }))}
                  placeholder="97726 99395"
                  className="w-full bg-background border border-border text-foreground rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium shadow-sm" 
                />
              </div>
              <p className="text-[10px] font-medium text-muted-foreground italic">Receives real-time alerts for new leads & bookings</p>
            </div>

            <h3 className="text-[11px] font-semibold text-primary uppercase tracking-wider pt-2">Available Injection Tokens</h3>
            <div className="grid gap-2">
              {[
                { token: "{{customer_name}}", desc: "Lead full name" },
                { token: "{{company_name}}", desc: "Defined brand name" },
                { token: "{{total_amount}}", desc: "Final payable quote" },
                { token: "{{pdf_url}}", desc: "Dynamic cloud PDF link" }
              ].map((item) => (
                <div key={item.token} className="flex items-center justify-between p-2 rounded-lg bg-background border border-border group/token shadow-sm">
                  <code className="text-xs font-semibold text-foreground group-hover/token:text-primary transition-colors tracking-wider">{item.token}</code>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Global System Settings */}
      <div className="sticky bottom-6 z-50 bg-background/80 backdrop-blur-md border border-border rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
        <div className="flex flex-wrap gap-6 items-center w-full md:w-auto">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Cache Performance (TTL)</label>
            <div className="relative">
              <input 
                required
                type="number" 
                name="pricing_cache_ttl_seconds"
                value={formData.pricing_cache_ttl_seconds}
                onChange={handleChange}
                className="bg-secondary border border-border text-foreground rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium w-28 text-sm" 
              />
              <span className="ml-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Seconds</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Primary OTP Gateway</label>
            <select
              name="otp_provider"
              value={formData.otp_provider}
              onChange={handleChange}
              className="bg-secondary border border-border text-foreground rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium h-[38px] appearance-none cursor-pointer pr-8 text-sm"
            >
              <option value="firebase_phone">Firebase Phone Auth</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
          {showSuccess && (
            <div className="flex items-center gap-2 text-success text-xs font-semibold uppercase tracking-wider bg-success/10 px-4 py-2 rounded-full border border-success/20 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settings Saved
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="group relative flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm active:scale-95 disabled:shadow-none"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            )}
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

    </form>
  );
}
