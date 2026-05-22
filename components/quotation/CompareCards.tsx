"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Check,
  ShieldCheck,
  Zap,
  Monitor,
  Camera,
  Eye,
  Mic,
  Network,
  PlusCircle,
  HardDrive,
  Info,
  ArrowDown,
  X,
  Moon,
  Activity,
  User,
  Home,
  Building2,
} from "lucide-react";
import type {
  Product,
  AppSettings,
  ConfiguratorSelection,
  RecommendedOutput,
  Addon,
} from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { calculateSystemScore } from "@/lib/system-score";
import { trackEvent } from "@/components/shared/TrackingProvider";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompareCardsProps {
  compareOptions: Array<{ technology: string; option: number | string }>;
  activeCheckoutOption: { technology: string; option: number | string } | null;
  onSelectCheckout: (option: { technology: string; option: number | string }) => void;

  cameraCount: number;
  recordingDays: number;
  products: Product[];
  addons: any[];
  settings: AppSettings;
  cablingDone: boolean;
  recommendation?: RecommendedOutput | null;
  /** The technology the customer explicitly chose in the wizard (IP / HD / undefined = not sure) */
  customerTechnology?: string;
  requestedFeatures: string[];
  selectedAddons: string[];
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
  activeOffer?: any;
}

// ─── Spec Row helper ─────────────────────────────────────────────────────────

