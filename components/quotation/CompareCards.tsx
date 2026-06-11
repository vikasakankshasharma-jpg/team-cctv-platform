"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Check, Zap, Monitor, Camera, Network, PlusCircle, ArrowDown, X, Info, Home, Building2, Settings2, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, AppSettings, ConfiguratorSelection, RecommendedOutput, Addon } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { calculateSystemScore } from "@/lib/system-score";
import { trackEvent } from "@/components/shared/TrackingProvider";
import { useConfiguratorStore } from "@/store/configurator";

const BRAND_DISPLAY: Record<string, string> = {
  "cpplus": "CP Plus", "cp-plus": "CP Plus", "cp plus": "CP Plus",
  "wd": "WD",
  "seagate": "Seagate",
  "prama": "Prama",
  "hikvision": "Hikvision",
  "dahua": "Dahua",
  "trueview": "Trueview",
  "d-link": "D-Link",
  "tp-link": "TP-Link",
};

function normalizeBrand(brand?: string | null): string {
  if (!brand) return "Premium";
  return BRAND_DISPLAY[brand.toLowerCase()] || brand;
}


interface CompareCardsProps {
  compareOptions: Array<{ technology: string; option: number | string }>;
  activeCheckoutOption: { technology: string; option: number | string } | null;
  onSelectCheckout: (option: { technology: string; option: number | string }) => void;
  selection: ConfiguratorSelection;
  products: Product[];
  addons: any[];
  settings: AppSettings;
  cablingDone: boolean;
  recommendation?: RecommendedOutput | null;
  customerTechnology?: string;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
  activeOffer?: any;
}

