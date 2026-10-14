"use client";

import { useState } from "react";
import { Save, Settings2, Image as ImageIcon, Loader2, CheckCircle2, BadgePercent, Ruler, HardHat, MessageSquare, Zap, Building2, MapPin, Receipt, Phone, Globe, Landmark, ShieldCheck, Eye } from "lucide-react";
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
    company_name: initialSettings.company_name ?? "TEAM CCTV",
    company_legal_name: initialSettings.company_legal_name ?? initialSettings.company_name ?? "TEAM CCTV",
    company_tagline: initialSettings.company_tagline ?? "Premium Security Solutions",
    company_logo_url: initialSettings.company_logo_url ?? "",
    company_address_line1: initialSettings.company_address_line1 ?? "",
    company_address_line2: initialSettings.company_address_line2 ?? "",
    company_city: initialSettings.company_city ?? "Jaipur",
    company_state: initialSettings.company_state ?? "Rajasthan",
    company_state_code: initialSettings.company_state_code ?? "08",
    company_pincode: initialSettings.company_pincode ?? "302001",
    company_gstin: initialSettings.company_gstin ?? "",
    company_pan: initialSettings.company_pan ?? "",
    company_phone: initialSettings.company_phone ?? "+91 98290 00000",
    company_email: initialSettings.company_email ?? "sales@teamcctv.com",
    company_website: initialSettings.company_website ?? "cctvquotation.com",
    bank_name: initialSettings.bank_name ?? "HDFC Bank",
    bank_account_name: initialSettings.bank_account_name ?? "TEAM CCTV SOLUTIONS",
    bank_account_no: initialSettings.bank_account_no ?? "50200062325372",
    bank_ifsc: initialSettings.bank_ifsc ?? "HDFC0001844",
    bank_branch: initialSettings.bank_branch ?? "Jaipur",
    bank_upi_id: initialSettings.bank_upi_id ?? "teamcctv@okhdfc",
    authorized_signatory_label: initialSettings.authorized_signatory_label ?? "Authorised Signatory — TEAM CCTV",
    jurisdiction_city: initialSettings.jurisdiction_city ?? "Jaipur",
    margin_hdd: initialSettings.margin_hdd ?? 5,
    margin_hdd_budget: initialSettings.margin_hdd_budget ?? 10,
    margin_cctv_camera: initialSettings.margin_cctv_camera ?? 15,
    margin_cctv_camera_budget: initialSettings.margin_cctv_camera_budget ?? 30,
    margin_recorder: initialSettings.margin_recorder ?? 15,
    margin_junction_box: initialSettings.margin_junction_box ?? 50,
    margin_connectors: initialSettings.margin_connectors ?? 50,
    margin_hdmi_cable: initialSettings.margin_hdmi_cable ?? 20,
    margin_rack: initialSettings.margin_rack ?? 30,
    margin_power_supply: initialSettings.margin_power_supply ?? 25,
    labor_hd_fitting_only: initialSettings.labor_hd_fitting_only ?? 200,
    labor_ip_fitting_only: initialSettings.labor_ip_fitting_only ?? 300,
    labor_no_cabling_visit_charge: initialSettings.labor_no_cabling_visit_charge ?? 500,
    labor_no_cabling_small_job_threshold: initialSettings.labor_no_cabling_small_job_threshold ?? 2,
    labor_no_cabling_small_job_rate: initialSettings.labor_no_cabling_small_job_rate ?? 500,
    site_preparation: {
      ladderArrangementFee: initialSettings.site_preparation?.ladderArrangementFee ?? 500,
      marbleLaborSurcharge: initialSettings.site_preparation?.marbleLaborSurcharge ?? 400,
      metalInstallationSurcharge: initialSettings.site_preparation?.metalInstallationSurcharge ?? 200,
      furnishedSiteSurcharge: initialSettings.site_preparation?.furnishedSiteSurcharge ?? 300,
      heavyWallDrillingSurcharge: initialSettings.site_preparation?.heavyWallDrillingSurcharge ?? 600,
    },
    tds_194c_individual_rate: initialSettings.tds_194c_individual_rate ?? 1,
    tds_194c_firm_rate: initialSettings.tds_194c_firm_rate ?? 2,
    tds_194c_single_threshold: initialSettings.tds_194c_single_threshold ?? 30000,
    tds_194c_annual_threshold: initialSettings.tds_194c_annual_threshold ?? 100000,
    tds_194h_rate: initialSettings.tds_194h_rate ?? 5,
    tds_194h_annual_threshold: initialSettings.tds_194h_annual_threshold ?? 15000,
    tds_penal_rate: initialSettings.tds_penal_rate ?? 20,
    default_sla_operating_hours: initialSettings.default_sla_operating_hours || {
      start_time: "10:00",
      end_time: "18:00",
      days_off: [0] // Sunday
    }
  });
  const [apiKeysText, setApiKeysText] = useState<string>(
    initialSettings.gemini_api_keys ? initialSettings.gemini_api_keys.join("\n") : ""
  );
  const [affordablePincodesText, setAffordablePincodesText] = useState<string>(
    initialSettings.affordable_pincodes ? initialSettings.affordable_pincodes.join(", ") : ""
  );
  const [brandTabsText, setBrandTabsText] = useState<string>(
    initialSettings.brand_tabs_order ? initialSettings.brand_tabs_order.join(", ") : "all, budget, cpplus, hikvision, dahua"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setShowSuccess(false);
    
    try {
      const payload = { ...formData };
      
      // Parse the local text state into the array before saving
      payload.gemini_api_keys = apiKeysText
        .split("\n")
        .map(k => k.trim())
        .filter(k => k.length > 0);

      payload.affordable_pincodes = affordablePincodesText
        .split(",")
        .map(p => p.trim())
        .filter(p => p.length > 0);
        
      payload.brand_tabs_order = brandTabsText
        .split(",")
        .map(p => p.trim().toLowerCase())
        .filter(p => p.length > 0);
        
      await updateSettings(payload);
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
      [name]: (name === 'company_gstin' || name === 'company_pan' || name === 'bank_ifsc') ? value.toUpperCase() : (type === 'number' ? Number(value) : value)
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

  const handleSitePrepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      site_preparation: {
        ...(prev.site_preparation || {}),
        [name]: Number(value)
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
        
                {/* Section: Company Profile & Invoicing Authority */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm group hover:border-primary/20 transition-all space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Company Profile & Invoicing Authority</h2>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">
                  Official branding, registered address, GSTIN, and bank settlement details for Quotations & Invoices
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-xs font-medium text-muted-foreground border border-border/50">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Reflects Realtime in PDF & Web</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Form Inputs */}
            <div className="xl:col-span-7 space-y-6">
              {/* Subsection: Brand Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Brand & Legal Identity
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Brand Name *</label>
                    <input
                      required
                      type="text"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="e.g. TEAM CCTV"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Legal Entity / Billing Name</label>
                    <input
                      type="text"
                      name="company_legal_name"
                      value={formData.company_legal_name || ""}
                      onChange={handleChange}
                      placeholder="e.g. TEAM CCTV & Security Systems"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Business Tagline</label>
                    <input
                      type="text"
                      name="company_tagline"
                      value={formData.company_tagline || ""}
                      onChange={handleChange}
                      placeholder="e.g. Premium Security Solutions"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Brand Logo URL</label>
                    <input
                      type="text"
                      name="company_logo_url"
                      value={formData.company_logo_url || ""}
                      onChange={handleChange}
                      placeholder="https://your-domain.com/logo.png"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Subsection: Registered Address */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Registered Business Address & Jurisdiction
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address Line 1</label>
                    <input
                      type="text"
                      name="company_address_line1"
                      value={formData.company_address_line1 || ""}
                      onChange={handleChange}
                      placeholder="Office/Shop No., Building Name, Complex"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Address Line 2 (Street / Locality)</label>
                    <input
                      type="text"
                      name="company_address_line2"
                      value={formData.company_address_line2 || ""}
                      onChange={handleChange}
                      placeholder="Street, Landmark, Area"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                      <input
                        type="text"
                        name="company_city"
                        value={formData.company_city || ""}
                        onChange={handleChange}
                        placeholder="Jaipur"
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">PIN Code</label>
                      <input
                        type="text"
                        name="company_pincode"
                        value={formData.company_pincode || ""}
                        onChange={handleChange}
                        placeholder="302001"
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Jurisdiction</label>
                      <input
                        type="text"
                        name="jurisdiction_city"
                        value={formData.jurisdiction_city || ""}
                        onChange={handleChange}
                        placeholder="Jaipur"
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">State</label>
                      <input
                        type="text"
                        name="company_state"
                        value={formData.company_state || ""}
                        onChange={handleChange}
                        placeholder="Rajasthan"
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">State Code (2 Digits)</label>
                      <input
                        type="text"
                        maxLength={2}
                        name="company_state_code"
                        value={formData.company_state_code || ""}
                        onChange={handleChange}
                        placeholder="08"
                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsection: Tax Identifiers */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Receipt className="w-3.5 h-3.5 text-primary" />
                  Tax & Regulatory Identifiers
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Company GSTIN
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      name="company_gstin"
                      value={formData.company_gstin || ""}
                      onChange={handleChange}
                      placeholder="e.g. 08AABCT1234A1ZS"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono font-medium text-sm shadow-sm tracking-wider uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">Leave empty to display &quot;GST Registration Pending&quot; on quotations.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Company PAN</label>
                    <input
                      type="text"
                      maxLength={10}
                      name="company_pan"
                      value={formData.company_pan || ""}
                      onChange={handleChange}
                      placeholder="e.g. AABCT1234A"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono font-medium text-sm shadow-sm tracking-wider uppercase"
                    />
                    <p className="text-[10px] text-muted-foreground">Used for B2B input tax credit and TDS compliances.</p>
                  </div>
                </div>
              </div>

              {/* Subsection: Official Contacts */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  Official Contact Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone / Helpline</label>
                    <input
                      type="text"
                      name="company_phone"
                      value={formData.company_phone || ""}
                      onChange={handleChange}
                      placeholder="+91 98290 00000"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Official Email</label>
                    <input
                      type="email"
                      name="company_email"
                      value={formData.company_email || ""}
                      onChange={handleChange}
                      placeholder="sales@teamcctv.com"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Official Website</label>
                    <input
                      type="text"
                      name="company_website"
                      value={formData.company_website || ""}
                      onChange={handleChange}
                      placeholder="cctvquotation.com"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Subsection: Bank & Settlement */}
              <div className="space-y-4 pt-4 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
                  <Landmark className="w-3.5 h-3.5 text-primary" />
                  Bank & Payment Settlement Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name || ""}
                      onChange={handleChange}
                      placeholder="e.g. HDFC Bank"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account Number</label>
                    <input
                      type="text"
                      name="bank_account_no"
                      value={formData.bank_account_no || ""}
                      onChange={handleChange}
                      placeholder="e.g. 50200062325372"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beneficiary / Account Name</label>
                    <input
                      type="text"
                      name="bank_account_name"
                      value={formData.bank_account_name || ""}
                      onChange={handleChange}
                      placeholder="e.g. TEAM CCTV SOLUTIONS"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      name="bank_ifsc"
                      value={formData.bank_ifsc || ""}
                      onChange={handleChange}
                      placeholder="e.g. HDFC0001844"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono font-medium text-sm shadow-sm uppercase tracking-wider"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Branch Name</label>
                    <input
                      type="text"
                      name="bank_branch"
                      value={formData.bank_branch || ""}
                      onChange={handleChange}
                      placeholder="e.g. Tonk Road, Jaipur"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">UPI ID / VPA</label>
                    <input
                      type="text"
                      name="bank_upi_id"
                      value={formData.bank_upi_id || ""}
                      onChange={handleChange}
                      placeholder="e.g. teamcctv@okhdfc"
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Authorized Signatory Designation</label>
                  <input
                    type="text"
                    name="authorized_signatory_label"
                    value={formData.authorized_signatory_label || ""}
                    onChange={handleChange}
                    placeholder="Authorised Signatory — TEAM CCTV"
                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Live Document Preview */}
            <div className="xl:col-span-5 flex flex-col space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  Live Document Header Preview
                </span>
                <span className="text-[10px] font-normal text-muted-foreground">Simulated Output</span>
              </div>

              {/* Quotation & Invoice Header Card */}
              <div className="bg-background border-2 border-border/80 rounded-2xl p-5 shadow-sm space-y-4 font-sans text-xs">
                <div className="flex items-start justify-between pb-3 border-b border-border/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {formData.company_logo_url ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-secondary border border-border shrink-0">
                          <Image
                            src={formData.company_logo_url}
                            alt="Logo"
                            width={32}
                            height={32}
                            unoptimized
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      ) : null}
                      <span className="text-base font-black tracking-tight text-foreground">
                        {formData.company_legal_name || formData.company_name || "TEAM CCTV"}
                      </span>
                    </div>
                    {formData.company_tagline ? (
                      <p className="text-[11px] text-muted-foreground font-medium">{formData.company_tagline}</p>
                    ) : null}
                    {formData.company_address_line1 || formData.company_city ? (
                      <p className="text-[10.5px] text-muted-foreground leading-snug">
                        {[
                          formData.company_address_line1,
                          formData.company_address_line2,
                          formData.company_city,
                          formData.company_state ? `${formData.company_state}${formData.company_pincode ? ` - ${formData.company_pincode}` : ''}` : formData.company_pincode
                        ].filter(Boolean).join(", ")}
                      </p>
                    ) : null}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-[10.5px]">
                      {formData.company_gstin && formData.company_gstin.trim().length > 0 ? (
                        <span className="font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          GSTIN: {formData.company_gstin.trim()}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          GST Registration Pending
                        </span>
                      )}
                      {formData.company_state_code ? (
                        <span className="text-muted-foreground">State Code: {formData.company_state_code}</span>
                      ) : null}
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-0.5">
                      {formData.company_email || "sales@teamcctv.com"} {formData.company_phone ? `| Ph: ${formData.company_phone}` : ""} | Web: {formData.company_website || "cctvquotation.com"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-primary/10 text-primary font-bold text-[10px] tracking-wider uppercase border border-primary/20">
                      QUOTATION / INVOICE
                    </span>
                  </div>
                </div>

                {/* Bank Preview */}
                <div className="bg-secondary/40 rounded-xl p-3 border border-border/50 space-y-1.5">
                  <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">Settlement & Bank Details</p>
                  <p className="text-[10.5px] text-foreground font-medium">
                    Bank: <span className="font-semibold">{formData.bank_name || "HDFC Bank"}</span> | A/c No: <span className="font-mono font-semibold">{formData.bank_account_no || "50200062325372"}</span>
                  </p>
                  <p className="text-[10.5px] text-muted-foreground">
                    A/c Name: <span className="text-foreground font-medium">{formData.bank_account_name || formData.company_name}</span> | IFSC: <span className="font-mono font-semibold text-foreground">{formData.bank_ifsc || "HDFC0001844"}</span>
                  </p>
                  {formData.bank_upi_id ? (
                    <p className="text-[10.5px] text-muted-foreground">
                      UPI ID: <span className="font-mono font-semibold text-primary">{formData.bank_upi_id}</span>
                    </p>
                  ) : null}
                </div>

                {/* Footer preview */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[9.5px] text-muted-foreground">
                  <span>Valid for {formData.quote_validity_days || 7} Days</span>
                  <span>{formData.authorized_signatory_label || "Authorised Signatory"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Section: Pricing & Taxes */}
        <div className="bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-success/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/20">
              <BadgePercent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Pricing Engine</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Taxation & Global Rates</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Def. Cable / Cam</label>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  name="default_cable_length_per_camera"
                  value={formData.default_cable_length_per_camera || 20}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px] font-medium uppercase tracking-wider">m</span>
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

            {/* Fitting-Only (No Cabling Required) Labor Rules */}
            <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Fitting-Only Labor Rules (Site Already Cabled / No Cabling Required)
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Configures installer charges when customer has existing cabling. If camera count is ≤ small job threshold, flat rate applies per camera. When camera count exceeds threshold, per-camera rate plus site visit mobilization charge applies.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">HD Fitting Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="labor_hd_fitting_only"
                      value={formData.labor_hd_fitting_only ?? 200}
                      onChange={handleChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">/ Cam</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">IP Fitting Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="labor_ip_fitting_only"
                      value={formData.labor_ip_fitting_only ?? 300}
                      onChange={handleChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">/ Cam</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Visit / Mobilization Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="labor_no_cabling_visit_charge"
                      value={formData.labor_no_cabling_visit_charge ?? 500}
                      onChange={handleChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Small Job Threshold</label>
                  <div className="relative">
                    <input 
                      required
                      type="number" 
                      name="labor_no_cabling_small_job_threshold"
                      value={formData.labor_no_cabling_small_job_threshold ?? 2}
                      onChange={handleChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Cams</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Small Job Flat Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="labor_no_cabling_small_job_rate"
                      value={formData.labor_no_cabling_small_job_rate ?? 500}
                      onChange={handleChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-primary/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">/ Cam</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Preparation Difficulty Surcharges (0% Margin Pass-Through) */}
            <div className="sm:col-span-2 mt-2 pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Site Preparation & Difficulty Surcharges (0% Margin Pass-Through)
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  32 Bitmask Permutations (Exact Cost Pass-Through)
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4">
                Master rates for physical site preparation challenges identified by Installer or Salesperson. Mandated by BUSINESS_RULES.md with ₹0 margin markup (100% reimbursed to technician/logistics).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Ladder / Scaffolding Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="ladderArrangementFee"
                      value={formData.site_preparation?.ladderArrangementFee ?? 500}
                      onChange={handleSitePrepChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Marble / Stone Drilling</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="marbleLaborSurcharge"
                      value={formData.site_preparation?.marbleLaborSurcharge ?? 400}
                      onChange={handleSitePrepChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Metal / Pole Installation</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="metalInstallationSurcharge"
                      value={formData.site_preparation?.metalInstallationSurcharge ?? 200}
                      onChange={handleSitePrepChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Furnished Site Care</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="furnishedSiteSurcharge"
                      value={formData.site_preparation?.furnishedSiteSurcharge ?? 300}
                      onChange={handleSitePrepChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Heavy Wall Drilling</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">₹</span>
                    <input 
                      required
                      type="number" 
                      name="heavyWallDrillingSurcharge"
                      value={formData.site_preparation?.heavyWallDrillingSurcharge ?? 600}
                      onChange={handleSitePrepChange}
                      className="w-full bg-background border border-border text-foreground rounded-xl pl-7 pr-4 py-2 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-semibold shadow-sm" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[9px] font-medium uppercase tracking-wider">Flat</span>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: Referral System */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Promoter Commission</label>
              <div className="relative">
                <input 
                 required
                  type="number" 
                  name="promoter_commission_percent"
                  value={formData.promoter_commission_percent || 2}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-medium shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Customer Referral Discount</label>
              <div className="relative">
                <input 
                 required
                  type="number" 
                  name="customer_referral_discount_percent"
                  value={formData.customer_referral_discount_percent || 3}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-success/20 outline-none transition-all font-medium shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
            </div>

          </div>
        </div>

        {/* Section: Component Margins & Hardware Markups (%) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <BadgePercent className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Hardware & Component Margins (%)</h2>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Editable Quotation Engine Markups per Hardware Category & Brand</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Margin Engine
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* HDD Standard */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Hard Disk Drive (HDD)</label>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">Standard</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_hdd"
                  value={formData.margin_hdd ?? 5}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Standard surveillance drives (WD Purple, Seagate SkyHawk)</p>
            </div>

            {/* HDD Budget */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Budget Brand HDD</label>
                <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Budget</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_hdd_budget"
                  value={formData.margin_hdd_budget ?? 10}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Entry-level / budget drives (Consistent, Zebronics, etc.)</p>
            </div>

            {/* CCTV Camera Standard */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">CCTV Cameras</label>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">Standard</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_cctv_camera"
                  value={formData.margin_cctv_camera ?? 15}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Mainstream camera brands (CP Plus, Hikvision, Dahua)</p>
            </div>

            {/* CCTV Camera Budget */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Budget Brand CCTV</label>
                <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Budget</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_cctv_camera_budget"
                  value={formData.margin_cctv_camera_budget ?? 30}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">White-label / budget cameras or Value Tier packages</p>
            </div>

            {/* Recorders */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Recorders (DVR / NVR)</label>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">Core</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_recorder"
                  value={formData.margin_recorder ?? 15}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">4/8/16/32 Channel DVRs and NVRs</p>
            </div>

            {/* Junction PVC Box */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Junction PVC Box</label>
                <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Accessory</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_junction_box"
                  value={formData.margin_junction_box ?? 50}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Weatherproof PVC Camera Junction Boxes</p>
            </div>

            {/* Connectors */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Connectors (BNC / DC / RJ45)</label>
                <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Accessory</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_connectors"
                  value={formData.margin_connectors ?? 50}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Copper BNC, DC Pins, and RJ45 modular plugs</p>
            </div>

            {/* HDMI Cable */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">HDMI Cable</label>
                <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Cabling</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_hdmi_cable"
                  value={formData.margin_hdmi_cable ?? 20}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Display interconnect cables (1.5m, 3m, 5m 4K HDMI)</p>
            </div>

            {/* Rack */}
            <div className="space-y-2 p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Server / DVR Rack</label>
                <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Infrastructure</span>
              </div>
              <div className="relative">
                <input 
                  required
                  type="number" 
                  step="0.5"
                  name="margin_rack"
                  value={formData.margin_rack ?? 30}
                  onChange={handleChange}
                  className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-base shadow-sm" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Wall-mount 2U, 4U, 6U DVR and networking racks</p>
            </div>
          </div>
        </div>

        {/* Section: Brand Display Tabs */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Brand Tabs Display</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Control which brands are shown as tabs and in what order</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Visible Brands (Comma Separated)</label>
              <textarea 
                name="brandTabsText" 
                value={brandTabsText} 
                onChange={(e) => setBrandTabsText(e.target.value)}
                placeholder="all, budget, cpplus, hikvision, dahua"
                className="w-full h-16 bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-sm shadow-sm font-mono" 
              />
              <p className="text-[10px] text-muted-foreground ml-1">
                Enter exact brand keys (e.g. <code>all, budget, cpplus, hikvision, dahua, prama, trueview, secureye</code>). 
                Any brand NOT in this list will be completely hidden from the front-end tabs, even if products exist in the database.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Brand Tier Management */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all">
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
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-warning/20 transition-all">
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
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ml-1">Affordable Pincodes (Zero Travel Fee) - Comma Separated</label>
              <textarea 
                name="affordablePincodesText" 
                value={affordablePincodesText} 
                onChange={(e) => setAffordablePincodesText(e.target.value)}
                placeholder="302001, 302002, 302003"
                className="w-full h-16 bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-warning/20 outline-none transition-all font-medium text-sm shadow-sm font-mono" 
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
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-destructive/20 transition-all">
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

        {/* Section: Operational Mode & Emergency Kill Switch */}
        <div className="lg:col-span-2 bg-card border-2 border-primary/30 rounded-2xl p-4 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">System Operational Mode & Kill Switch</h2>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Emergency Controls for Public Launch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-secondary/30 border border-border">
              <label className="text-xs font-bold uppercase tracking-wider block mb-2">System Mode</label>
              <select
                name="system_mode"
                value={formData.system_mode || "LIVE"}
                onChange={handleChange}
                className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm font-semibold outline-none"
              >
                <option value="LIVE">🟢 LIVE (All public customer flows active)</option>
                <option value="MAINTENANCE">🟡 MAINTENANCE (Public site displays maintenance notice)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-2">Switch to Maintenance to pause public intake during upgrades.</p>
            </div>

            <div className="p-5 rounded-xl bg-secondary/30 border border-border">
              <label className="text-xs font-bold uppercase tracking-wider block mb-2">Payments Gateway Switch</label>
              <select
                name="payments_enabled"
                value={formData.payments_enabled !== false ? "true" : "false"}
                onChange={(e) => setFormData(prev => ({ ...prev, payments_enabled: e.target.value === "true" }))}
                className="w-full bg-background border border-border text-foreground rounded-lg px-3 py-2 text-sm font-semibold outline-none"
              >
                <option value="true">🟢 PAYMENTS ENABLED (Checkout & online advance active)</option>
                <option value="false">🔴 PAYMENTS DISABLED (Quotes generated & saved; online payment paused)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-2">Allows quotation generation to continue while disabling online transactions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section: PDF Generation */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all mt-6">
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
      <div className="bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all">
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
                  placeholder="73576 12865"
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

      {/* Section: AI & Enrichment */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-8 shadow-sm group hover:border-primary/20 transition-all mt-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">AI & Enrichment Settings</h2>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">Gemini API Keys & AI Limits</p>
          </div>
        </div>

        <div className="space-y-4 p-5 rounded-xl bg-secondary/30 border border-border">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gemini API Keys (For Auto-Rotation)</h3>
          <div className="space-y-2">
            <textarea 
              name="gemini_api_keys"
              value={apiKeysText}
              onChange={(e) => setApiKeysText(e.target.value)}
              placeholder="Paste one API key per line..."
              rows={4}
              className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none font-mono text-xs leading-relaxed whitespace-pre-wrap transition-all shadow-sm"
            />
            <p className="text-[10px] font-medium text-muted-foreground italic">If the AI enricher hits a rate limit, it will automatically switch to the next key. Add 3-4 free tier keys from Google AI Studio.</p>
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
