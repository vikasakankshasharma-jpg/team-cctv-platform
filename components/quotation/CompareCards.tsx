"use client";

import { useMemo } from "react";
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
} from "lucide-react";
import type {
  Product,
  AppSettings,
  ConfiguratorSelection,
  RecommendedOutput,
  Addon,
} from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompareCardsProps {
  compareOptions: Array<{ technology: "HD" | "IP"; option: number }>;
  activeCheckoutOption: { technology: "HD" | "IP"; option: number } | null;
  onSelectCheckout: (option: { technology: "HD" | "IP"; option: number }) => void;

  cameraCount: number;
  recordingDays: number;
  products: Product[];
  addons: any[];
  settings: AppSettings;
  cablingDone: boolean;
  recommendation?: RecommendedOutput | null;
  promoterDiscount?: { percent: number; flat: number };
  evaluatedAddonRules: any;
}

// ─── Spec Row helper ─────────────────────────────────────────────────────────

function SpecRow({
  icon,
  iconColor,
  label,
  sublabel,
  active,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  sublabel: string;
  active: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
          active
            ? `${iconColor} bg-opacity-10`
            : "bg-zinc-100 dark:bg-zinc-800/60"
        }`}
      >
        <div className={active ? iconColor : "text-zinc-400 dark:text-zinc-600"}>
          {icon}
        </div>
      </div>
      <div className="min-w-0">
        <div
          className={`text-xs font-black uppercase tracking-tight leading-tight ${
            active
              ? "text-zinc-900 dark:text-white"
              : "text-zinc-400 dark:text-zinc-600 opacity-50"
          }`}
        >
          {label}
        </div>
        <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-600 mt-0.5 leading-tight">
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
              : "text-zinc-400 dark:text-zinc-500"
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
  promoterDiscount,
  evaluatedAddonRules,
}: CompareCardsProps) {
  // ── Compute card data ──────────────────────────────────────────────────────
  const cardsData = useMemo(() => {
    return compareOptions
      .map((co) => {
        const selection: ConfiguratorSelection = {
          technology: co.technology,
          camera_count: cameraCount,
          recording_days: recordingDays,
          selected_camera_option: co.option,
          plan_type: "recommended",
          selected_addons: [],
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
        });

        const camTechnicalName =
          co.technology === "IP"
            ? `cam_ip_opt${co.option}`
            : `cam_hd_opt${co.option}`;
        const camProduct = products.find(
          (p) => p.technical_name === camTechnicalName
        );
        const isRecommended =
          recommendation?.camera_option === co.option &&
          co.technology === "IP";

        // Build add-on list for this card (only visible ones)
        const visibleAddons = (addons as Addon[]).filter((a) => {
          if (!a.is_active) return false;
          const rule = evaluatedAddonRules?.[a.id!];
          if (!rule || rule.action === "hide") return false;
          return true;
        });

        // Derive spec flags from technical_name
        const tn = camProduct?.technical_name ?? "";
        const is5MP = tn.includes("5mp");
        const is4MP = tn.includes("4mp");
        const isColorNight = tn.includes("color");
        const hasAudio =
          tn.includes("mic") || tn.includes("audio") || co.option > 1;
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {cardsData.map((card, idx) => {
        const isCheckout =
          activeCheckoutOption?.technology === card.technology &&
          activeCheckoutOption?.option === card.option;

        // ── Tier label ──────────────────────────────────────────────────────
        let tierName = "Essential";
        if (card.isRecommended) tierName = "Recommended";
        else if (idx === cardsData.length - 1 && cardsData.length > 1)
          tierName = "Premium";

        // ── Savings vs most expensive ────────────────────────────────────────
        const savings = maxPrice - card.pricing.total_payable;
        const savingsPct = maxPrice > 0 ? Math.round((savings / maxPrice) * 100) : 0;
        const showSavings = savings > 0 && !isCheckout;

        // ── Resolution label ─────────────────────────────────────────────────
        const resLabel = card.is5MP
          ? "5MP Ultra-HD"
          : card.is4MP
          ? "4MP Pro-HD"
          : "2MP Standard-HD";
        const resIcon = card.is5MP
          ? "text-purple-500"
          : card.is4MP
          ? "text-blue-500"
          : "text-zinc-400";

        // ── Card border / bg ─────────────────────────────────────────────────
        const cardClass = isCheckout
          ? "border-blue-600 bg-white dark:bg-zinc-900/90 shadow-2xl shadow-blue-500/15 scale-105 z-10 ring-4 ring-blue-600/10"
          : card.isRecommended
          ? "border-amber-400/60 bg-gradient-to-b from-amber-50/40 to-white dark:from-amber-900/10 dark:to-zinc-900/40 hover:border-amber-400 hover:-translate-y-0.5"
          : "border-zinc-100 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5";

        return (
          <div
            key={`${card.technology}-${card.option}`}
            role="region"
            aria-labelledby={`tier-label-${idx}`}
            onClick={() =>
              onSelectCheckout({
                technology: card.technology,
                option: card.option,
              })
            }
            className={`relative p-7 rounded-[36px] transition-all duration-300 cursor-pointer border-2 ${cardClass}`}
          >
            {/* ── Top badge: Best Value ────────────────────────────────────── */}
            {card.isRecommended && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/25 whitespace-nowrap flex items-center gap-1.5 z-10">
                <Zap className="w-2.5 h-2.5 fill-white" />
                Best Value Match
              </div>
            )}

            {/* ── Tier header ──────────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center mt-4 mb-5">
              <div
                id={`tier-label-${idx}`}
                className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 ${
                  isCheckout
                    ? "text-blue-500"
                    : card.isRecommended
                    ? "text-amber-500"
                    : "text-zinc-400"
                }`}
              >
                {tierName}
              </div>
              <div
                className={`p-2.5 rounded-2xl mb-4 transition-colors ${
                  isCheckout
                    ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                    : card.isRecommended
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                }`}
                aria-label={`${card.technology} camera system`}
              >
                {card.isIP ? (
                  <Monitor className="w-6 h-6" />
                ) : (
                  <Camera className="w-6 h-6" />
                )}
              </div>
              <h4
                className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-tight text-center px-2"
                title={card.camProduct?.display_name}
              >
                {card.camProduct?.display_name ||
                  `${card.technology} Option ${card.option}`}
              </h4>
            </div>

            {/* ── Price ────────────────────────────────────────────────────── */}
            <div
              className={`text-center mb-6 py-5 rounded-2xl ${
                isCheckout
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-zinc-50 dark:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-start justify-center">
                <span
                  className={`text-base font-bold mt-1 mr-0.5 ${
                    isCheckout
                      ? "text-blue-400"
                      : "text-zinc-400"
                  }`}
                >
                  ₹
                </span>
                <span
                  className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${
                    isCheckout
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {card.pricing.total_payable.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">
                Incl. GST & Installation
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

            {/* ── Hardware Specs ────────────────────────────────────────────── */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.18em] mb-4">
                Hardware Specifications
              </p>

              {/* System Type */}
              <SpecRow
                icon={<Network className="w-3.5 h-3.5" />}
                iconColor={card.isIP ? "text-blue-500" : "text-zinc-500"}
                label={card.isIP ? "Smart IP Network System" : "Analog HD System"}
                sublabel={
                  card.isIP
                    ? "Digital, POE/WiFi cabling"
                    : "Traditional coaxial cabling"
                }
                active={true}
              />

              {/* Resolution */}
              <SpecRow
                icon={<Camera className="w-3.5 h-3.5" />}
                iconColor={resIcon}
                label={resLabel}
                sublabel="Camera sensor resolution"
                active={card.is5MP || card.is4MP || true}
              />

              {/* Night Vision */}
              <SpecRow
                icon={<Eye className="w-3.5 h-3.5" />}
                iconColor={
                  card.isColorNight ? "text-amber-500" : "text-zinc-500"
                }
                label={
                  card.isColorNight
                    ? "Full-Color Night Vision"
                    : "IR B&W Night Vision"
                }
                sublabel="Low-light / zero-light performance"
                active={card.isColorNight}
              />

              {/* Audio */}
              <SpecRow
                icon={<Mic className="w-3.5 h-3.5" />}
                iconColor={card.hasAudio ? "text-emerald-500" : "text-zinc-400"}
                label={card.hasAudio ? "Built-in Microphone" : "No Audio Recording"}
                sublabel="Ambient sound capture"
                active={card.hasAudio}
              />

              {/* Recorder */}
              <SpecRow
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
                iconColor="text-indigo-500"
                label={`${card.recType} Recorder`}
                sublabel={`${cameraCount}-channel continuous recording`}
                active={true}
              />

              {/* Storage */}
              <SpecRow
                icon={<HardDrive className="w-3.5 h-3.5" />}
                iconColor="text-sky-500"
                label={card.storageLabel}
                sublabel={`${recordingDays} days footage retention`}
                active={true}
              />
            </div>

            {/* ── Add-Ons Section ───────────────────────────────────────────── */}
            {card.visibleAddons.length > 0 && (
              <div className="mt-5 pt-4 border-t border-dashed border-zinc-100 dark:border-zinc-800/60 space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-[0.18em]">
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
              className={`w-full mt-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-200 ${
                isCheckout
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-600/25 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:shadow-md"
              }`}
            >
              {isCheckout ? "✓ Selected" : "Choose Plan"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
