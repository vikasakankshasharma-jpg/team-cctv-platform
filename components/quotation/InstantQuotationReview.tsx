"use client";

import React, { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import type { Lead, PricingResult, Product, Addon, AppSettings } from "@/types";
import { 
  ArrowLeft, Check, CheckCircle2, ShieldCheck, Camera, HardDrive, Server, 
  Cable, Monitor, Wifi, Box, FileText, Sparkles, 
  ChevronRight, Wrench, Shield, Layers
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
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
  const { t } = useTranslation();

  const translateProductName = (name: string) => {
    let localized = name;
    localized = localized.replace("Outdoor Bullet Camera", t("wz_prod_outdoor_bullet"));
    localized = localized.replace("Indoor Dome Camera", t("wz_prod_indoor_dome"));
    localized = localized.replace("Color Night Vision, Audio IN", t("wz_prod_color_night_audio"));
    localized = localized.replace("Supported", t("wz_prod_supported"));
    localized = localized.replace("Surveillance Hard Disk", t("wz_prod_surveillance_hdd"));
    
    // regex for approx backup
    const backupMatch = localized.match(/Approx\. (\d+) Days Backup - Motion/);
    if (backupMatch) {
      localized = localized.replace(backupMatch[0], t("wz_prod_approx_backup").replace('%d', backupMatch[1]));
    }
    
    localized = localized.replace("Power Supply", t("wz_prod_power_supply"));
    localized = localized.replace("Installation & Termination", t("wz_prod_install_term"));
    localized = localized.replace("Coaxial Cable (Open)", t("wz_prod_coaxial_cable"));
    localized = localized.replace("Camera Cable", t("wz_prod_camera_cable"));
    localized = localized.replace("Connector Set", t("wz_prod_connector_set"));
    localized = localized.replace("Connectors", t("wz_prod_connectors"));
    localized = localized.replace("Weatherproof Camera Junction Box", t("wz_prod_junction_box"));
    return localized;
  };

  const { selection, toggleAddon, updateSelection } = useConfiguratorStore();
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);
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
      title: t("addon_2u_rack_title", "2U Metal DVR/NVR Rack"),
      description: t("addon_2u_rack_desc", "Wall-mount lockable steel cabinet to protect your recorder and power supply from theft and dust."),
      price: 490,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_recommended", "Recommended")
    },
    {
      id: "ACC-4U-RACK-RECORDER",
      title: t("addon_4u_rack_title", "4U Metal DVR/NVR Rack"),
      description: t("addon_4u_rack_desc", "Heavy-duty 4U rack with ventilation, fits recorder, PoE switch, router, and power backups."),
      price: 630,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_spacious", "Spacious")
    },
    {
      id: "ACC-PVC-RACK-POE",
      title: t("addon_pvc_rack_title", "PVC Weatherproof Rack"),
      description: t("addon_pvc_rack_desc", "Outdoor waterproof and anti-rust enclosure specially designed for PoE switch & junction protection."),
      price: 630,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_all_weather", "All-Weather")
    },
    {
      id: "DISP-19-INCH",
      title: t("addon_disp_19_title", "19\" Security LED Display"),
      description: t("addon_disp_19_desc", "Continuous 24/7 commercial LED monitor with HDMI/VGA support for live multi-camera monitoring."),
      price: 2940,
      icon: Monitor,
      category: t("addon_cat_display", "TV & Display Screens"),
      tag: t("addon_tag_popular", "Popular")
    },
    {
      id: "ACC-4G-ROUTER",
      title: t("addon_4g_router_title", "4G SIM WiFi Router (Dual Antenna)"),
      description: t("addon_4g_router_desc", "High-speed 4G router for remote mobile phone viewing without any broadband or landline connection."),
      price: 2030,
      icon: Wifi,
      category: t("addon_cat_internet", "Internet (For Mobile View)"),
      tag: t("addon_tag_zero_broadband", "Zero-Broadband")
    },
    {
      id: "amc_1yr",
      title: t("addon_amc_title", "1-Year Comprehensive AMC"),
      description: t("addon_amc_desc", "Annual Maintenance Contract: Free quarterly servicing, priority technician breakdown support, and peace of mind."),
      price: Math.round((activePricing.base_hardware_cost || 10000) * 0.15),
      icon: ShieldCheck,
      category: t("addon_cat_warranty", "Maintenance & Warranty"),
      tag: t("addon_tag_best_protection", "Best Protection")
    },
    {
      id: "HDMI-3M",
      title: t("addon_hdmi_title", "High-Speed HDMI Cable (3 MTR)"),
      description: t("addon_hdmi_desc", "Gold-plated 4K-ready HDMI cable to connect your DVR/NVR directly to TV or monitor."),
      price: 168,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_essential", "Essential")
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
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-24 sm:pb-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP NAVIGATION & BADGES */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <button
          onClick={onBack}
          className="inline-flex items-center text-xs font-bold text-gray-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 gap-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("wz_back_to_packages")}</span>
        </button>

        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          {brandName} • {techName === "HD" ? t("wz_standard_hd") : t("wz_premium_ip")}
        </span>
      </div>

      {/* 2. HERO QUOTATION CARD — Above The Fold Instant Price Clarity */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs uppercase font-black text-blue-300 tracking-wider">{t("wz_confirmed_quotation")}</span>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">{t("wz_best_value")}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              {brandName} {techName === "HD" ? t("wz_standard_hd") : t("wz_premium_ip")} {t("wz_setup")}
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5">
              {t("wz_complete_system_for")} {camCount} {t("wz_cameras_with")} {selection.recording_days || 7} {t("wz_days_storage")}
            </p>
          </div>

          <div className="flex items-center justify-between sm:flex-col sm:items-end bg-white/10 backdrop-blur-md px-3.5 py-2 sm:p-4 rounded-xl border border-white/10 shrink-0">
            <span className="text-[10px] uppercase font-semibold text-blue-200">{t("wz_total_all_inclusive_price")}</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-3xl font-black text-white">₹{activePricing.total_payable.toLocaleString("en-IN")}</span>
            </div>
            <span className="hidden sm:block text-[9px] text-emerald-300 font-semibold mt-0.5">✓ {t("wz_includes_hardware_wiring_install")}</span>
          </div>
        </div>

        {/* Value Badges Strip */}
        <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs font-semibold text-blue-100">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{t("wz_100_genuine")}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{t("wz_free_onsite_install")}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">{t("wz_1_year_warranty")}</span>
          </div>
        </div>
      </div>

      {/* 3. COMPACT SPECIFICATIONS — 3x2 on mobile, 6x1 on desktop */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Camera className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_cameras")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{camCount}x {techName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Server className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_recorder")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{brandName} {techName === "IP" ? "NVR" : "DVR"}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <HardDrive className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_storage")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{selection.recording_days || 7} {t("wz_days")}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Cable className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_cabling")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t("wz_copper_wire")}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Wrench className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_installation")}</div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">{t("wz_included")}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <ShieldCheck className="w-4 h-4 text-rose-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_warranty")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{t("wz_1_year_brand")}</div>
        </div>
      </div>

            {/* BRAND UNIFICATION BANNER */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 sm:p-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t("iqr_match_my_brand")}
          </div>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
            {t("iqr_match_brand_desc")}
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
          <button 
            onClick={() => updateSelection({ brand_preference: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${selection.brand_preference === 'all' || !selection.brand_preference ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
          >
            Mixed (Best Price)
          </button>
          {Array.from(new Set(products.filter(p => p.category === "cctv_camera" && p.brand).map(p => p.brand as string))).sort().map(brand => (
            <button 
              key={brand}
              onClick={() => updateSelection({ brand_preference: brand })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${selection.brand_preference?.toLowerCase() === brand.toLowerCase() ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
          {/* MOBILE ITEM CARDS (sm:hidden) */}
          <div className="sm:hidden space-y-2">
            {activePricing.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{translateProductName(item.display_name)}</div>
                    {item.brand && (
                      <div className="inline-block mt-0.5 mb-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {item.brand}
                      </div>
                    )}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("wz_qty")}: {item.qty} {item.unit_price > 0 ? `• ₹${item.unit_price.toLocaleString("en-IN")} each` : '• {t("wz_free_included")}'}
                  </div>
                </div>
                <div className="text-xs font-black text-zinc-900 dark:text-white shrink-0">
                  {item.line_total > 0 ? `₹${item.line_total.toLocaleString("en-IN")}` : <span className="text-emerald-600 text-[11px]">FREE</span>}
                </div>
              </div>
            ))}
            {activePricing.addons && activePricing.addons.length > 0 && activePricing.addons.map((addon, idx) => (
              <div key={`addon-${idx}`} className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blue-950 dark:text-blue-200 truncate">{translateProductName(addon.display_name)}</div>
                  <div className="text-[11px] text-blue-700/80 dark:text-blue-400">Add-on • {t("wz_qty")}: {addon.qty || 1}</div>
                </div>
                <div className="text-xs font-black text-blue-900 dark:text-blue-200 shrink-0">
                  +₹{((addon.price || 0) * (addon.qty || 1)).toLocaleString("en-IN")}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP BOM TABLE (hidden sm:block) */}
          <div className="hidden sm:block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{t("wz_itemized_bill_of_materials")}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("wz_100_genuine_brand_products")}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-12 text-center">#</th>
                    <th className="py-2.5 px-4">{t("wz_item_and_description")}</th>
                    <th className="py-2.5 px-4 text-center">{t("wz_qty")}</th>
                    <th className="py-2.5 px-4 text-right">{t("wz_unit_price")}</th>
                    <th className="py-2.5 px-4 text-right">{t("wz_line_total")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {activePricing.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                      <td className="py-2.5 px-4 text-center text-xs text-zinc-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-white">
                          <div className="truncate">{translateProductName(item.display_name)}</div>
                          {item.brand && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              {item.brand}
                            </span>
                          )}
                        </td>
                      <td className="py-2.5 px-4 text-center font-bold">{item.qty}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400">₹{item.unit_price.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-zinc-900 dark:text-white">₹{item.line_total.toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {activePricing.addons && activePricing.addons.length > 0 && activePricing.addons.map((addon, idx) => (
                    <tr key={`addon-${idx}`} className="bg-blue-50/40 dark:bg-blue-950/20">
                      <td className="py-2.5 px-4 text-center text-xs text-blue-500 font-bold">+</td>
                      <td className="py-2.5 px-4 font-semibold text-blue-900 dark:text-blue-200">{translateProductName(addon.display_name)}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-blue-900 dark:text-blue-200">{addon.qty || 1}</td>
                      <td className="py-2.5 px-4 text-right text-blue-700 dark:text-blue-300">₹{addon.price.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-blue-900 dark:text-blue-200">₹{((addon.price || 0) * (addon.qty || 1)).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FINANCIAL TOTALS SUMMARY BAR */}
          <div className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
            <div className="w-full max-w-sm ml-auto space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{t("wz_equipment_hardware")}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">₹{activePricing.base_hardware_cost?.toLocaleString("en-IN")}</span>
              </div>
              {activePricing.labor_cost > 0 && (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t("wz_installation_labor_prefix")} ({camCount} {t("wz_cameras")}):</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{activePricing.labor_cost.toLocaleString("en-IN")}</span>
                </div>
              )}
              {activePricing.cabling_cost > 0 && (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{t("wz_cabling_wiring")}</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">₹{activePricing.cabling_cost.toLocaleString("en-IN")}</span>
                </div>
              )}
              {activePricing.addons_total > 0 && (
                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                  <span>Accessories & Add-ons:</span>
                  <span className="font-bold">+₹{activePricing.addons_total.toLocaleString("en-IN")}</span>
                </div>
              )}
              {activePricing.referral_discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount / Promo:</span>
                  <span className="font-bold">-₹{activePricing.referral_discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400 pt-1.5 border-t border-zinc-200 dark:border-zinc-700">
                <span>{t("wz_taxable_subtotal")}</span>
                <span className="font-semibold text-zinc-900 dark:text-white">₹{activePricing.net_taxable_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>{t("wz_gst_rate_prefix")} ({activePricing.gst_rate}%):</span>
                <span className="font-semibold text-zinc-900 dark:text-white">₹{activePricing.gst_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-2 flex justify-between text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                <span>{t("wz_total_amount_payable")}</span>
                <span className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400">₹{activePricing.total_payable.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          </div>

      <hr className="border-zinc-200 dark:border-zinc-800 my-6" />

      <div className="space-y-8 mt-6">
      {/* 4. INTERACTIVE ADD-ONS & ACCESSORIES SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1d1d1f] dark:text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              {t("iqr_addons_title")}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {t("iqr_addons_desc")}
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
            Live Real-Time Pricing
          </div>
        </div>

        {(() => {
          const groupedAccessories = availableAccessories.reduce((groups, item) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
            return groups;
          }, {} as Record<string, typeof availableAccessories[0][]>);

          const categoryDescriptions: Record<string, string> = {
            [t("addon_cat_enclosure", "Safety Racks & Boxes")]: t("addon_desc_cat_enclosure", "Protect your equipment from theft, dust, and weather damage."),
            [t("addon_cat_display", "TV & Display Screens")]: t("addon_desc_cat_display", "Dedicated commercial screens for 24/7 continuous live viewing."),
            [t("addon_cat_internet", "Internet (For Mobile View)")]: t("addon_desc_cat_internet", "Required for mobile phone access if you don't have a local broadband connection."),
            [t("addon_cat_warranty", "Maintenance & Warranty")]: t("addon_desc_cat_warranty", "Extend your peace of mind with our priority maintenance contracts."),
            [t("addon_cat_cables", "Wires & Cables")]: t("addon_desc_cat_cables", "Essential links to connect your recorder to a local TV or monitor.")
          };

          const categoryIcons: Record<string, React.ReactNode> = {
            [t("addon_cat_enclosure", "Safety Racks & Boxes")]: <Box className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />,
            [t("addon_cat_display", "TV & Display Screens")]: <Monitor className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />,
            [t("addon_cat_internet", "Internet (For Mobile View)")]: <Wifi className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />,
            [t("addon_cat_warranty", "Maintenance & Warranty")]: <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />,
            [t("addon_cat_cables", "Wires & Cables")]: <Cable className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
          };

          return (
            <div className="space-y-8">
              {Object.entries(groupedAccessories).map(([category, items]) => (
                <div key={category} className="bg-white dark:bg-[#1d1d1f] border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-sm flex flex-col space-y-3 sm:space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      {categoryIcons[category]}
                      <h3 className="text-sm sm:text-lg font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-tight">{category}</h3>
                    </div>
                    <p className="text-[10px] leading-snug sm:leading-normal sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{categoryDescriptions[category] || ""}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((acc) => {
                      const selected = isAddonSelected(acc.id);
                      const Icon = acc.icon;

                      return (
                        <div
                key={acc.id}
                onClick={() => handleToggle(acc.id, acc.title)}
                className={`group cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border transition-all duration-200 flex flex-col justify-between ${
                  selected
                    ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                    : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-white dark:hover:bg-zinc-900 shadow-xs hover:shadow-md"
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


                  <h3 className={`font-bold text-sm sm:text-base leading-snug sm:leading-normal mb-1.5 transition-colors ${selected ? "text-blue-950 dark:text-blue-200" : "text-zinc-900 dark:text-white group-hover:text-blue-600"}`}>
                    {acc.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug sm:leading-relaxed mb-3 sm:mb-4">
                    {acc.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <div className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">
                    +₹{acc.price.toLocaleString("en-IN")}
                    <span className="text-[10px] font-normal text-zinc-400 ml-1">+{t("wz_gst")}</span>
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
              ))}
            </div>
          );
        })()}
      </div>

      {/* 5. ADVANCED COMPONENT CUSTOMIZER (ACCORDION) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              {t("iqr_advanced_customizer_title")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {t("iqr_advanced_customizer_desc")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedCustomizer(!showAdvancedCustomizer)}
            className="rounded-full text-xs font-semibold shrink-0"
          >
            {showAdvancedCustomizer ? t("iqr_hide_customizer") : t("iqr_customize_components")}
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
            {t("wz_total_amount_payable")} ₹{activePricing.total_payable.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {t("wz_includes_all_selected_desc")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          
          <Button
            onClick={onProceedToActualQuotation}
            disabled={isSaving}
            className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-blue-700 font-extrabold text-sm px-4 md:px-8 py-3 rounded-full shadow-lg transition-transform active:scale-95"
          >
            {isSaving ? "Finalizing Quote..." : t("wz_proceed_to_final_quotation")}
          </Button>
        </div>
      </div>
        </div>
      {/* MOBILE STICKY PROCEED BAR */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 p-3 z-50 flex items-center justify-between shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t("wz_total_amount_payable")}</span>
          <span className="text-xl font-black text-blue-700 dark:text-blue-400 leading-none mt-1">₹{activePricing.total_payable.toLocaleString("en-IN")}</span>
        </div>
        <Button
          onClick={onProceedToActualQuotation}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6 py-2.5 font-bold shadow-lg shadow-blue-500/30 text-sm flex items-center gap-1.5 transition-transform active:scale-95"
        >
          {isSaving ? "Wait..." : "Proceed"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
