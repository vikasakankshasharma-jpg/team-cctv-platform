"use client";

import React, { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import type { Lead, PricingResult, Product, Addon, AppSettings } from "@/types";
import { 
  ArrowLeft, Check, CheckCircle2, ShieldCheck, Camera, HardDrive, Server, 
  Cable, Monitor, Wifi, Box, FileText, Sparkles, 
  ChevronRight, ChevronDown, Wrench, Shield, Layers, X, Plus, Zap, CreditCard,
  Share2, ArrowRight
} from "lucide-react";
import { EmiBreakdownModal } from "./EmiBreakdownModal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FullCustomizerPanel } from "./FullCustomizerPanel";
import { getCanonicalBrandName, getCanonicalBrandKey, getUniqueCanonicalBrands } from "@/lib/brand-utils";

interface InstantQuotationReviewProps {
  lead: Lead;
  activePricing: PricingResult;
  products: Product[];
  addons: Addon[];
  settings: AppSettings;
  onBack: () => void;
  onProceedToActualQuotation: () => void;
  isSaving: boolean;
  onDownloadPdf?: () => void;
  onShareWhatsApp?: () => void;
}

export function InstantQuotationReview({
  lead,
  activePricing,
  products,
  addons,
  settings,
  onBack,
  onProceedToActualQuotation,
  isSaving,
  onDownloadPdf,
  onShareWhatsApp
}: InstantQuotationReviewProps) {
  const { t } = useTranslation();

  const translateProductName = (name: string) => {
    let localized = name;
    localized = localized.replace("Outdoor Bullet Camera", t("wz_prod_outdoor_bullet"));
    localized = localized.replace("Indoor Dome Camera", t("wz_prod_indoor_dome"));
    localized = localized.replace("Outdoor 4G SIM Camera", t("iqr_prod_outdoor_4g", "Outdoor 4G SIM Camera"));
    localized = localized.replace("Indoor 4G SIM Camera", t("iqr_prod_indoor_4g", "Indoor 4G SIM Camera"));
    localized = localized.replace("Outdoor Wi-Fi Camera", t("iqr_prod_outdoor_wifi", "Outdoor Wi-Fi Camera"));
    localized = localized.replace("Indoor Wi-Fi Camera", t("iqr_prod_indoor_wifi", "Indoor Wi-Fi Camera"));
    localized = localized.replace("Smart Wi-Fi Camera Wall Mounting & App Pairing", t("iqr_prod_wifi_mount", "Smart Wi-Fi Camera Wall Mounting & App Pairing"));
    localized = localized.replace("Wireless Camera Wall Mounting, Power Concealment & App Setup", t("iqr_prod_wireless_mount", "Wireless Camera Wall Mounting, Power Concealment & App Setup"));
    localized = localized.replace("Camera Installation & Setup", t("iqr_prod_install_setup", "Camera Installation & Setup"));
    localized = localized.replace("Technician Site Visit & Mobilization Fee", t("iqr_prod_mobilization", "Technician Site Visit & Mobilization Fee"));
    localized = localized.replace("Site Visit & Travel Fee", t("iqr_prod_site_visit", "Site Visit & Travel Fee"));
    localized = localized.replace("Small Job Flat Rate:", t("iqr_prod_small_job", "Small Job Flat Rate:"));
    localized = localized.replace("Surveillance SD Card", t("iqr_prod_sd_card", "Surveillance SD Card"));
    localized = localized.replace("3+1 Coaxial Cable", t("iqr_prod_coaxial_31", "3+1 Coaxial Cable"));
    localized = localized.replace("CAT6 Cable", t("iqr_prod_cat6", "CAT6 Cable"));
    localized = localized.replace("Power Supply SMPS", t("iqr_prod_smps", "Power Supply SMPS"));
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
    localized = localized.replace("Budget Brand HDMI Cable", t("iqr_hdmi_title"));
    localized = localized.replace("Budget Brand Display 19 inch", t("addon_disp_19_title"));
    localized = localized.replace("Budget Brand 4G Router", t("addon_4g_router_title"));
    localized = localized.replace("Budget Brand 2U Rack for Recorder", t("addon_2u_rack_title"));
    localized = localized.replace("Budget Brand 4U Rack for Recorder", t("addon_4u_rack_title"));
    localized = localized.replace("Budget Brand PVC Rack for PoE Switch", t("addon_pvc_rack_title"));
    return localized;
  };

  const { selection, toggleAddon, updateSelection } = useConfiguratorStore();
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);
  const [showEmiModal, setShowEmiModal] = useState(false);
  const [preferredSurveyDate, setPreferredSurveyDate] = useState<string>("Tomorrow");
  const [preferredSurveySlot, setPreferredSurveySlot] = useState<string>("Morning (10 AM - 1 PM)");
  const emiMonthlyAmount = Math.round((activePricing.total_payable * 1.06) / 12);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };
  // Derive package header info
  const camItem = activePricing.items?.find((i: any) => 
    products.find(p => p.id === i.product_id)?.category === "cctv_camera" ||
    i.display_name?.toLowerCase().includes("camera")
  );
  const brandName = getCanonicalBrandName(camItem?.brand || selection.brand_preference || "Budget Brand");
  const techName = (activePricing.technology || selection.technology || "HD").toUpperCase();
  const isWireless = techName === "WIRELESS" || techName === "WIFI";
  const mixedCount = selection.mixed_camera_requirements?.reduce((sum, r) => sum + Number(r.count || 0), 0) || 0;
  const camCount = mixedCount > 0 ? mixedCount : (selection.camera_count || 4);

  const recItem = activePricing.items?.find((i: any) => 
    products.find(p => p.id === i.product_id)?.category === "recorder" ||
    i.display_name?.toLowerCase().includes("nvr") ||
    i.display_name?.toLowerCase().includes("dvr")
  );
  const recorderDisplayName = recItem 
    ? (recItem.brand ? `${recItem.brand} ${techName === "IP" ? "NVR" : "DVR"}` : recItem.display_name)
    : isWireless 
    ? t("iqr_none_microsd") 
    : `${brandName} ${techName === "IP" ? "NVR" : "DVR"}`;

  const strItem = activePricing.items?.find((i: any) => 
    products.find(p => p.id === i.product_id)?.category === "storage" ||
    i.display_name?.toLowerCase().includes("microsd") ||
    i.display_name?.toLowerCase().includes("sd card") ||
    i.display_name?.toLowerCase().includes("hdd") ||
    i.display_name?.toLowerCase().includes("hard disk")
  );
  const strProduct = strItem ? products.find(p => p.id === strItem.product_id) : undefined;
  const storageCap = (strProduct as any)?.capacity || (strItem as any)?.capacity || (strItem?.display_name?.match(/(\d+)\s*(?:GB|TB)/i)?.[0]) || (isWireless ? "128GB" : "1TB");

  // Find accessory products available in catalog
  const availableAccessories = [
    {
      id: "ACC-2U-RACK-RECORDER",
      title: t("addon_2u_rack_title", "2U Metal DVR/NVR Rack"),
      description: t("addon_2u_rack_desc", "Wall-mount lockable steel cabinet to protect your recorder and power supply from theft and dust."),
      price: products.find(p => p.id === "ACC-2U-RACK-RECORDER" || p.sku === "ACC-2U-RACK-RECORDER")?.unit_price || 1150,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_recommended", "Handy Add-On")
    },
    {
      id: "ACC-4U-RACK-RECORDER",
      title: t("addon_4u_rack_title", "4U Metal DVR/NVR Rack"),
      description: t("addon_4u_rack_desc", "Heavy-duty 4U rack with ventilation, fits recorder, PoE switch, router, and power backups."),
      price: products.find(p => p.id === "ACC-4U-RACK-RECORDER" || p.sku === "ACC-4U-RACK-RECORDER")?.unit_price || 1850,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_spacious", "Spacious")
    },
    {
      id: "ACC-PVC-RACK-POE",
      title: t("addon_pvc_rack_title", "PVC Weatherproof Rack"),
      description: t("addon_pvc_rack_desc", "Outdoor waterproof and anti-rust enclosure specially designed for PoE switch & junction protection."),
      price: products.find(p => p.id === "ACC-PVC-RACK-POE" || p.sku === "ACC-PVC-RACK-POE")?.unit_price || 630,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_all_weather", "All-Weather")
    },
    {
      id: "DISP-19-INCH",
      title: t("addon_disp_19_title", "19\" Security LED Display"),
      description: t("addon_disp_19_desc", "Continuous 24/7 commercial LED monitor with HDMI/VGA support for live multi-camera monitoring."),
      price: products.find(p => p.id === "DISP-19-INCH" || p.sku === "DISP-19-INCH")?.unit_price || 5200,
      icon: Monitor,
      category: t("addon_cat_display", "TV & Display Screens"),
      tag: t("addon_tag_popular", "Most Picked")
    },
    {
      id: "ACC-4G-ROUTER",
      title: t("addon_4g_router_title", "4G SIM WiFi Router (Dual Antenna)"),
      description: t("addon_4g_router_desc", "High-speed 4G router for remote mobile phone viewing without any broadband or landline connection."),
      price: products.find(p => p.id === "ACC-4G-ROUTER" || p.sku === "ACC-4G-ROUTER")?.unit_price || 1280,
      icon: Wifi,
      category: t("addon_cat_internet", "Internet (For Mobile View)"),
      tag: t("addon_tag_zero_broadband", "Zero-Broadband")
    },
    {
      id: "ACC-WIFI-EXTENDER",
      title: t("addon_wifi_extender_title", "High-Speed Wi-Fi Range Extender (Dual Antenna)"),
      description: t("addon_wifi_extender_desc", "Extends your indoor Wi-Fi network coverage by 15-25 meters to reach distant outdoor cameras."),
      price: products.find(p => p.id === "ACC-WIFI-EXTENDER" || p.sku === "ACC-WIFI-EXTENDER")?.unit_price || 1299,
      icon: Wifi,
      category: t("addon_cat_internet", "Internet (For Mobile View)"),
      tag: t("addon_tag_range_boost", "Range Boost")
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
      id: "HDMI-1.5M",
      title: t("addon_hdmi_1_5m_title", "High-Speed HDMI Cable (1.5 MTR)"),
      description: t("addon_hdmi_1_5m_desc", "Ultra-compact 4K HDMI cable for TV or monitor placed right next to DVR/NVR."),
      price: products.find(p => p.id === "HDMI-1.5M" || p.sku === "HDMI-1.5M")?.unit_price || 220,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_compact", "Compact")
    },
    {
      id: "HDMI-3M",
      title: t("addon_hdmi_title", "High-Speed HDMI Cable (3 MTR)"),
      description: t("addon_hdmi_desc", "Gold-plated 4K-ready HDMI cable to connect your DVR/NVR directly to TV or monitor."),
      price: products.find(p => p.id === "HDMI-3M" || p.sku === "HDMI-3M")?.unit_price || 350,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_essential", "Essential")
    },
    {
      id: "HDMI-5M",
      title: t("addon_hdmi_5m_title", "High-Speed HDMI Cable (5 MTR)"),
      description: t("addon_hdmi_5m_desc", "Extended 5-meter run for wall-mounted TV or desk-to-rack connection."),
      price: products.find(p => p.id === "HDMI-5M" || p.sku === "HDMI-5M")?.unit_price || 550,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_extended", "Extended")
    },
    {
      id: "HDMI-10M",
      title: t("addon_hdmi_10m_title", "High-Speed HDMI Cable (10 MTR)"),
      description: t("addon_hdmi_10m_desc", "Heavy-duty long run cable with noise shielding for inter-room TV/monitor monitoring."),
      price: products.find(p => p.id === "HDMI-10M" || p.sku === "HDMI-10M")?.unit_price || 420,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_long_run", "Long Run")
    },
    {
      id: "HDMI-15M",
      title: t("addon_hdmi_15m_title", "High-Speed HDMI Cable (15 MTR)"),
      description: t("addon_hdmi_15m_desc", "Commercial grade long-distance 4K HDMI cable with signal booster for large halls/reception."),
      price: products.find(p => p.id === "HDMI-15M" || p.sku === "HDMI-15M")?.unit_price || 630,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_pro_length", "Pro Length")
    },
    {
      id: "HDMI-20M",
      title: t("addon_hdmi_20m_title", "High-Speed HDMI Cable (20 MTR)"),
      description: t("addon_hdmi_20m_desc", "Ultra long-run premium HDMI cable for remote security control room or executive cabin."),
      price: products.find(p => p.id === "HDMI-20M" || p.sku === "HDMI-20M")?.unit_price || 910,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_max_range", "Max Range")
    }
  ];

  // Merge dynamic addons from DB (both addons and product catalog accessories)
  const combinedDbAddons = [
    ...(addons || []),
    ...(products || []).filter(p => ["accessories", "hdmi_cable", "display", "network", "rack"].includes(p.category || ""))
  ];

  const dynamicAccessories = combinedDbAddons.map(a => {
    let cat = (a.category || t("iqr_cat_general", "General Accessories")).toString();
    let Icon = Box;
    const catLower = cat.toLowerCase();
    
    if (catLower.includes("display") || catLower.includes("monitor")) {
      cat = t("addon_cat_display", "TV & Display Screens");
      Icon = Monitor;
    } else if (catLower.includes("rack") || catLower.includes("box") || catLower.includes("enclosure")) {
      cat = t("addon_cat_enclosure", "Safety Racks & Boxes");
      Icon = Box;
    } else if (catLower.includes("cable") || catLower.includes("wire") || catLower.includes("hdmi")) {
      cat = t("addon_cat_cables", "Wires & Cables");
      Icon = Cable;
    } else if (catLower.includes("internet") || catLower.includes("router") || catLower.includes("network")) {
      cat = t("addon_cat_internet", "Internet (For Mobile View)");
      Icon = Wifi;
    }

    return {
      id: a.id || (a as any).sku || "",
      title: a.display_name,
      description: (a as any).description || t("iqr_addon_opt_desc", "Optional system upgrade or accessory."),
      price: a.unit_price || 0,
      icon: Icon,
      category: cat,
      tag: ((a as any).features && (a as any).features.length > 0) ? (a as any).features[0] : undefined
    };
  });

  const staticIds = new Set(availableAccessories.map(a => a.id));
  const newDynamicAccessories = dynamicAccessories.filter(a => !staticIds.has(a.id) && a.price > 0 && a.id !== "");
  
  const allAccessories = [...availableAccessories, ...newDynamicAccessories];

  const isAddonSelected = (id: string) => {
    return (selection.selected_addons || []).includes(id);
  };

  const handleToggle = (id: string, title: string) => {
    const isCurrentlySelected = isAddonSelected(id);
    const isHdmi = id.startsWith("HDMI-") || id.toLowerCase().includes("hdmi");
    const otherHdmi = isHdmi 
      ? (selection.selected_addons || []).find(addonId => (addonId.startsWith("HDMI-") || addonId.toLowerCase().includes("hdmi")) && addonId !== id)
      : undefined;

    toggleAddon(id);
    if (otherHdmi && !isCurrentlySelected) {
      toast.success(t("iqr_toast_hdmi_switch", "Switched HDMI cable to {title}", { title }));
    } else if (!isCurrentlySelected) {
      toast.success(t("iqr_toast_addon_added", "Added {title} to quotation", { title }));
    } else {
      toast.info(t("iqr_toast_addon_removed", "Removed {title} from quotation", { title }));
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 pb-24 sm:pb-6 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. TOP NAVIGATION & BADGES */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center text-xs font-bold text-gray-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 gap-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-full shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("wz_back_to_packages")}</span>
          </button>

          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {brandName} • {Boolean(selection.is_hybrid || (activePricing as any).is_hybrid || ((selection.wifi_camera_count || 0) > 0 && camCount > (selection.wifi_camera_count || 0))) ? (selection.hybrid_wired_technology === "IP" ? t("iqr_hybrid_ip_badge") : t("iqr_hybrid_hd_badge")) : (techName === "HD" ? t("wz_standard_hd") : t("wz_premium_ip"))}
          </span>
        </div>

        {/* Quick Action Share / Download */}
        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-400 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">{t("iqr_download")}</span> {t("iqr_pdf_short")}
            </button>
          )}
          {onShareWhatsApp && (
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t("iqr_share")}</span> {t("qrc_whatsapp")}
            </button>
          )}
        </div>
      </div>

      {/* 2. HERO QUOTATION CARD — Above The Fold Instant Price Clarity */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-black text-blue-300 tracking-wider">{t("wz_confirmed_quotation")}</span>
              <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">{t("wz_best_value")}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white">
              {brandName} {isWireless ? t("iqr_smart_wireless") : techName === "HD" ? t("wz_standard_hd") : t("wz_premium_ip")} {t("wz_setup")}
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-200/80 mt-0.5">
              {t("wz_complete_system_for")} {camCount} {t("wz_cameras_with")} {selection.recording_days || 7} {t("wz_days_storage")}
            </p>
          </div>

          <div className="flex flex-col sm:items-end bg-white/10 backdrop-blur-md px-3.5 py-2.5 sm:p-4 rounded-xl border border-white/10 shrink-0 gap-1.5 w-full sm:w-auto">
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
              <span className="text-[10px] sm:text-xs uppercase font-semibold text-blue-200">{t("wz_total_all_inclusive_price")}</span>
              <span className="text-xl sm:text-3xl font-black text-white">₹{activePricing.total_payable.toLocaleString("en-IN")}</span>
            </div>
            {/* EMI Sub-Header Anchor */}
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
              <span className="text-[10px] text-blue-200 font-medium sm:hidden">
                {t("iqr_full_setup_inc")}
              </span>
              <button
                type="button"
                onClick={() => setShowEmiModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] sm:text-xs shadow-md transition-all active:scale-95 cursor-pointer group"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-950 group-hover:scale-110 transition-transform" />
                <span>{t("iqr_or_emi_mo", undefined, { amount: emiMonthlyAmount.toLocaleString("en-IN") })}</span>
                <span className="bg-slate-950 text-amber-300 text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full ml-0.5">
                  {t("iqr_plans_info")}
                </span>
              </button>
            </div>
            <span className="text-[10px] text-blue-200 font-medium hidden sm:block">
              {isWireless ? t("iqr_zero_cabling_inc") : `✓ ${t("wz_includes_hardware_wiring_install")}`}
            </span>
            {/* IN-HERO DIRECT BOOKING CTA */}
            <button
              type="button"
              onClick={onProceedToActualQuotation}
              disabled={isSaving}
              className="w-full mt-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm min-h-[44px] py-2 px-3.5 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-400/30 text-center"
            >
              <span>{isSaving ? t("iqr_finalizing") : t("iqr_book_token_btn")}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          </div>
        </div>

        {/* Value Badges Strip */}
        <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[10px] sm:text-xs font-semibold text-blue-100">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="whitespace-normal break-words leading-tight">{t("wz_100_genuine")}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-normal break-words leading-tight">{t("wz_free_onsite_install")}</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="whitespace-normal break-words leading-tight">{t("wz_1_year_warranty")}</span>
          </div>
        </div>
      </div>

      {/* 3. COMPACT SPECIFICATIONS — 2x3 on mobile, 3x2 on tablet, 6x1 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Camera className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_cameras")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-snug">{camCount}x {isWireless ? "Wi-Fi" : techName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Server className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_recorder")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-snug">{recorderDisplayName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs flex flex-col justify-between">
          <div>
            <HardDrive className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_storage")}</div>
            <div className="text-xs font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-snug">{isWireless ? `${storageCap} MicroSD (${selection.recording_days || 7} ${t("wz_days")})` : `${selection.recording_days || 7} ${t("wz_days")}`}</div>
          </div>
          {!isWireless && (
            <div className="flex items-center justify-center gap-1 mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
              {[7, 15, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => updateSelection({ recording_days: days })}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                    (selection.recording_days || 7) === days
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                  }`}
                  title={t("iqr_switch_days", undefined, { days: String(days) })}
                >
                  {days}d
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Cable className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_cabling")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-tight">
            {isWireless 
              ? (selection.power_wiring_option === "wire_needed" 
                  ? t("iqr_2core_wire", undefined, { meters: String(selection.total_power_cable_meters || (camCount * 10)) })
                  : t("iqr_zero_video_cabling")) 
              : t("wz_copper_wire")}
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Wrench className="w-4 h-4 text-purple-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_installation")}</div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-normal break-words leading-tight">{t("wz_included")}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <ShieldCheck className="w-4 h-4 text-rose-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_warranty")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white whitespace-normal break-words leading-tight">{t("wz_1_year_brand")}</div>
        </div>
      </div>

      {/* AFFORDABILITY & FLEXIBILITY TWIN-TRUST STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Easy EMI Option */}
        <div 
          onClick={() => setShowEmiModal(true)}
          className="bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 hover:border-blue-500 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-xs hover:shadow-md cursor-pointer transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {t("iqr_easy_emi_from", undefined, { amount: emiMonthlyAmount.toLocaleString("en-IN") })}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                  {t("iqr_nocost_badge")}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-normal leading-snug">
                {t("iqr_razorpay_banks")}
              </p>
            </div>
          </div>
          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center shrink-0">
            <span>{t("iqr_plans")}</span> <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </div>
        </div>

        {/* Book with ₹500 Token Advance */}
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 flex items-center justify-between gap-2.5 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {t("iqr_pay_after_install")}
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                  {t("iqr_token_badge")}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 whitespace-normal leading-snug">
                {t("iqr_token_desc")}
              </p>
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>
      </div>

      {/* Guaranteed All-Inclusive Fixed Price Inclusions Checklist */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 sm:p-4 my-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <span>✅</span> {t("iqr_fixed_price_hdr")}
          </span>
          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-extrabold px-2 py-0.5 rounded-full shrink-0">
            {t("iqr_100_inclusions")}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <span className="flex items-center gap-1">{t("iqr_inc_hdd")}</span>
          <span className="flex items-center gap-1">{t("iqr_inc_cable")}</span>
          <span className="flex items-center gap-1">{t("iqr_inc_smps")}</span>
          <span className="flex items-center gap-1">{t("iqr_inc_jbox")}</span>
          <span className="flex items-center gap-1">{t("iqr_inc_jacks")}</span>
          <span className="flex items-center gap-1">{t("iqr_inc_warranty")}</span>
        </div>
      </div>

      {/* Visual Night Vision Preview Simulation */}
      <details className="group bg-slate-900 text-white rounded-2xl border border-slate-800 p-3.5 my-3 shadow-sm">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-bold text-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span>{t("iqr_nv_sim_title")}</span>
          </div>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold group-open:hidden shrink-0">
            {t("iqr_compare_ir_color")}
          </span>
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-slate-400 block mb-1">{t("iqr_std_ir_bw")}</span>
            <div className="min-h-24 bg-slate-950 rounded-lg flex items-center justify-center text-slate-400 border border-slate-800 text-center p-2.5 text-[11px] leading-relaxed">
              {t("iqr_std_ir_desc")}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500/50">
            <span className="font-bold text-amber-300 block mb-1">{t("iqr_colorvu_title")}</span>
            <div className="min-h-24 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-200 border border-blue-500/30 text-center p-2.5 text-[11px] leading-relaxed">
              {t("iqr_colorvu_desc")}
            </div>
          </div>
        </div>
      </details>

      {/* 2-Tap Preferred Survey Appointment Slot */}
      <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 my-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>🗓️</span> {t("iqr_sched_visit_hdr")}
          </span>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full shrink-0">
            {t("iqr_cert_tech")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{t("iqr_tap1_day")}</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {["Tomorrow", "Sunday", "Monday"].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPreferredSurveyDate(day)}
                  className={`p-2 rounded-xl border text-center transition-all break-words ${
                    preferredSurveyDate === day
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                  }`}
                >
                  {day === "Tomorrow" ? t("iqr_day_tomorrow") : day === "Sunday" ? t("iqr_day_sunday") : t("iqr_day_monday")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">{t("iqr_tap2_time")}</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[
                { id: "Morning (10 AM - 1 PM)", label: t("iqr_slot_morning"), time: "10am-1pm" },
                { id: "Afternoon (2 PM - 5 PM)", label: t("iqr_slot_afternoon"), time: "2pm-5pm" },
                { id: "Evening (5 PM - 8 PM)", label: t("iqr_slot_evening"), time: "5pm-8pm" },
              ].map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setPreferredSurveySlot(slot.id)}
                  className={`p-1.5 rounded-xl border text-center transition-all ${
                    preferredSurveySlot === slot.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-[11px]">{slot.label}</span>
                  <span className="block text-[9px] font-normal opacity-80">{slot.time}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BRAND UNIFICATION BANNER */}
      <div className="bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 mb-3 space-y-2.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-4">
          <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{t("iqr_match_my_brand")}</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {t("iqr_brand_mix_desc")}
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button 
            onClick={() => updateSelection({ brand_preference: 'all' })}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${selection.brand_preference === 'all' || !selection.brand_preference || getCanonicalBrandKey(selection.brand_preference) === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
          >
            <span>{t("iqr_mixed_best_price")}</span>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white font-black">{t("iqr_lowest_price_badge")}</span>
          </button>
          {getUniqueCanonicalBrands(products, "cctv_camera").map(brand => {
            const isSelected = getCanonicalBrandKey(selection.brand_preference) === getCanonicalBrandKey(brand);
            const brandBadge = brand.toLowerCase().includes("cp plus") ? t("iqr_badge_cpplus") : brand.toLowerCase().includes("hikvision") ? t("iqr_badge_hikvision") : t("iqr_badge_verified");
            return (
              <button 
                key={brand}
                onClick={() => updateSelection({ brand_preference: brand })}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'}`}
              >
                <span>{brand}</span>
                <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{brandBadge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WIRELESS CAMERA POWER & CABLING PROVISION */}
      {isWireless && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                  {t("iqr_cam_power_avail")}
                </h4>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  {t("iqr_zero_video_cabling")}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {t("iqr_wifi_power_desc")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Option 1: Power Socket Nearby */}
            <button
              type="button"
              onClick={() => updateSelection({ power_wiring_option: "socket_available", power_cable_meters: 0, total_power_cable_meters: 0 })}
              className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                (!selection.power_wiring_option || selection.power_wiring_option === "socket_available")
                  ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 dark:text-emerald-200 shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-xs font-bold">{t("iqr_power_nearby")}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300 shrink-0">
                  {t("iqr_included_free")}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {t("iqr_power_nearby_desc")}
              </p>
            </button>

            {/* Option 2: Need 2-Core Electrical Power Wire */}
            <button
              type="button"
              onClick={() => updateSelection({ 
                power_wiring_option: "wire_needed", 
                power_cable_meters: selection.power_cable_meters || 10,
                total_power_cable_meters: selection.total_power_cable_meters || (camCount * 10)
              })}
              className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                selection.power_wiring_option === "wire_needed"
                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 dark:text-amber-200 shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-xs font-bold">{t("iqr_need_2core")}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 shrink-0">
                  @ ₹10/m
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {t("iqr_need_2core_desc")}
              </p>
            </button>

            {/* Option 3: Site Survey */}
            <button
              type="button"
              onClick={() => updateSelection({ power_wiring_option: "site_survey", power_cable_meters: 0, total_power_cable_meters: 0 })}
              className={`p-3 rounded-xl border text-left transition-all relative cursor-pointer ${
                selection.power_wiring_option === "site_survey"
                  ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 dark:text-blue-200 shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-xs font-bold">{t("iqr_check_survey")}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 shrink-0">
                  {t("iqr_pay_actuals")}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                {t("iqr_check_survey_desc")}
              </p>
            </button>
          </div>

          {/* Meter selector if wire_needed */}
          {selection.power_wiring_option === "wire_needed" && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 sm:p-3 rounded-xl">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                {t("iqr_est_2core_len")}
              </span>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const current = selection.total_power_cable_meters || (camCount * 10);
                    const next = Math.max(5, current - 5);
                    updateSelection({ total_power_cable_meters: next, power_cable_meters: Math.ceil(next / camCount) });
                  }}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center hover:bg-zinc-100 active:scale-95"
                >
                  -
                </button>
                <span className="text-xs font-black min-w-[50px] text-center text-zinc-900 dark:text-white">
                  {selection.total_power_cable_meters || (camCount * 10)}m
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = selection.total_power_cable_meters || (camCount * 10);
                    const next = current + 5;
                    updateSelection({ total_power_cable_meters: next, power_cable_meters: Math.ceil(next / camCount) });
                  }}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold flex items-center justify-center hover:bg-zinc-100 active:scale-95"
                >
                  +
                </button>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 ml-1">
                  {t("iqr_per_cam_m", "(~{m}m / camera)", { m: String(Math.round((selection.total_power_cable_meters || (camCount * 10)) / camCount)) })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
          {/* MOBILE ITEM CARDS (sm:hidden) */}
          <div className="sm:hidden space-y-2">
            {activePricing.items.map((item, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-zinc-900 dark:text-white break-words leading-snug">{translateProductName(item.display_name)}</div>
                    {item.brand && (
                      <div className="inline-block mt-0.5 mb-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {getCanonicalBrandName(item.brand) === "Budget Brand" ? t("dvg_brand_budget_lbl", "Budget Brand") : getCanonicalBrandName(item.brand)}
                      </div>
                    )}
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {t("wz_qty")}: {item.qty} {item.unit_price > 0 ? t("iqr_each", "• ₹{price} each", { price: item.unit_price.toLocaleString("en-IN") }) : `• ${t("wz_free_included", "Included (Free)")}`}
                  </div>
                </div>
                <div className="text-xs font-black text-zinc-900 dark:text-white shrink-0">
                  {item.line_total > 0 ? `₹${item.line_total.toLocaleString("en-IN")}` : <span className="text-emerald-600 text-[11px]">{t("iqr_free_badge")}</span>}
                </div>
              </div>
            ))}
            {activePricing.addons && activePricing.addons.length > 0 && activePricing.addons.map((addon, idx) => (
              <div key={`addon-${idx}`} className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-blue-950 dark:text-blue-200 break-words leading-snug">{translateProductName(addon.display_name)}</div>
                  <div className="text-[11px] text-blue-700/80 dark:text-blue-400">{t("iqr_addon_bullet")} {t("wz_qty")}: {addon.qty || 1}</div>
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
                              {getCanonicalBrandName(item.brand) === "Budget Brand" ? t("dvg_brand_budget_lbl", "Budget Brand") : getCanonicalBrandName(item.brand)}
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
                  <span>{t("iqr_addons_line")}</span>
                  <span className="font-bold">+₹{activePricing.addons_total.toLocaleString("en-IN")}</span>
                </div>
              )}
              {activePricing.referral_discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>{t("iqr_discount_promo")}</span>
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

              {/* High-Trust Token Advance Callout */}
              <div className="mt-3 pt-3 border-t border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    {t("iqr_token_due_today")}
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-300 text-sm shrink-0">₹500</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span>{t("iqr_bal_post_test")}</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    ₹{(activePricing.total_payable - 500).toLocaleString("en-IN")}
                  </span>
                </div>
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {t("iqr_live_pricing")}
            </div>
          </div>
        </div>

        {(() => {
          const groupedAccessories = allAccessories.reduce((groups, item) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
            return groups;
          }, {} as Record<string, typeof allAccessories[0][]>);

          const categoryDescriptions: Record<string, string> = {
            [t("addon_cat_enclosure", "Safety Racks & Boxes")]: t("addon_desc_cat_enclosure", "Protect your equipment from theft, dust, and weather damage."),
            [t("addon_cat_display", "TV & Display Screens")]: t("addon_desc_cat_display", "Dedicated commercial screens for 24/7 continuous live viewing."),
            [t("addon_cat_internet", "Internet (For Mobile View)")]: t("addon_desc_cat_internet", "Required for mobile phone access if you don't have a local broadband connection."),
            [t("addon_cat_warranty", "Maintenance & Warranty")]: t("addon_desc_cat_warranty", "Extend your peace of mind with our priority maintenance contracts."),
            [t("addon_cat_cables", "Wires & Cables")]: t("addon_desc_cat_cables", "Essential links to connect your recorder to a local TV or monitor.")
          };

          const categoryIcons: Record<string, React.ReactNode> = {
            [t("addon_cat_enclosure", "Safety Racks & Boxes")]: <Box className="w-5 h-5 text-indigo-500" />,
            [t("addon_cat_display", "TV & Display Screens")]: <Monitor className="w-5 h-5 text-indigo-500" />,
            [t("addon_cat_internet", "Internet (For Mobile View)")]: <Wifi className="w-5 h-5 text-indigo-500" />,
            [t("addon_cat_warranty", "Maintenance & Warranty")]: <ShieldCheck className="w-5 h-5 text-indigo-500" />,
            [t("addon_cat_cables", "Wires & Cables")]: <Cable className="w-5 h-5 text-indigo-500" />
          };

          const categoryOrder = [
            t("addon_cat_enclosure", "Safety Racks & Boxes"),
            t("addon_cat_display", "TV & Display Screens"),
            t("addon_cat_internet", "Internet (For Mobile View)"),
            t("addon_cat_cables", "Wires & Cables"),
            t("addon_cat_warranty", "Maintenance & Warranty")
          ];

          const sortedCategories = Object.keys(groupedAccessories).sort((a, b) => {
            const idxA = categoryOrder.indexOf(a);
            const idxB = categoryOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          return (
            <div className="space-y-3 sm:space-y-4">
              {sortedCategories.map((category) => {
                const items = groupedAccessories[category] || [];
                const selectedItems = items.filter(acc => isAddonSelected(acc.id));
                const hasSelected = selectedItems.length > 0;
                const isCategoryOpen = !!openCategories[category];

                // Check for HDMI items in this category
                const hdmiItems = items.filter(acc => 
                  acc.id.startsWith("HDMI-") || 
                  acc.id.toLowerCase().includes("hdmi") || 
                  acc.title.toLowerCase().includes("hdmi")
                );
                const nonHdmiItems = items.filter(acc => !hdmiItems.includes(acc));
                const hasHdmiGroup = hdmiItems.length > 1;
                const selectedHdmi = hdmiItems.find(acc => isAddonSelected(acc.id));

                return (
                  <div 
                    key={category} 
                    className={`bg-white dark:bg-[#1d1d1f] border transition-all duration-200 rounded-2xl overflow-hidden shadow-xs ${
                      hasSelected
                        ? "border-blue-400 dark:border-blue-700/80 ring-1 ring-blue-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    {/* Collapsible Accordion Header */}
                    <div
                      onClick={() => toggleCategory(category)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleCategory(category);
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3.5 sm:p-5 cursor-pointer transition-colors select-none ${
                        hasSelected 
                          ? "bg-blue-50/40 dark:bg-blue-950/20" 
                          : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 transition-colors ${
                          hasSelected 
                            ? "bg-blue-600 text-white shadow-xs" 
                            : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                        }`}>
                          {categoryIcons[category] || <Box className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
                              {category}
                            </h3>
                            {hasSelected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                <Check className="w-3 h-3 stroke-[3]" />
                                {selectedItems.length === 1 ? selectedItems[0].title : t("iqr_n_added", "{count} Added", { count: String(selectedItems.length) })}
                                <span className="opacity-75 font-normal ml-0.5">
                                  (+₹{selectedItems.reduce((sum, i) => sum + i.price, 0).toLocaleString("en-IN")})
                                </span>
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                {hasHdmiGroup ? t("iqr_lengths_avail", "{count} Lengths Available", { count: String(hdmiItems.length) }) : `${items.length} ${items.length === 1 ? t("iqr_opt_singular") : t("iqr_opt_plural")}`}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate hidden sm:block">
                            {categoryDescriptions[category] || ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {hasSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectedItems.forEach(item => handleToggle(item.id, item.title));
                            }}
                            className="text-[11px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-2 py-1 rounded-lg transition-colors hidden md:inline-flex items-center gap-1 cursor-pointer"
                            title={t("iqr_remove_items")}
                          >
                            <X className="w-3 h-3" />
                            <span>{t("iqr_remove")}</span>
                          </button>
                        )}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                          isCategoryOpen 
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200" 
                            : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                        }`}>
                          {isCategoryOpen ? t("iqr_close") : (hasSelected ? t("iqr_modify") : t("iqr_select_plus"))}
                        </span>
                        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 transition-transform duration-200 ${
                          isCategoryOpen ? "rotate-180" : ""
                        }`} />
                      </div>
                    </div>

                    {/* Collapsible Content */}
                    {isCategoryOpen && (
                      <div className="p-3.5 sm:p-6 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30 space-y-4 animate-in fade-in-50 duration-200">
                        {categoryDescriptions[category] && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 sm:hidden">
                            {categoryDescriptions[category]}
                          </p>
                        )}

                        {/* Special Compact Variant Selector for HDMI Cables */}
                        {hasHdmiGroup && (
                          <div className="bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                                  <Cable className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white">
                                      {t("iqr_hdmi_title")}
                                    </h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                      {t("iqr_hdmi_badge")}
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {t("iqr_hdmi_desc")}
                                  </p>
                                </div>
                              </div>

                              {selectedHdmi && (
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                  <span>{selectedHdmi.title}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggle(selectedHdmi.id, selectedHdmi.title);
                                    }}
                                    className="ml-1 hover:text-red-600 dark:hover:text-red-400 text-zinc-400 transition-colors p-0.5 rounded cursor-pointer"
                                    title={t("iqr_remove_cable")}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Length Selection Pill Grid */}
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                                {t("iqr_choose_cable_len")}
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                {hdmiItems.map((hdmi) => {
                                  const isSelected = isAddonSelected(hdmi.id);
                                  const match = hdmi.title.match(/(\d+(?:\.\d+)?)\s*(?:MTR|M|Meter)/i);
                                  const meterLabel = match ? t("iqr_n_meter", "{m} Meter", { m: match[1] }) : hdmi.title;

                                  return (
                                    <button
                                      key={hdmi.id}
                                      type="button"
                                      onClick={() => handleToggle(hdmi.id, hdmi.title)}
                                      className={`group/pill flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border transition-all duration-150 cursor-pointer text-center relative ${
                                        isSelected
                                          ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                                          : "bg-zinc-50 dark:bg-zinc-800/80 hover:bg-blue-50/70 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700 text-zinc-800 dark:text-zinc-200 shadow-2xs"
                                      }`}
                                    >
                                      {hdmi.tag && (
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full mb-1 ${
                                          isSelected 
                                            ? "bg-blue-700 text-blue-100" 
                                            : "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 group-hover/pill:bg-blue-100"
                                        }`}>
                                          {hdmi.tag}
                                        </span>
                                      )}
                                      <span className="font-extrabold text-xs sm:text-sm">
                                        {meterLabel}
                                      </span>
                                      <span className={`text-[11px] mt-0.5 font-bold ${
                                        isSelected ? "text-blue-100" : "text-zinc-500 dark:text-zinc-400"
                                      }`}>
                                        +₹{hdmi.price.toLocaleString("en-IN")}
                                        <span className="text-[9px] font-normal ml-0.5 opacity-80">+{t("wz_gst")}</span>
                                      </span>
                                      {isSelected && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                              <span>{t("iqr_hdmi_note")}</span>
                              {selectedHdmi ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggle(selectedHdmi.id, selectedHdmi.title)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 font-bold underline cursor-pointer self-start sm:self-auto"
                                >
                                  {t("iqr_remove_from_quote")}
                                </button>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  {t("iqr_hdmi_tip")}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Standard Cards Grid for Non-HDMI items or other categories */}
                        {(!hasHdmiGroup ? items : nonHdmiItems).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                            {(!hasHdmiGroup ? items : nonHdmiItems).map((acc) => {
                              const selected = isAddonSelected(acc.id);
                              const Icon = acc.icon;

                              return (
                                <div
                                  key={acc.id}
                                  onClick={() => handleToggle(acc.id, acc.title)}
                                  className={`group cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border transition-all duration-200 flex flex-col justify-between ${
                                    selected
                                      ? "bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 shadow-xs hover:shadow-md"
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                      <div className={`p-2.5 rounded-xl ${selected ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"}`}>
                                        <Icon className="w-5 h-5" />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {acc.tag && (
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                            {acc.tag}
                                          </span>
                                        )}
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
                                      {selected ? t("iqr_added_check") : t("iqr_add_plus")}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* 4-PILLAR CUSTOMER PEACE-OF-MIND GUARANTEE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{t("qrc_p1_title")}</h5>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t("qrc_p1_desc")}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{t("qrc_p2_title")}</h5>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t("qrc_p2_desc")}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{t("qrc_p3_title")}</h5>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t("qrc_p3_desc")}</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-zinc-900 dark:text-white">{t("qrc_price_lock")}</h5>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{t("qrc_p4_desc")}</p>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM CTA BANNER & ACTION */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs uppercase tracking-widest text-blue-200 font-black">
            {t("iqr_ready_finalize")}
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("wz_total_amount_payable")} ₹{activePricing.total_payable.toLocaleString("en-IN")}
          </h3>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            {t("wz_includes_all_selected_desc")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          {onDownloadPdf && (
            <Button
              variant="outline"
              onClick={onDownloadPdf}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold text-xs px-4 py-2.5 rounded-full"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              {t("quote_download_pdf")}
            </Button>
          )}
          {onShareWhatsApp && (
            <Button
              variant="outline"
              onClick={onShareWhatsApp}
              className="w-full sm:w-auto bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/30 font-bold text-xs px-4 py-2.5 rounded-full"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              {t("iqr_share_wa")}
            </Button>
          )}
          <Button
            onClick={onProceedToActualQuotation}
            disabled={isSaving}
            className="w-full sm:w-auto bg-white hover:bg-zinc-100 text-blue-700 font-extrabold text-sm px-6 py-3 rounded-full shadow-lg transition-transform active:scale-95"
          >
            {isSaving ? t("iqr_finalizing") : t("wz_proceed_to_final_quotation")}
          </Button>
        </div>
      </div>
        </div>


      {/* EMI Breakdown Modal */}
      <EmiBreakdownModal
        isOpen={showEmiModal}
        onClose={() => setShowEmiModal(false)}
        totalAmount={activePricing.total_payable}
        packageName={`${brandName} ${isWireless ? t("dvg_wireless_full") : techName === "HD" ? t("iqr_standard_hd") : t("iqr_digital_ip")} ${t("wz_setup")}`}
        onProceed={onProceedToActualQuotation}
      />
    </div>
  );
}
