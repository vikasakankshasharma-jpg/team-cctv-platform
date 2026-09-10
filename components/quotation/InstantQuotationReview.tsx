"use client";

import React, { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import type { Lead, PricingResult, Product, Addon, AppSettings } from "@/types";
import { 
  ArrowLeft, Check, CheckCircle2, ShieldCheck, Camera, HardDrive, Server, 
  Cable, Monitor, Wifi, Box, FileText, Sparkles, 
  ChevronRight, Wrench, Shield, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FullCustomizerPanel } from "./FullCustomizerPanel";

interface InstantQuotationReviewProps {
  lead: Lead;
  activePricing: PricingResult;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  onBack: () => void;
  onProceedToActualQuotation: () => void;
  isSaving: boolean;
}

export function InstantQuotationReview({
  lead,
  activePricing,
  products,
  addons,
  settings,
  onBack,
  onProceedToActualQuotation,
  isSaving
}: InstantQuotationReviewProps) {
  const { selection, toggleAddon } = useConfiguratorStore();
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Derive package header info
  const camItem = activePricing.items?.find((i: any) => 
    products.find(p => p.id === i.product_id)?.category === "cctv_camera" ||
    i.display_name?.toLowerCase().includes("camera")
  );
  const brandName = camItem?.brand || selection.brand_preference || "Budget Brand";
  const techName = (activePricing.technology || selection.technology || "HD").toUpperCase();
  const camCount = selection.camera_count || 4;

  // Find accessory products available in catalog
  const availableAccessories = [
    {
      id: "ACC-2U-RACK-RECORDER",
      title: "2U Metal DVR/NVR Rack",
      description: "Wall-mount lockable steel cabinet to protect your recorder and power supply from theft and dust.",
      price: 490,
      icon: Box,
      category: "Security Enclosure",
      tag: "Recommended"
    },
    {
      id: "ACC-4U-RACK-RECORDER",
      title: "4U Metal DVR/NVR Rack",
      description: "Heavy-duty 4U rack with ventilation, fits recorder, PoE switch, router, and power backups.",
      price: 630,
      icon: Box,
      category: "Security Enclosure",
      tag: "Spacious"
    },
    {
      id: "ACC-PVC-RACK-POE",
      title: "PVC Weatherproof Rack",
      description: "Outdoor waterproof and anti-rust enclosure specially designed for PoE switch & junction protection.",
      price: 630,
      icon: Box,
      category: "Security Enclosure",
      tag: "All-Weather"
    },
    {
      id: "DISP-19-INCH",
      title: "19\" Security LED Display",
      description: "Continuous 24/7 commercial LED monitor with HDMI/VGA support for live multi-camera monitoring.",
      price: 2940,
      icon: Monitor,
      category: "Monitoring Display",
      tag: "Popular"
    },
    {
      id: "ACC-4G-ROUTER",
      title: "4G SIM WiFi Router (Dual Antenna)",
      description: "High-speed 4G router for remote mobile phone viewing without any broadband or landline connection.",
      price: 2030,
      icon: Wifi,
      category: "Internet & Remote Viewing",
      tag: "Zero-Broadband"
    },
    {
      id: "amc_1yr",
      title: "1-Year Comprehensive AMC",
      description: "Annual Maintenance Contract: Free quarterly servicing, priority technician breakdown support, and peace of mind.",
      price: Math.round((activePricing.base_hardware_cost || 10000) * 0.15),
      icon: ShieldCheck,
      category: "Warranty & Support",
      tag: "Best Protection"
    },
    {
      id: "HDMI-3M",
      title: "High-Speed HDMI Cable (3 MTR)",
      description: "Gold-plated 4K-ready HDMI cable to connect your DVR/NVR directly to TV or monitor.",
      price: 168,
      icon: Cable,
      category: "Cables & Connectors",
      tag: "Essential"
    }
  ];

  const isAddonSelected = (id: string) => {
    return (selection.selected_addons || []).includes(id);
  };

  const handleToggle = (id: string, title: string) => {
    toggleAddon(id);
    const willBeSelected = !isAddonSelected(id);
    if (willBeSelected) {
      toast.success(`Added ${title} to quotation`);
    } else {
      toast.info(`Removed ${title} from quotation`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-4 space-y-8 animate-in fade-in duration-300">
      {/* 1. TOP NAVIGATION & PACKAGE SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <button
            onClick={step === 1 ? onBack : () => setStep(1)}
            className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 gap-1.5 mb-2 group transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {step === 1 ? "Back to Package Selection" : "Back to System Details"}
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d1d1f] dark:text-white tracking-tight">
              {step === 1 ? "Instant Quotation Review" : "Customize & Add-ons"}
            </h1>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {brandName} • {techName}
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {step === 1 
              ? "Review your complete itemized system breakdown below. You can customize accessories and add-ons in the next step."
              : "Select any additional accessories needed for your premises. The quotation above recalculates instantly in real time."
            }
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-bold px-6 py-2.5 rounded-full shadow-lg text-sm flex items-center gap-2 group"
            >
              Next: Customize & Add-ons
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          ) : (
            <Button
              onClick={onProceedToActualQuotation}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-full shadow-lg shadow-blue-600/20 text-sm flex items-center gap-2 group"
            >
              {isSaving ? "Finalizing Quote..." : "Proceed to Final Quotation"}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          )}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* 2. SPECIFICATION HIGHLIGHTS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <Camera className="w-5 h-5 text-blue-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cameras</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{camCount}x {techName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <Server className="w-5 h-5 text-indigo-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recorder</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{brandName} {techName === "IP" ? "NVR" : "DVR"}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <HardDrive className="w-5 h-5 text-emerald-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Recording Days</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{selection.recording_days || 7} Days Storage</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <Cable className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Cabling</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">Heavy Copper Wire</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <Wrench className="w-5 h-5 text-purple-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Installation</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Included</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xs">
          <ShieldCheck className="w-5 h-5 text-rose-600 mx-auto mb-1.5" />
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Warranty</div>
          <div className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">1 Year Brand</div>
        </div>
      </div>

      {/* 3. ITEMIZED BILL OF MATERIALS (BOM) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Itemized Bill of Materials (Complete Quotation)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Genuine Products
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> GST Invoice Available
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Item & Description</th>
                <th className="py-3 px-4 hidden sm:table-cell">Brand / Tech</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                <th className="py-3 px-4 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
              {activePricing.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-4 text-center text-xs text-zinc-400">{idx + 1}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {item.display_name}
                      {item.product_id === "labor_install" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-md">
                          Installation Service
                        </span>
                      )}
                      {item.product_id === "cabling_material" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-md">
                          Wiring & Cabling
                        </span>
                      )}
                    </div>
                    {item.product_id && (
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{item.product_id}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {item.product_id === "labor_install" ? "On-Site Service" : item.product_id === "cabling_material" ? "Wiring Material" : (item.brand || "—")}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-zinc-900 dark:text-white">
                    {item.qty}
                  </td>
                  <td className="py-3 px-4 text-right text-zinc-600 dark:text-zinc-400">
                    ₹{item.unit_price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-white">
                    ₹{item.line_total.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}

              {/* Selected Add-ons Line Items */}
              {activePricing.addons && activePricing.addons.length > 0 && activePricing.addons.map((addon, idx) => (
                <tr key={`addon-${idx}`} className="bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/60 dark:hover:bg-blue-950/40 transition-colors">
                  <td className="py-3 px-4 text-center text-xs text-blue-500 font-bold">+</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      {addon.display_name}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded">Add-on</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell text-xs text-blue-600 dark:text-blue-300">
                    Accessory
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-blue-900 dark:text-blue-200">
                    {addon.qty || 1}
                  </td>
                  <td className="py-3 px-4 text-right text-blue-700 dark:text-blue-300">
                    ₹{addon.price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-blue-900 dark:text-blue-200">
                    ₹{(addon.price * (addon.qty || 1)).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FINANCIAL TOTALS SUMMARY BAR */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p>• Prices include standard cabling and professional on-site installation.</p>
            <p>• GST 18% is computed on taxable equipment and labor value.</p>
          </div>
          
          <div className="w-full sm:w-84 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>Equipment & Hardware:</span>
              <span className="font-medium text-zinc-900 dark:text-white">₹{activePricing.base_hardware_cost?.toLocaleString("en-IN")}</span>
            </div>
            {activePricing.labor_cost > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  Installation Labor ({camCount} cameras):
                </span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">₹{activePricing.labor_cost.toLocaleString("en-IN")}</span>
              </div>
            )}
            {activePricing.cabling_cost > 0 && (
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Cabling & Wiring:</span>
                <span className="font-medium text-zinc-900 dark:text-white">₹{activePricing.cabling_cost.toLocaleString("en-IN")}</span>
              </div>
            )}
            {activePricing.addons_total > 0 && (
              <div className="flex justify-between text-blue-600 dark:text-blue-400">
                <span>Accessories & Add-ons:</span>
                <span className="font-semibold">+₹{activePricing.addons_total.toLocaleString("en-IN")}</span>
              </div>
            )}
            {activePricing.referral_discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount / Promo:</span>
                <span className="font-semibold">-₹{activePricing.referral_discount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-700">
              <span>Taxable Subtotal:</span>
              <span className="font-medium text-zinc-900 dark:text-white">₹{activePricing.net_taxable_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
              <span>GST ({activePricing.gst_rate}%):</span>
              <span className="font-medium text-zinc-900 dark:text-white">₹{activePricing.gst_amount.toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between text-base font-extrabold text-zinc-900 dark:text-white">
              <span>Grand Total Payable:</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">₹{activePricing.total_payable.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </div>

          <div className="flex justify-end pt-2 pb-6">
            <Button onClick={() => setStep(2)} className="bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-extrabold px-8 py-3.5 rounded-full text-base shadow-xl transition-transform active:scale-95 group">
              Next: Customize & Add-ons <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
      {/* 4. INTERACTIVE ADD-ONS & ACCESSORIES SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Add-ons & Accessories For Your System
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Select any additional accessories needed for your premises. The quotation above recalculates instantly in real time.
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            Live Real-Time Pricing
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAccessories.map((acc) => {
            const selected = isAddonSelected(acc.id);
            const Icon = acc.icon;

            return (
              <div
                key={acc.id}
                onClick={() => handleToggle(acc.id, acc.title)}
                className={`group cursor-pointer rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                  selected
                    ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${selected ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {acc.tag}
                      </span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${selected ? "bg-blue-600 text-white" : "border border-zinc-300 dark:border-zinc-700"}`}>
                        {selected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    {acc.category}
                  </div>
                  <h3 className={`font-bold text-base mb-1.5 transition-colors ${selected ? "text-blue-950 dark:text-blue-200" : "text-zinc-900 dark:text-white group-hover:text-blue-600"}`}>
                    {acc.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {acc.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="text-base font-black text-zinc-900 dark:text-white">
                    +₹{acc.price.toLocaleString("en-IN")}
                    <span className="text-[10px] font-normal text-zinc-400 ml-1">+GST</span>
                  </div>
                  <Button
                    size="sm"
                    variant={selected ? "destructive" : "outline"}
                    className={`rounded-full text-xs font-bold transition-all ${
                      selected
                        ? "bg-blue-600 hover:bg-red-600 text-white border-transparent"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-blue-600 hover:text-blue-600"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(acc.id, acc.title);
                    }}
                  >
                    {selected ? "✓ Added" : "+ Add"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ADVANCED COMPONENT CUSTOMIZER (ACCORDION) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              Advanced: Want to customize individual cameras, storage or recorder models?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You can optionally browse every individual model in our catalog to swap hard disk capacity or camera models.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedCustomizer(!showAdvancedCustomizer)}
            className="rounded-full text-xs font-semibold shrink-0"
          >
            {showAdvancedCustomizer ? "Hide Component Customizer" : "Customize Specific Components"}
          </Button>
        </div>

        {showAdvancedCustomizer && (
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <FullCustomizerPanel activePricing={activePricing} />
          </div>
        )}
      </div>

      {/* 6. BOTTOM CTA BANNER & ACTION */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs uppercase tracking-widest text-blue-200 font-black">
            Ready To Finalize Your Quotation?
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Grand Total: ₹{activePricing.total_payable.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Includes all selected cameras, recorder, hard disk storage, cabling, installation, and chosen accessories with full 18% GST invoice.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <Button
            variant="secondary"
            onClick={() => setStep(1)}
            className="w-full sm:w-auto rounded-full font-bold text-xs px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            ← Back to System Details
          </Button>
          <Button
            onClick={onProceedToActualQuotation}
            disabled={isSaving}
            className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-blue-700 font-extrabold text-sm px-8 py-3 rounded-full shadow-lg transition-transform active:scale-95"
          >
            {isSaving ? "Finalizing Quote..." : "Proceed to Final Quotation →"}
          </Button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