function SpecRow({
  icon: FeatureIcon,
  label,
  sublabel,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-3 group/spec transition-all duration-300">
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
            active
              ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600"
          }`}
        >
          {FeatureIcon}
        </div>
        {/* Status indicator overlay */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 flex items-center justify-center ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}>
          {active ? (
            <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
          ) : (
            <X className="w-2.5 h-2.5 text-white stroke-[4]" />
          )}
        </div>
      </div>
      <div className="min-w-0 pt-0.5">
        <div
          className={`text-[11px] font-black uppercase tracking-tight leading-tight transition-colors ${
            active
              ? "text-zinc-900"
              : "text-zinc-400 opacity-60"
          }`}
        >
          {label}
        </div>
        <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-1 leading-tight opacity-80">
          {sublabel}
        </div>
      </div>
    </div>
  );
}

// ─── Addon Row helper ────────────────────────────────────────────────────────

function AddonRow({
  name,
  price,
  isMandatory,
}: {
  name: string;
  price: number;
  isMandatory: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 group/addon">
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={`w-4 h-4 rounded-sm flex items-center justify-center shrink-0 transition-colors ${
            isMandatory
              ? "bg-emerald-500"
              : "bg-zinc-100 dark:bg-zinc-800 group-hover/addon:bg-zinc-200 dark:group-hover/addon:bg-zinc-700"
          }`}
        >
          {isMandatory ? (
            <Check className="w-2.5 h-2.5 text-white" />
          ) : (
            <PlusCircle className="w-2.5 h-2.5 text-zinc-400" />
          )}
        </div>
        <span
          className={`text-[10px] font-bold leading-tight truncate ${
            isMandatory
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {name}
        </span>
      </div>
      <span
        className={`text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded ${
          isMandatory
            ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
            : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {isMandatory ? "Included" : `+₹${price.toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CompareCards({
  compareOptions,
  activeCheckoutOption,
  onSelectCheckout,
  cameraCount,
  recordingDays,
  products,
  addons,
  settings,
  cablingDone,
  recommendation,
  customerTechnology,
  requestedFeatures,
  selectedAddons,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
}: CompareCardsProps) {
  // ── Compute card data ──────────────────────────────────────────────────────
  const cardsData = useMemo(() => {
    return compareOptions
      .map((co) => {
        let plan_type: "budget" | "recommended" | "premium" = "recommended";
        if (typeof co.option === "number") {
          if (co.option === 1) plan_type = "budget";
          else if (co.option === 3) plan_type = "premium";
        }

        const selection: ConfiguratorSelection = {
          technology: co.technology,
          camera_count: cameraCount,
          recording_days: recordingDays,
          selected_camera_option: typeof co.option === "number" ? co.option : undefined,
          selected_camera_id: typeof co.option === "string" ? co.option : undefined,
          plan_type,
          selected_addons: selectedAddons,
          requested_features: requestedFeatures,
          picture_quality: "good",
        };

        const pricing = calculatePricing({
          selection,
          products,
          addons,
          settings,
          cablingDone,
          referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0,
          evaluatedAddonRules,
          activeOffer,
        });

        const selectedCamId = pricing.items.find(i => {
           const p = products.find(prod => prod.id === i.product_id);
           return p?.category === 'camera';
        })?.product_id;
        const camProduct = products.find(p => p.id === selectedCamId);
        // isRecommended: matches option number AND respects the customer's
        // chosen technology — fixes the bug where HD recommendations were
        // silently ignored due to a hardcoded "&& co.technology === IP" check.
        const isRecommended =
          recommendation?.camera_option === co.option &&
          co.technology === (customerTechnology ?? "IP");

        // Build add-on list for this card (only visible ones)
        const visibleAddons = (addons as Addon[]).filter((a) => {
          if (!a.is_active) return false;
          const rule = evaluatedAddonRules?.[a.id!];
          if (!rule || rule.action === "hide") return false;
          return true;
        });

        // ── System Score ─────────────────────────────────────────────────────────────
        const scoreResult = camProduct ? calculateSystemScore(camProduct, { recordingDays }) : null;

        // Derive spec flags from structured fields (fallback to technical_name if missing)
        const mp = camProduct?.resolution_mp ?? (camProduct?.technical_name?.toLowerCase().includes("5mp") ? 5 : camProduct?.technical_name?.toLowerCase().includes("4mp") ? 4 : 2);
        const is5MP = mp >= 5;
        const is4MP = mp >= 4;
        
        const nvType = camProduct?.night_vision_type ?? (camProduct?.technical_name?.toLowerCase().includes("color") ? "color" : "ir");
        const isColorNight = nvType === "color" || nvType === "dual_light" || nvType === "starlight";
        
        const hasAudio = camProduct?.has_audio === true || 
          (camProduct?.technical_name?.includes("mic") || camProduct?.technical_name?.includes("audio")) || 
          (typeof co.option === "number" && co.option > 1);
        const isIP = co.technology === "IP";

        // NVR / DVR info
        const recType =
          isIP ? "NVR" : "DVR";
        const nvrTechName = isIP
          ? `nvr_${cameraCount <= 4 ? "4ch" : cameraCount <= 8 ? "8ch" : "16ch"}`
          : `dvr_${cameraCount <= 4 ? "4ch" : cameraCount <= 8 ? "8ch" : "16ch"}`;
        const recProduct = products.find((p) =>
          p.technical_name?.startsWith(recType.toLowerCase())
        );

        // Storage label from recordingDays
        const storageLabel =
          recordingDays <= 7
            ? "7-Day Storage"
            : recordingDays <= 15
            ? "15-Day Storage"
            : recordingDays <= 30
            ? "1-Month Storage"
            : `${recordingDays}-Day Storage`;

        return {
          technology: co.technology,
          option: co.option,
          pricing,
          camProduct,
          recProduct,
          isRecommended,
          visibleAddons,
          // Spec flags
          is5MP,
          is4MP,
          isColorNight,
          hasAudio,
          isIP,
          storageLabel,
          recType,
          scoreResult,
        };
      })
      .sort((a, b) => a.pricing.total_payable - b.pricing.total_payable);
  }, [
    compareOptions,
    cameraCount,
    recordingDays,
    products,
    addons,
    settings,
    cablingDone,
    promoterDiscount,
    evaluatedAddonRules,
    recommendation,
    customerTechnology,
    requestedFeatures,
    selectedAddons,
    activeOffer,
  ]);

  // ── Savings badge: compare this card vs the most-expensive card ────────────
  const maxPrice = Math.max(
    ...cardsData.map((c) => c.pricing.total_payable)
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  if (cardsData.length === 0) {
    return (
      <div className="w-full p-12 rounded-[32px] border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <Camera className="w-6 h-6 text-zinc-400" />
        </div>
        <div>
          <p className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
            No Options Selected
          </p>
          <p className="text-xs font-semibold text-zinc-400 mt-1">
            Select up to 3 options from the comparison table below
          </p>
        </div>
        <div className="flex items-center gap-2 text-zinc-400">
          <ArrowDown className="w-4 h-4 animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Scroll to table
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      {/* Mobile: horizontal scroll carousel | Desktop: 3-col grid */}
      <div className="flex sm:grid sm:grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:overflow-visible">
        {/* Spacer for mobile scroll peek */}
      {cardsData.map((card, idx) => {
        const isCheckout =
          activeCheckoutOption?.technology === card.technology &&
          activeCheckoutOption?.option === card.option;

        // ── Tier label ──────────────────────────────────────────────────────
        // If customer chose HD and this card is IP → label it as "Smart Upgrade"
        const isUpgradeSuggestion = customerTechnology === "HD" && card.isIP;
        let tierName = idx === 0 ? "Standard" : idx === 1 ? "Value" : "Professional";
        if (isUpgradeSuggestion) tierName = "Smart Upgrade";
        else if (card.isRecommended) tierName = "Recommended";
        else if (idx === cardsData.length - 1 && cardsData.length > 1) {
          tierName = card.isIP ? "Elite" : "Premium";
        }

        // ── Savings vs most expensive ────────────────────────────────────────
        const savings = maxPrice - card.pricing.total_payable;
        const savingsPct = maxPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;
        const showSavings = savings > 0 && !isCheckout;

        // ── Resolution label ─────────────────────────────────────────────────
        const resLabel = card.is5MP
          ? "5MP Ultra-HD"
          : card.is4MP
          ? "4MP Pro-HD"
          : "2MP Full-HD";
        const resIcon = card.is5MP
          ? "text-purple-500 bg-purple-500"
          : card.is4MP
          ? "text-blue-500 bg-blue-500"
          : "text-zinc-400 bg-zinc-400";

        // ── Technology badge label ────────────────────────────────────────────
        const techBadgeLabel = card.isIP ? "IP · NVR · Cat6" : "HD · DVR · Coaxial";
        const techBadgeColor = card.isIP
          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/40"
          : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/40";

        // ── Price per camera ──────────────────────────────────────────────────
        const pricePerCam = cameraCount > 0
          ? Math.round(card.pricing.total_payable / cameraCount)
          : 0;

        // ── Card border / bg ─────────────────────────────────────────────────
        const cardClass = isCheckout
          ? "border-blue-600 bg-white shadow-[0_20px_60px_-15px_rgba(37,99,235,0.25)] scale-105 z-10 ring-[4px] ring-blue-600/10"
          : card.isRecommended
          ? "border-amber-400/60 bg-[#FAFAFA] hover:border-amber-500 shadow-xl hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(251,191,36,0.15)] transition-all duration-300 group"
          : "border-zinc-200 bg-[#FAFAFA] hover:border-zinc-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 group";

        return (
          <div
            key={`${card.technology}-${card.option}`}
            role="region"
            aria-labelledby={`tier-label-${idx}`}
            onClick={() => {
              trackEvent("select_plan", {
                technology: card.technology,
                option: card.option,
                price: card.pricing.total_payable
              });
              onSelectCheckout({
                technology: card.technology,
                option: card.option,
              });
            }}
            className={`relative p-5 sm:p-6 sm:p-7 rounded-[32px] sm:rounded-[36px] transition-all duration-300 cursor-pointer border-2 flex-none w-[82vw] sm:w-auto snap-center touch-manipulation active:scale-[0.98] ${cardClass.replace('scale-105', 'sm:scale-105')}`}
          >
            {/* ── Top badge ────────────────────────────────────────────────── */}
            {/* ── Recommendation badge ────────────────────────────────────── */}
            {card.isRecommended && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/30 whitespace-nowrap flex items-center gap-1.5 z-10 border border-white/20">
                <Zap className="w-3 h-3 fill-white animate-pulse" />
                Expert Recommendation
              </div>
            )}
            
            {/* ── Best For Tag ─────────────────────────────────────────── */}
            <div className="absolute top-4 right-4 opacity-10 dark:opacity-20 pointer-events-none">
              {idx === 0 ? (
                <Home className="w-12 h-12" />
              ) : idx === 1 ? (
                <Building2 className="w-12 h-12" />
              ) : (
                <Zap className="w-12 h-12" />
              )}
            </div>

            {/* ── Tier header ──────────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center mt-4 mb-5">
              <div
                id={`tier-label-${idx}`}
                className={`text-[9px] font-black uppercase tracking-[0.2em] mb-2 ${
                  isCheckout ? "text-blue-500"
                    : card.isRecommended ? "text-amber-500"
                    : isUpgradeSuggestion ? "text-indigo-500"
                    : "text-zinc-400"
                }`}
              >
                {tierName}
              </div>

              {/* System Score Badge */}
              {card.scoreResult && (
                <div className="mb-3 flex items-center justify-center">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    card.scoreResult.score >= 80 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400" 
                      : card.scoreResult.score >= 60 
                        ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/30 dark:text-blue-400"
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400"
                  }`}>
                    <div className="font-black text-[10px] tracking-widest uppercase">Score</div>
                    <div className="font-black text-xs leading-none">{card.scoreResult.score}<span className="text-[9px] opacity-60 font-bold">/100</span></div>
                  </div>
                </div>
              )}

              {/* Technology badge — HD/DVR vs IP/NVR */}
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border mb-3 ${techBadgeColor}`}>
                {card.isIP ? <Network className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                {techBadgeLabel}
              </div>

              <div
                className={`p-4 rounded-3xl mb-3 transition-all duration-500 group-hover:scale-110 ${
                  isCheckout ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30"
                    : card.isRecommended ? "bg-amber-500 text-white shadow-xl shadow-amber-500/30"
                    : isUpgradeSuggestion ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/30"
                    : "bg-white text-zinc-600 shadow-sm border border-zinc-100"
                }`}
                aria-label={`${card.technology} camera system`}
              >
                {card.isIP ? <Network className="w-7 h-7" /> : <Monitor className="w-7 h-7" />}
              </div>
              <h4
                className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight text-center px-2"
                title={card.camProduct?.display_name}
              >
                {card.camProduct?.brand && (
                  <span className="block text-[10px] text-blue-600 dark:text-blue-400 mb-1">{card.camProduct.brand}</span>
                )}
                {card.camProduct?.display_name || `${card.technology} Option ${card.option}`}
              </h4>
            </div>

            {/* ── Price ────────────────────────────────────────────────────── */}
            <div
              className={`text-center mb-5 py-6 rounded-3xl animate-in fade-in zoom-in-95 duration-200 border ${
                isCheckout
                  ? "bg-blue-50/50 border-blue-100"
                  : "bg-white border-zinc-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
              }`}
            >
              <div className="flex items-baseline justify-center">
                <span
                  className={`text-base font-bold mr-1 ${
                    isCheckout
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-zinc-400"
                  }`}
                >
                  ₹
                </span>
                <span
                  className={`text-3xl md:text-4xl font-black tracking-tighter leading-none ${
                    isCheckout
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {card.pricing.total_payable.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-[9px] font-black text-zinc-400 mt-1.5 uppercase tracking-[0.15em]">
                Incl. GST &amp; Installation
              </div>
              {/* Price per camera — helps benchmark against competitor quotes */}
              <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 mt-1">
                ₹{pricePerCam.toLocaleString("en-IN")}<span className="font-medium text-zinc-400"> / camera</span>
              </div>
              {/* Context: what this price is based on */}
              <div className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                {cameraCount} cameras · {recordingDays} days recording
              </div>
              
              {/* ── Savings badge (Moved here to prevent overlap) ───────────── */}
              {showSavings && (
                <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Save ₹{savings.toLocaleString("en-IN")} ({savingsPct}%)
                  </span>
                </div>
              )}

              {promoterDiscount &&
                (promoterDiscount.percent > 0 || promoterDiscount.flat > 0) && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                    <Check className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Partner Discount Applied
                    </span>
                  </div>
                )}
            </div>

            {/* What's Included mini-list */}
            <div className="mb-5 pb-4 border-b border-zinc-100 dark:border-zinc-800/60">
              <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.18em] mb-2.5">
                What&apos;s Included
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {(() => {
                  const recorderItem = card.pricing.items.find(i => products.find(p => p.id === i.product_id)?.category === 'recorder');
                  const storageItem = card.pricing.items.find(i => {
                      const p = products.find(p => p.id === i.product_id);
                      return p?.category === 'accessory' && p.technical_name.toLowerCase().includes('hdd');
                  });
                  const cableItem = card.pricing.items.find(i => products.find(p => p.id === i.product_id)?.category === 'cable');
                  
                  return [
                    { label: `${cameraCount}× ${card.camProduct?.brand ? card.camProduct.brand + " " : ""}${card.camProduct?.display_name ?? card.technology + " Camera"}`, icon: "📷" },
                    { label: recorderItem ? `${recorderItem.qty}× ${recorderItem.brand ? recorderItem.brand + " " : ""}${recorderItem.display_name}` : `1× ${card.recType} (${cameraCount <= 4 ? "4" : cameraCount <= 8 ? "8" : "16"}-Ch Recorder)`, icon: "📺" },
                    { label: storageItem ? `${storageItem.qty}× ${storageItem.brand ? storageItem.brand + " " : ""}${storageItem.display_name}` : "1× 1TB Surveillance HDD", icon: "💾" },
                    { label: cableItem ? `~${cableItem.qty}m ${cableItem.display_name}` : (card.isIP ? `Cat6 UTP Cable (~${cameraCount * 25}m)` : `RG59 Coaxial (~${cameraCount * 25}m)`), icon: "🛡️" },
                    { label: "Professional Installation & Testing", icon: "🔧" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span className="text-[11px] leading-none shrink-0">{item.icon}</span>
                      <span className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 leading-snug truncate" title={item.label}>{item.label}</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* ── Hardware Specs ────────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.18em] mb-4">
                Hardware Specifications
              </p>

              {/* System Type */}
              <SpecRow
                icon={<ShieldCheck className="w-5 h-5" />}
                label={card.isIP ? "Smart IP Network" : "Analog HD Pro"}
                sublabel={
                  card.isIP
                    ? "Digital, POE/WiFi cabling"
                    : "Traditional coaxial cabling"
                }
                active={true}
              />
 
              {/* Resolution */}
              <SpecRow
                icon={<Monitor className="w-5 h-5" />}
                label={resLabel}
                sublabel="Camera sensor resolution"
                active={true}
              />
 
              {/* Night Vision */}
              <SpecRow
                icon={<Moon className="w-5 h-5" />}
                label={
                  card.isColorNight
                    ? "Full-Color Night"
                    : "IR B&W Night Vision"
                }
                sublabel="Low-light performance"
                active={true}
              />
 
              {/* Audio */}
              <SpecRow
                icon={<Mic className="w-5 h-5" />}
                label={card.hasAudio ? "Built-in Mic" : "No Audio"}
                sublabel="Ambient sound capture"
                active={card.hasAudio}
              />
 
              {/* Recorder */}
              <SpecRow
                icon={<Activity className="w-5 h-5" />}
                label={`${card.recType} Hub`}
                sublabel={`${cameraCount}-channel recording`}
                active={true}
              />
 
              {/* Storage */}
              <SpecRow
                icon={<HardDrive className="w-5 h-5" />}
                label={card.storageLabel}
                sublabel={`${recordingDays} days retention`}
                active={true}
              />
            </div>

            {/* ── Add-Ons Section ───────────────────────────────────────────── */}
            {card.visibleAddons.length > 0 && (
              <div className="mt-5 pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800/60 space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.18em]">
                    Add-Ons
                  </p>
                  <div
                    className="group/info relative"
                    title="Mandatory add-ons are auto-included based on your site profile. Optional add-ons can be added before checkout."
                  >
                    <Info className="w-3 h-3 text-zinc-300 dark:text-zinc-700 group-hover/info:text-zinc-500 cursor-help transition-colors" />
                  </div>
                </div>
                {card.visibleAddons.slice(0, 4).map((addon: Addon) => {
                  const rule = evaluatedAddonRules?.[addon.id!];
                  const isMandatory = rule?.action === "show_mandatory";
                  return (
                    <AddonRow
                      key={addon.id}
                      name={addon.display_name}
                      price={addon.price}
                      isMandatory={isMandatory}
                    />
                  );
                })}
                {card.visibleAddons.length > 4 && (
                  <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 pl-6">
                    +{card.visibleAddons.length - 4} more add-ons available
                  </p>
                )}
              </div>
            )}

            {/* ── CTA ──────────────────────────────────────────────────────── */}
            <button
              aria-pressed={isCheckout}
              className={`w-full mt-5 sm:mt-6 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[10px] transition-all duration-300 touch-manipulation active:scale-[0.97] ${
                isCheckout
                  ? "bg-blue-600 text-white shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 group-hover:shadow-md"
              }`}
            >
              {isCheckout ? "✓ Selected" : "Choose Plan"}
            </button>
          </div>
        );
      })}
      </div>
      {/* Mobile swipe hint */}
      <div className="flex sm:hidden items-center justify-center gap-2 mt-3">
        <div className="flex gap-1.5">
          {cardsData.map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          ))}
        </div>
        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Swipe to compare</span>
      </div>
    </div>
  );
}
