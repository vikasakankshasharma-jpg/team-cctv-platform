"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, ShieldCheck, Sparkles, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SpecificationOption {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  icon: string;
  whyNeeded: string;
  recommendedFor: string;
  defaultChecked?: boolean;
}

export const SPECIFICATION_OPTIONS: SpecificationOption[] = [
  {
    id: "weatherproof",
    tag: "outdoor",
    title: "100% Weatherproof Outdoor (IP67)",
    subtitle: "Heavy Rain, Dust & Heat Proof",
    icon: "🌧️",
    whyNeeded: "Rugged metal casing with IP67 sealed rating that easily survives intense monsoon rain, extreme summer heat, and dust storms without internal lens fogging.",
    recommendedFor: "Gates, Terraces, Parking, Boundary Walls",
  },
  {
    id: "color",
    tag: "color",
    title: "24/7 Full Color Night Vision",
    subtitle: "Vivid Color Even in Total Darkness",
    icon: "🌙",
    whyNeeded: "Instead of old ghostly black-and-white infrared video, warm dual-light illuminators capture true intruder clothing color, vehicle color, and clear facial details.",
    recommendedFor: "Main Entrance, Street Front, Commercial Storefront",
  },
  {
    id: "mic",
    tag: "mic",
    title: "Built-in Mic & Audio Recording",
    subtitle: "Crystal Clear Voice alongside Video",
    icon: "🎙️",
    whyNeeded: "Records verbal conversations, counter negotiations, and verbal abuse. In real-life legal or police disputes, audio proof is just as crucial as video footage.",
    recommendedFor: "Cash Counters, Office Cabins, Reception, Main Door",
  },
  {
    id: "two_way",
    tag: "2-way",
    title: "2-Way Mobile Talk (Walkie-Talkie)",
    subtitle: "Speak to Visitors Directly from Phone",
    icon: "🗣️",
    whyNeeded: "Built-in speaker allows you to instruct delivery agents, instruct domestic staff, or warn off suspicious persons outside your property right from your phone.",
    recommendedFor: "Apartment Entrances, Villas, Gated Compounds",
  },
  {
    id: "ptz",
    tag: "ptz",
    title: "360° Remote Pan-Tilt (Zero Blind Spots)",
    subtitle: "Rotate Camera from Anywhere on Mobile",
    icon: "🔄",
    whyNeeded: "Motorized rotation lets you look around 360 degrees horizontally and 90 degrees vertically, replacing 2-3 fixed cameras with a single panoramic eye.",
    recommendedFor: "Center Living Room, Large Hall, Open Backyard",
  },
];

interface SpecificationChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedTags: string[]) => void;
  currentTags: string[];
  outdoorCount?: number;
  indoorCount?: number;
  availableFeatureTags?: string[];
}

export function SpecificationChecklistModal({
  isOpen,
  onClose,
  onApply,
  currentTags = [],
  outdoorCount = 0,
  indoorCount = 0,
  availableFeatureTags,
}: SpecificationChecklistModalProps) {
  // Filter specification options to only those available in active product inventory
  const visibleOptions = useMemo(() => {
    if (!availableFeatureTags || availableFeatureTags.length === 0) return SPECIFICATION_OPTIONS;
    return SPECIFICATION_OPTIONS.filter(opt => availableFeatureTags.includes(opt.tag));
  }, [availableFeatureTags]);
  // Compute initial selections based on currentTags or smart context
  const initialSelected = useMemo(() => {
    const set = new Set<string>(currentTags.map(t => t.toLowerCase()));
    // Smart default: If outdoor cameras exist, recommend weatherproof
    if (outdoorCount > 0 && !set.has("outdoor")) {
      set.add("outdoor");
    }
    // Default color & audio for superior experience if none specified
    if (set.size === 0) {
      set.add("color");
      set.add("mic");
      if (outdoorCount > 0) set.add("outdoor");
    }
    return set;
  }, [currentTags, outdoorCount]);

  const [selected, setSelected] = useState<Set<string>>(initialSelected);

    const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const toggleTag = (tag: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleApply = () => {
    onApply(Array.from(selected));
    onClose();
  };

  const handleSelectAll = () => {
    const all = new Set(visibleOptions.map(opt => opt.tag));
    setSelected(all);
  };

  const handleClearAll = () => {
    setSelected(new Set());
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="w-full max-w-xl sm:max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/70 dark:bg-zinc-900/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                Setup Assistant
              </span>
              {(outdoorCount > 0 || indoorCount > 0) && (
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {outdoorCount > 0 ? `${outdoorCount} Outdoor` : ""}{outdoorCount > 0 && indoorCount > 0 ? " + " : ""}{indoorCount > 0 ? `${indoorCount} Indoor` : ""}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Select Your Security Requirements
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Choose the hardware capabilities you need. Camera resolution (2MP, 3MP, 5MP, 8MP) is configured directly on each camera card.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick select helpers */}
        <div className="px-5 sm:px-6 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Quick selection:</span>
            <button
              onClick={handleSelectAll}
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Select All
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <button
              onClick={handleClearAll}
              className="font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            >
              Clear All
            </button>
          </div>
          <span className="text-zinc-400 font-medium">
            {selected.size} selected
          </span>
        </div>

        {/* Scrollable Checklist Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {visibleOptions.map((opt, idx) => {
            const isChecked = selected.has(opt.tag);
            return (
              <div
                key={opt.id}
                onClick={() => toggleTag(opt.tag)}
                className={`pt-3.5 first:pt-0 cursor-pointer rounded-2xl p-3 sm:p-4 transition-all duration-200 border ${
                  isChecked
                    ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60 shadow-sm"
                    : "bg-white dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/60 hover:border-zinc-300"
                }`}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Custom Checkbox */}
                  <div
                    className={`mt-0.5 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors border ${
                      isChecked
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                  </div>

                  {/* Icon & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-base sm:text-lg">{opt.icon}</span>
                      <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                        {opt.title}
                      </h4>
                      <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {opt.subtitle}
                      </span>
                    </div>

                    {/* Layman Real-Life Explanation */}
                    <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1">
                      {opt.whyNeeded}
                    </p>

                    {/* Where it is recommended */}
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-700 dark:text-blue-400">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Best for: {opt.recommendedFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 sticky bottom-0">
          <button
            onClick={() => {
              // Apply no filter restriction
              onApply([]);
              onClose();
            }}
            className="text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors py-2 px-3"
          >
            Skip & View All Quotes
          </button>

          <Button
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-5 sm:px-6 py-2.5 rounded-full flex items-center gap-2 shadow-md shadow-blue-600/20"
          >
            <span>Apply {selected.size > 0 ? `(${selected.size}) Specs` : "Requirements"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}