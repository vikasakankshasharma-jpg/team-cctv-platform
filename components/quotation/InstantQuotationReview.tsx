"use client";

import React, { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import type { Lead, PricingResult, Product, Addon, AppSettings } from "@/types";
import { 
  ArrowLeft, Check, CheckCircle2, ShieldCheck, Camera, HardDrive, Server, 
  Cable, Monitor, Wifi, Box, FileText, Sparkles, 
  ChevronRight, ChevronDown, Wrench, Shield, Layers, X, Plus, Zap
} from "lucide-react";
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
    localized = localized.replace("Budget Brand HDMI Cable", "High-Speed HDMI Cable");
    localized = localized.replace("Budget Brand Display 19 inch", "19\" Security LED Display");
    localized = localized.replace("Budget Brand 4G Router", "4G SIM WiFi Router (Dual Antenna)");
    localized = localized.replace("Budget Brand 2U Rack for Recorder", "2U Metal DVR/NVR Rack");
    localized = localized.replace("Budget Brand 4U Rack for Recorder", "4U Metal DVR/NVR Rack");
    localized = localized.replace("Budget Brand PVC Rack for PoE Switch", "PVC Weatherproof Rack");
    return localized;
  };

  const { selection, toggleAddon, updateSelection } = useConfiguratorStore();
  const [showAdvancedCustomizer, setShowAdvancedCustomizer] = useState(false);
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
    ? "None (MicroSD / App)" 
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
      price: products.find(p => p.id === "ACC-2U-RACK-RECORDER" || p.sku === "ACC-2U-RACK-RECORDER")?.unit_price || 490,
      icon: Box,
      category: t("addon_cat_enclosure", "Safety Racks & Boxes"),
      tag: t("addon_tag_recommended", "Recommended")
    },
    {
      id: "ACC-4U-RACK-RECORDER",
      title: t("addon_4u_rack_title", "4U Metal DVR/NVR Rack"),
      description: t("addon_4u_rack_desc", "Heavy-duty 4U rack with ventilation, fits recorder, PoE switch, router, and power backups."),
      price: products.find(p => p.id === "ACC-4U-RACK-RECORDER" || p.sku === "ACC-4U-RACK-RECORDER")?.unit_price || 630,
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
      price: products.find(p => p.id === "DISP-19-INCH" || p.sku === "DISP-19-INCH")?.unit_price || 2415,
      icon: Monitor,
      category: t("addon_cat_display", "TV & Display Screens"),
      tag: t("addon_tag_popular", "Popular")
    },
    {
      id: "ACC-4G-ROUTER",
      title: t("addon_4g_router_title", "4G SIM WiFi Router (Dual Antenna)"),
      description: t("addon_4g_router_desc", "High-speed 4G router for remote mobile phone viewing without any broadband or landline connection."),
      price: products.find(p => p.id === "ACC-4G-ROUTER" || p.sku === "ACC-4G-ROUTER")?.unit_price || 1885,
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
      price: products.find(p => p.id === "HDMI-1.5M" || p.sku === "HDMI-1.5M")?.unit_price || 84,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_compact", "Compact")
    },
    {
      id: "HDMI-3M",
      title: t("addon_hdmi_title", "High-Speed HDMI Cable (3 MTR)"),
      description: t("addon_hdmi_desc", "Gold-plated 4K-ready HDMI cable to connect your DVR/NVR directly to TV or monitor."),
      price: products.find(p => p.id === "HDMI-3M" || p.sku === "HDMI-3M")?.unit_price || 168,
      icon: Cable,
      category: t("addon_cat_cables", "Wires & Cables"),
      tag: t("addon_tag_essential", "Essential")
    },
    {
      id: "HDMI-5M",
      title: t("addon_hdmi_5m_title", "High-Speed HDMI Cable (5 MTR)"),
      description: t("addon_hdmi_5m_desc", "Extended 5-meter run for wall-mounted TV or desk-to-rack connection."),
      price: products.find(p => p.id === "HDMI-5M" || p.sku === "HDMI-5M")?.unit_price || 252,
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
    let cat = (a.category || "General Accessories").toString();
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
      description: (a as any).description || "Optional system upgrade or accessory.",
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
      toast.success(`Switched HDMI cable to ${title}`);
    } else if (!isCurrentlySelected) {
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
              {brandName} {isWireless ? "Smart Wireless (Wi-Fi / 4G)" : techName === "HD" ? t("wz_standard_hd") : t("wz_premium_ip")} {t("wz_setup")}
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
            <span className="hidden sm:block text-[9px] text-emerald-300 font-semibold mt-0.5">
              ✓ {isWireless ? "Zero Video Cabling • High Endurance MicroSD • Onsite Setup" : t("wz_includes_hardware_wiring_install")}
            </span>
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
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{camCount}x {isWireless ? "Wi-Fi" : techName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Server className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_recorder")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{recorderDisplayName}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <HardDrive className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_storage")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{isWireless ? `${storageCap} MicroSD (${selection.recording_days || 7}d)` : `${selection.recording_days || 7} ${t("wz_days")}`}</div>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-center shadow-xs">
          <Cable className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{t("wz_label_cabling")}</div>
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
            {isWireless 
              ? (selection.power_wiring_option === "wire_needed" 
                  ? `2-Core Wire (~${selection.total_power_cable_meters || (camCount * 10)}m)` 
                  : "Zero Video Cabling") 
              : t("wz_copper_wire")}
          </div>
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
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${selection.brand_preference === 'all' || !selection.brand_preference || getCanonicalBrandKey(selection.brand_preference) === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
          >
            Mixed (Best Price)
          </button>
          {getUniqueCanonicalBrands(products, "cctv_camera").map(brand => {
            const isSelected = getCanonicalBrandKey(selection.brand_preference) === getCanonicalBrandKey(brand);
            return (
              <button 
                key={brand}
                onClick={() => updateSelection({ brand_preference: brand })}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
              >
                {brand}
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
                  Camera Power Point Availability
                </h4>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Zero Video Cabling
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Wi-Fi & 4G cameras transmit video wirelessly. Each camera includes a manufacturer power adapter (1.5m). Select your site power scenario:
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Power Socket Nearby</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300">
                  Included (₹0)
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Power socket within 1.5m of camera. Camera plugs directly into AC point.
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Need Electrical Wire</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300">
                  @ ₹10/m
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                No plug point near camera. Run 2-core copper electrical wire from switchboard.
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
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">Check on Site Survey</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300">
                  Pay on Actuals
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                Free survey. Technician will measure distance on site and bill wire only if required.
              </p>
            </button>
          </div>

          {/* Meter selector if wire_needed */}
          {selection.power_wiring_option === "wire_needed" && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 sm:p-3 rounded-xl">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                2-Core Electrical Wire Estimated Length:
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
                  (~{Math.round((selection.total_power_cable_meters || (camCount * 10)) / camCount)}m / camera)
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
                  <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">{translateProductName(item.display_name)}</div>
                    {item.brand && (
                      <div className="inline-block mt-0.5 mb-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {getCanonicalBrandName(item.brand)}
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
                              {getCanonicalBrandName(item.brand)}
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Real-Time Pricing
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
                                {selectedItems.length === 1 ? selectedItems[0].title : `${selectedItems.length} Added`}
                                <span className="opacity-75 font-normal ml-0.5">
                                  (+₹{selectedItems.reduce((sum, i) => sum + i.price, 0).toLocaleString("en-IN")})
                                </span>
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                                {hasHdmiGroup ? `${hdmiItems.length} Lengths Available` : `${items.length} ${items.length === 1 ? "Option" : "Options"}`}
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
                            title="Remove selected items"
                          >
                            <X className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                          isCategoryOpen 
                            ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200" 
                            : "bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                        }`}>
                          {isCategoryOpen ? "Close" : (hasSelected ? "Modify" : "+ Select")}
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
                                      High-Speed 4K HDMI Cable
                                    </h4>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                      Gold Plated 4K 60Hz
                                    </span>
                                  </div>
                                  <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Ultra-clear video & audio transmission from your DVR/NVR directly to a local TV or monitor.
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
                                    title="Remove Cable"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Length Selection Pill Grid */}
                            <div className="space-y-2">
                              <label className="text-[10px] sm:text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
                                Choose Cable Length:
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                {hdmiItems.map((hdmi) => {
                                  const isSelected = isAddonSelected(hdmi.id);
                                  const match = hdmi.title.match(/(\d+(?:\.\d+)?)\s*(?:MTR|M|Meter)/i);
                                  const meterLabel = match ? `${match[1]} Meter` : hdmi.title;

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
                              <span>* Shielded 4K 60Hz high-bandwidth transmission with gold connectors.</span>
                              {selectedHdmi ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggle(selectedHdmi.id, selectedHdmi.title)}
                                  className="text-red-600 hover:text-red-700 dark:text-red-400 font-bold underline cursor-pointer self-start sm:self-auto"
                                >
                                  Remove from quotation
                                </button>
                              ) : (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  Tip: 3 Meter is the standard recommended length for wall-mounted TVs.
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
                                      {selected ? "✓ Added" : "+ Add"}
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