function AddonRow({ name, price, isMandatory }: { name: string; price: number; isMandatory: boolean; }) {
  return (
    <div className="flex items-center justify-between gap-2 group/addon py-1 border-b border-[#f5f5f7] dark:border-[#2d2d2f] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${isMandatory ? "bg-emerald-500" : "bg-[#f5f5f7] dark:bg-[#2d2d2f]"}`}>
          {isMandatory ? <Check className="w-2.5 h-2.5 text-white" /> : <PlusCircle className="w-2.5 h-2.5 text-[#86868b]" />}
        </div>
        <span className={`text-[11px] font-medium truncate ${isMandatory ? "text-[#1d1d1f] dark:text-white" : "text-[#86868b]"}`}>
          {name}
        </span>
      </div>
      <span className={`text-[10px] font-semibold shrink-0 ${isMandatory ? "text-emerald-600" : "text-[#86868b]"}`}>
        {isMandatory ? "Included" : `+₹${price.toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

export function CompareCards({
  compareOptions,
  activeCheckoutOption,
  onSelectCheckout,
  selection,
  products,
  addons,
  settings,
  cablingDone,
  recommendation,
  customerTechnology,
  promoterDiscount,
  evaluatedAddonRules,
  activeOffer,
}: CompareCardsProps) {

  const cardsData = useMemo(() => {
    return compareOptions
      .map((co) => {
        let plan_type: "budget" | "recommended" | "premium" = "recommended";
        if (typeof co.option === "number") {
          if (co.option === 1) plan_type = "budget";
          else if (co.option === 3) plan_type = "premium";
        }

        const cardSelection: ConfiguratorSelection = {
          ...selection,
          technology: co.technology,
          selected_camera_option: typeof co.option === "number" ? co.option : undefined,
          selected_camera_id: typeof co.option === "string" ? co.option : undefined,
          plan_type,
          picture_quality: "good",
        };

        const pricing = calculatePricing({
          selection: cardSelection, products, addons, settings, cablingDone,
          referralDiscountPercent: promoterDiscount?.percent || 0,
          referralDiscountFlat: promoterDiscount?.flat || 0,
          evaluatedAddonRules, activeOffer,
        });

        const selectedCamId = pricing.items.find(i => products.find(prod => prod.id === i.product_id)?.category === 'cctv_camera')?.product_id;
        const camProduct = products.find(p => p.id === selectedCamId);
        const isRecommended = recommendation?.camera_option === co.option && co.technology === (customerTechnology ?? "IP");

        const visibleAddons = (addons as Addon[]).filter((a) => {
          if (!a.is_active) return false;
          const rule = evaluatedAddonRules?.[a.id!];
          if (!rule || rule.action === "hide") return false;
          return true;
        });

        const scoreResult = camProduct ? calculateSystemScore(camProduct, { recordingDays: selection.recording_days }) : null;

        const mp = camProduct?.resolution_mp ?? (camProduct?.technical_name?.toLowerCase().includes("5mp") ? 5 : camProduct?.technical_name?.toLowerCase().includes("4mp") ? 4 : 2);
        const is5MP = mp >= 5;
        const is4MP = mp >= 4;
        const nvType = camProduct?.night_vision_type ?? (camProduct?.technical_name?.toLowerCase().includes("color") ? "color" : "ir");
        const isColorNight = nvType === "color" || nvType === "dual_light" || nvType === "starlight";
        const hasAudio = camProduct?.has_audio === true || (camProduct?.technical_name?.includes("mic") || camProduct?.technical_name?.includes("audio")) || (typeof co.option === "number" && co.option > 1);
        const isIP = co.technology === "IP";
        const recType = isIP ? "NVR" : "DVR";
        const recProduct = products.find((p) => p.technical_name?.startsWith(recType.toLowerCase()));

        return {
          technology: co.technology, option: co.option, pricing, camProduct, recProduct, isRecommended, visibleAddons,
          is5MP, is4MP, isColorNight, hasAudio, isIP, recType, scoreResult,
        };
      })
      .sort((a, b) => a.pricing.total_payable - b.pricing.total_payable);
  }, [compareOptions, selection, products, addons, settings, cablingDone, promoterDiscount, evaluatedAddonRules, recommendation, customerTechnology, activeOffer]);

  // --- ALL HOOKS MUST BE DECLARED BEFORE ANY EARLY RETURNS ---
  // Mobile scroll tracking
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const cards = Array.from(container.children) as HTMLElement[];
    if (cards.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = cards.indexOf(entry.target as HTMLElement);
            if (index !== -1) setActiveCardIdx(index);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [cardsData.length]);

  // Hide swipe hint after first interaction
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => setShowSwipeHint(false);
    container.addEventListener('scroll', handleScroll, { once: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-dismiss swipe hint after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const scrollToCard = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = Array.from(container.children) as HTMLElement[];
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, []);

  // Early return AFTER all hooks have been declared
  if (cardsData.length === 0) {
    return (
      <div className="w-full p-12 rounded-3xl border border-[#d2d2d7] dark:border-[#424245] flex flex-col items-center text-center">
        <Camera className="w-8 h-8 text-[#86868b] mb-4" />
        <p className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">No Packages Selected</p>
        <p className="text-[#86868b] mt-1">Please select an option to compare.</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div ref={scrollRef} className={`flex sm:grid sm:grid-cols-1 ${cardsData.length < 4 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:overflow-visible`}>
      {cardsData.map((card, idx) => {
        const isCheckout = activeCheckoutOption?.technology === card.technology && activeCheckoutOption?.option === card.option;
        const isCustom = typeof card.option === 'string';
        const isUpgradeSuggestion = customerTechnology === "HD" && card.isIP && !isCustom;
        
        let tierName = "Standard";
        if (card.option === 1) tierName = "Standard";
        else if (card.option === 2) tierName = "Professional";
        else if (card.option === 3) tierName = "Elite";

        if (isCustom) tierName = "Custom Built";
        else if (isUpgradeSuggestion) tierName = "Smart Upgrade";
        else if (card.isRecommended) tierName = "Recommended";
        
        const pricePerCam = selection.camera_count > 0 ? Math.round(card.pricing.total_payable / selection.camera_count) : 0;
        const brandName = normalizeBrand(card.camProduct?.brand || card.recProduct?.brand);

        const baseBg = isCustom 
          ? "bg-gradient-to-b from-[#f0f7ff] to-white dark:from-[#1a2332] dark:to-[#1d1d1f]" 
          : "bg-white dark:bg-[#1d1d1f]";

        return (
          <div
            key={`${card.technology}-${card.option}`}
            onClick={() => {
              trackEvent("select_plan", { technology: card.technology, option: card.option, price: card.pricing.total_payable });
              onSelectCheckout({ technology: card.technology, option: card.option });
            }}
            className={`relative flex flex-col p-6 rounded-[28px] transition-all duration-300 cursor-pointer w-[85vw] sm:w-auto snap-center flex-none ${baseBg}
              ${isCheckout 
                ? (isCustom 
                    ? "border-2 border-[#0071e3] shadow-[0_12px_30px_rgba(0,113,227,0.25)] ring-4 ring-[#0071e3]/20" 
                    : "border-2 border-[#0071e3] shadow-[0_12px_24px_rgba(0,113,227,0.15)] ring-4 ring-[#0071e3]/10"
                  )
                : (isCustom
                    ? "border-2 border-[#d2d2d7] dark:border-[#424245] border-dashed hover:border-[#0071e3]/50"
                    : "border border-[#d2d2d7] dark:border-[#424245] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-[#86868b]"
                  )
              }`}
          >
            {/* Top Recommended Badge */}
            {card.isRecommended && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] rounded-full text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1 z-10 shadow-md">
                <Zap className="w-3 h-3 fill-current" />
                Our Pick
              </div>
            )}

            {isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const { compare_options, setCompareOptions } = useConfiguratorStore.getState();
                  setCompareOptions(compare_options.filter(c => c.option !== card.option));
                }}
                className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#f5f5f7] hover:bg-[#d2d2d7] flex items-center justify-center transition-colors z-20 text-[#86868b]"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Header */}
            <div className="text-center mb-6 pt-2">
              <div className={`flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${isCheckout ? "text-[#0071e3]" : "text-[#86868b]"}`}>
                {isCustom && <Sparkles className={`w-3 h-3 ${isCheckout ? "text-[#0071e3]" : "text-[#86868b]"}`} />}
                {tierName}
              </div>
              <h3 className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
                {brandName} {card.isIP ? "IP" : "HD"}
              </h3>
              <p className="text-[13px] text-[#86868b]">
                {card.is5MP ? "5MP Ultra-HD" : card.is4MP ? "4MP Pro-HD" : "2MP Full-HD"}
              </p>
            </div>

            {/* Key Spec Badges — show real extracted specs */}
            {!card.pricing.error && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                {/* Resolution */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f0f7ff] dark:bg-[#1a2332] text-[#0071e3] px-2.5 py-1 rounded-full">
                  {card.is5MP ? "5MP" : card.is4MP ? "4MP" : "2MP"}
                </span>
                {/* Night Vision */}
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] px-2.5 py-1 rounded-full">
                  {card.isColorNight ? "🌈 Color Night" : "🔴 IR Night"}
                </span>
                {/* Form Factor */}
                {card.camProduct?.form_factor && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-[#f5f5f7] px-2.5 py-1 rounded-full capitalize">
                    {card.camProduct.form_factor}
                  </span>
                )}
                {/* IP Rating */}
                {card.camProduct?.ip_rating && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#86868b] px-2.5 py-1 rounded-full">
                    {card.camProduct.ip_rating}
                  </span>
                )}
                {/* Audio */}
                {card.hasAudio && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full">
                    🎙 Audio
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="text-center mb-6">
              {card.pricing.error ? (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-xl font-medium text-red-500 mt-1">Unavailable</span>
                  <span className="text-[11px] text-red-400 mt-1 font-medium px-2 leading-tight">
                    {card.pricing.error_message || "Required hardware is missing from our catalog."}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-center">
                    <span className="text-xl font-medium text-[#1d1d1f] dark:text-white mt-1 mr-0.5">₹</span>
                    <span className="text-5xl font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
                      {card.pricing.total_payable.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-1 font-medium">
                    ₹{pricePerCam.toLocaleString("en-IN")} per camera
                  </div>
                </>
              )}
            </div>

            {/* Inclusions */}
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] uppercase tracking-wide mb-3">Includes</p>
              <div className="space-y-3">
                {[
                  // Camera line: prefer model number, fallback to display_name
                  (() => {
                    const cam = card.camProduct;
                    const modelLabel = cam?.camera_model || cam?.technical_name || cam?.display_name || (card.technology + " Camera");
                    return `${selection.camera_count}× ${modelLabel}`;
                  })(),
                  // Recorder line: prefer model number
                  (() => {
                    const rec = card.recProduct;
                    const modelLabel = rec?.recorder_model || rec?.technical_name || rec?.display_name || (card.recType + " Recorder");
                    return `1× ${modelLabel}`;
                  })(),
                  (() => {
                    const storageItem = card.pricing.items.find((i: any) => addons.find((a: any) => a.id === i.product_id)?.category === 'storage');
                    if (storageItem) return storageItem.display_name;
                    return selection.recording_days > 0 ? `${selection.recording_days}-Day Storage` : "No Storage";
                  })(),
                  card.pricing.items.find((i: any) => i.product_id === "cabling_material")?.display_name?.split(' @ ')[0] ?? "Cabling & Accessories",
                  `Professional Installation`
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#0071e3] shrink-0" />
                    <span className="text-[13px] text-[#1d1d1f] dark:text-[#a1a1a6] leading-tight">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            {isCheckout ? (
              <div className="flex flex-col gap-2 mt-8">
                <button
                  className="w-full py-2.5 rounded-xl font-medium text-[13px] transition-colors bg-[#0071e3] text-white cursor-default"
                >
                  Selected
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const { startCompareMode } = useConfiguratorStore.getState();
                    startCompareMode(card.pricing, tierName);
                    document.getElementById('build-your-own')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 rounded-xl font-medium text-[13px] transition-colors bg-white dark:bg-transparent border border-[#0071e3] text-[#0071e3] hover:bg-blue-50 dark:hover:bg-[#0071e3]/10"
                >
                  Customize & Compare
                </button>
              </div>
            ) : (
              <button
                className="w-full mt-8 py-3 rounded-xl font-medium text-[13px] transition-colors bg-[#f5f5f7] dark:bg-[#2d2d2f] text-[#1d1d1f] dark:text-white hover:bg-[#e8e8ed] dark:hover:bg-[#3d3d3f]"
              >
                Select
              </button>
            )}
          </div>
        );
      })}
      </div>

      {/* Mobile Pagination Indicator */}
      {cardsData.length > 1 && (
        <div className="flex sm:hidden flex-col items-center gap-2 mt-6 mx-4">
          {/* Main Pagination Bar */}
          <div className="w-full flex items-center justify-between bg-white dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#424245] rounded-2xl px-4 py-3 shadow-lg shadow-black/5">
            {/* Left Arrow */}
            <button
              onClick={() => scrollToCard(Math.max(0, activeCardIdx - 1))}
              disabled={activeCardIdx === 0}
              className="w-10 h-10 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3] disabled:opacity-25 transition-all active:scale-90"
              aria-label="Previous quotation"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Center: Dots + Counter */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5">
                {cardsData.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToCard(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeCardIdx
                        ? "w-8 h-2.5 bg-[#0071e3] shadow-sm shadow-[#0071e3]/30"
                        : "w-2.5 h-2.5 bg-[#d2d2d7] dark:bg-[#424245] hover:bg-[#86868b]"
                    }`}
                    aria-label={`Go to quotation ${i + 1}`}
                  />
                ))}
              </div>
              <p className="text-[13px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                <span className="text-[#0071e3]">{activeCardIdx + 1}</span>
                <span className="text-[#86868b] font-medium"> of </span>
                <span>{cardsData.length} packages</span>
              </p>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => scrollToCard(Math.min(cardsData.length - 1, activeCardIdx + 1))}
              disabled={activeCardIdx === cardsData.length - 1}
              className="w-10 h-10 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3] disabled:opacity-25 transition-all active:scale-90"
              aria-label="Next quotation"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Swipe Hint (first load only) */}
          {showSwipeHint && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0071e3] text-white text-[11px] font-bold uppercase tracking-wider animate-bounce shadow-md shadow-[#0071e3]/25">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Swipe to compare</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
