"use client";

import { Check, ChevronDown, ChevronUp, ChevronRight, ShieldCheck, Sparkles, TrendingUp, Info, Cctv, Aperture, Video } from "lucide-react";
import { useState } from "react";
import type { PricingResult } from "@/types";

interface PlanCardProps {
  title: string;
  badge?: string;
  recommendation?: boolean;
  pricing: PricingResult;
  onSelect: () => void;
  isSelected?: boolean;
  showDetails?: boolean;
  onToggleDetails?: (show: boolean) => void;
  differenceAmount?: number;
  differenceType?: "save" | "extra";
  recommendationReason?: string;
}

export function PlanCard({ 
  title, 
  badge, 
  recommendation, 
  pricing, 
  onSelect, 
  isSelected,
  showDetails,
  onToggleDetails,
  differenceAmount,
  differenceType,
  recommendationReason
}: PlanCardProps) {
  const [internalShow, setInternalShow] = useState(false);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  
  const showItemized = showDetails !== undefined ? showDetails : internalShow;
  const setShowItemized = onToggleDetails ? onToggleDetails : setInternalShow;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const box = card.getBoundingClientRect();
    const x = e.clientX - box.left;
    const y = e.clientY - box.top;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  // Determine theme based on title
  const isPremium = title.toLowerCase().includes("premium") || title.toLowerCase().includes("ultra");
  const isBudget = title.toLowerCase().includes("budget") || title.toLowerCase().includes("economy");
  
  const theme = isPremium 
    ? { 
        bg: "from-amber-500/10 to-transparent", 
        border: "border-amber-200/50 dark:border-amber-500/30", 
        glow: "bg-amber-500/10", 
        text: "text-amber-600 dark:text-amber-400",
        accent: "bg-amber-500",
        shadow: "shadow-amber-500/10"
      } 
    : isBudget 
    ? { 
        bg: "from-emerald-500/10 to-transparent", 
        border: "border-emerald-200/50 dark:border-emerald-500/30", 
        glow: "bg-emerald-500/10", 
        text: "text-emerald-600 dark:text-emerald-400",
        accent: "bg-emerald-500",
        shadow: "shadow-emerald-500/10"
      }
    : { 
        bg: "from-blue-500/10 to-transparent", 
        border: "border-blue-200/50 dark:border-blue-500/30", 
        glow: "bg-blue-500/10", 
        text: "text-blue-600 dark:text-blue-400",
        accent: "bg-blue-600",
        shadow: "shadow-blue-500/10"
      };

  return (
    <div 
      className={`relative flex flex-col rounded-[48px] border transition-all duration-300 ease-out bg-white/80 dark:bg-zinc-900/60 backdrop-blur-3xl group cursor-default perspective-1000
      ${theme.border} ${isSelected ? "ring-4 ring-blue-500/20" : ""}
      ${recommendation 
        ? "shadow-[0_64px_128px_rgba(0,0,0,0.12)] sm:scale-[1.05] z-10" 
        : "shadow-[0_32px_64px_rgba(0,0,0,0.06)] hover:shadow-[0_48px_96px_rgba(0,0,0,0.1)]"}`}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Decorative Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} rounded-[48px] opacity-50 -z-10`} />

      {/* Premium Badge */}
      {badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2.5 bg-zinc-950 dark:bg-white border border-white/10 dark:border-zinc-200 rounded-full shadow-2xl flex items-center gap-2 z-20 whitespace-nowrap group-hover:scale-110 transition-transform">
          <Sparkles className={`w-3.5 h-3.5 ${theme.text}`} />
          <span className="text-[10px] font-black text-white dark:text-zinc-950 uppercase tracking-[0.2em]">{badge}</span>
        </div>
      )}

      {/* Recommended visual indicator (glow) */}
      {(recommendation || isPremium) && (
        <div className={`absolute -inset-4 ${theme.glow} blur-[60px] -z-20 rounded-[60px] opacity-50 group-hover:opacity-80 transition-opacity`} />
      )}

      <div className="p-8 md:p-12 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{title}</h3>
           {recommendation && <TrendingUp className={`w-5 h-5 ${theme.text}`} />}
        </div>
        
        <div className="flex items-end gap-2 mb-10 pb-8 border-b border-zinc-100 dark:border-zinc-800/60 relative">
          <span className="text-5xl md:text-6xl font-black text-zinc-950 dark:text-white tracking-tighter leading-none">
            ₹{pricing.total_payable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 ml-1">Final Price</span>
          
          {/* Subtle Price Underline based on theme */}
          <div className={`absolute bottom-0 left-0 h-1 w-20 ${theme.accent} rounded-full -mb-0.5 opacity-30`} />
        </div>

        {/* Difference Amount Badge */}
        {differenceAmount !== undefined && differenceType && (
          <div className="mb-10 flex items-center justify-center">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border ${
              differenceType === 'save' 
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20 shadow-emerald-500/5' 
                : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-500/20 shadow-orange-500/5'
            }`}>
              {differenceType === 'save' ? <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Save ₹{differenceAmount.toLocaleString('en-IN')}</span> : <span>Extra ₹{differenceAmount.toLocaleString('en-IN')}</span>}
            </span>
          </div>
        )}

        {/* Tier-Specific Feature Highlights */}
        <div className="space-y-6 flex-1 mb-10">
          {[
            { 
              icon: <Cctv className="w-4 h-4" />, 
              title: pricing.technology === "IP" ? "Pure Digital (IP)" : "Ultra HD (Analog)",
              subtitle: "Advanced Camera Technology",
              bg: "bg-blue-50 dark:bg-blue-500/10",
              color: "text-blue-600 dark:text-blue-400"
            },
            { 
              icon: isPremium ? <Aperture className="w-4 h-4" /> : <Video className="w-4 h-4" />,
              title: isBudget ? "Standard Grade" : isPremium ? "Professional Series" : "Performance Plus",
              subtitle: "Hardware Build Quality",
              bg: "bg-purple-50 dark:bg-purple-500/10",
              color: "text-purple-600 dark:text-purple-400"
            },
            { 
              icon: <ShieldCheck className="w-4 h-4" />,
              title: "On-Site Support",
              subtitle: "1 Year Comprehensive Coverage",
              bg: "bg-emerald-50 dark:bg-emerald-500/10",
              color: "text-emerald-600 dark:text-emerald-400"
            },
            { 
              icon: <Sparkles className="w-4 h-4" />,
              title: isPremium ? "StarLight Vision" : "IR Night Vision",
              subtitle: "Low-Light Enhancement",
              bg: "bg-amber-50 dark:bg-amber-500/10",
              color: "text-amber-600 dark:text-amber-400"
            }
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-5 group/item">
              <div className={`w-10 h-10 rounded-2xl ${feature.bg} flex items-center justify-center shrink-0 transition-transform group-hover/item:scale-110`}>
                <div className={feature.color}>{feature.icon}</div>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-black text-zinc-950 dark:text-zinc-200 leading-none mb-1 uppercase tracking-tight">{feature.title}</span>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{feature.subtitle}</span>
              </div>
            </div>
          ))}
          
          {recommendation && recommendationReason && (
            <div className={`mt-6 p-6 rounded-[32px] border ${theme.border} bg-white dark:bg-black/20 shadow-xl ${theme.shadow}`}>
               <div className="flex items-center gap-2 mb-3">
                  <Info className={`w-4 h-4 ${theme.text}`} />
                  <span className={`text-[10px] font-black ${theme.text} uppercase tracking-[0.2em]`}>Expert Verdict</span>
               </div>
               <p className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed uppercase tracking-wide">
                 &quot;{recommendationReason}&quot;
               </p>
            </div>
          )}
        </div>

        {/* Interactive Itemization Toggle */}
        <div className={`transition-all duration-500 rounded-[32px] border ${theme.border} ${showItemized ? "bg-zinc-50 dark:bg-black/40 p-8" : "p-5 hover:bg-zinc-50 dark:hover:bg-black/20"}`}>
          <button 
            onClick={() => setShowItemized(!showItemized)}
            className="flex items-center justify-between w-full text-left transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {showItemized ? "Close Manifest" : "View Manifest"}
            </span>
            <div className={`w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center border ${theme.border} shadow-sm`}>
              {showItemized ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </div>
          </button>
          
          {showItemized && (
            <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="space-y-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                {pricing.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-zinc-950 dark:text-white uppercase tracking-tight leading-tight">
                        {item.qty}x {item.display_name}
                      </span>
                      {item.brand && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{item.brand}</span>}
                    </div>
                    <span className="text-[11px] font-black text-zinc-950 dark:text-white shrink-0 tabular-nums">₹{item.line_total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2.5 pt-2">
                {[
                  { label: "Core Hardware", val: pricing.base_hardware_cost },
                  ...(pricing.cabling_cost > 0 ? [{ label: "Infrastructure", val: pricing.cabling_cost }] : []),
                  ...(pricing.labor_cost > 0 ? [{ label: "Execution Fee", val: pricing.labor_cost }] : []),
                  ...(pricing.addons_total > 0 ? [{ label: "Selected Extras", val: pricing.addons_total, color: "text-blue-600" }] : []),
                  ...(pricing.referral_discount > 0 ? [{ label: "Loyalty Credit", val: -pricing.referral_discount, color: "text-emerald-600" }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                    <span className={row.color}>{row.label}</span>
                    <span className={`${row.color || "text-zinc-950 dark:text-zinc-300"} tabular-nums`}>₹{row.val.toLocaleString('en-IN')}</span>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-5 mt-2 border-t border-zinc-200 dark:border-zinc-800 text-[12px] font-black text-zinc-950 dark:text-white uppercase tracking-[0.2em]">
                  <span>Net Investment</span>
                  <span className="tabular-nums">₹{pricing.net_taxable_amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  <span>Tax Compliance (GST {Math.round((pricing.gst_amount / pricing.net_taxable_amount) * 100) || 0}%)</span>
                  <span className="tabular-nums">₹{pricing.gst_amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={onSelect}
          className={`
            w-full h-16 sm:h-20 rounded-[28px] sm:rounded-[36px] font-black uppercase text-[11px] tracking-[0.3em] transition-all mt-8 sm:mt-12 transform active:scale-95 touch-manipulation shadow-2xl
            ${isSelected 
              ? "bg-emerald-500 text-white shadow-emerald-500/30" 
              : `bg-zinc-950 dark:bg-blue-600 hover:scale-[1.02] text-white ${theme.shadow}`}
          `}
        >
          {isSelected ? (
            <span className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5" /> Package Selected
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
               Configure Package <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </button>

      </div>
    </div>
  );
}

