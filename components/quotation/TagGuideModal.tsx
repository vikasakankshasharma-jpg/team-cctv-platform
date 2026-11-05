"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, ShieldCheck, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TagGuideItem {
  id: string;
  tag: string;
  title: string;
  badge: string;
  icon: string;
  simpleExplanation: string;
  realLifeExample: string;
  bestFor: string;
  standardIncluded?: boolean;
}

export const TAG_GUIDE_ITEMS: TagGuideItem[] = [
  {
    id: "weatherproof",
    tag: "outdoor",
    title: "100% Weatherproof IP67 Rating",
    badge: "Standard on All Outdoor",
    icon: "🌧️",
    simpleExplanation: "Rugged industrial-grade sealed enclosure completely protected against heavy monsoon rain, water jets, dust storms, and extreme summer temperatures.",
    realLifeExample: "Survives intense monsoon downpours and hot summer sun without internal lens fogging or water seepage.",
    bestFor: "Building entrance, Boundary walls, Open terrace, Parking areas",
    standardIncluded: true,
  },
  {
    id: "color",
    tag: "color",
    title: "24/7 Full Color Night Vision",
    badge: "Available in HD, IP & Wireless",
    icon: "🌙",
    simpleExplanation: "Traditional cameras switch to black-and-white infrared video at night. Color Night Vision cameras have warm soft lights and ultra-low light sensors to keep full vivid colors 24 hours a day.",
    realLifeExample: "Essential for street gates and parking to identify the exact color of an intruder's clothing (e.g., 'red shirt' vs 'black shirt') or vehicle at 2 AM.",
    bestFor: "Main entrance gate, Street front, Driveway, Commercial store",
  },
  {
    id: "mic",
    tag: "mic",
    title: "Built-in Mic & Audio Recording",
    badge: "Available in HD, IP & Wireless",
    icon: "🎙️",
    simpleExplanation: "An embedded high-sensitivity microphone records clear spoken voice and ambient sounds right along with video footage.",
    realLifeExample: "Crucial for cash counters, reception desks, and entrance doors where verbal arguments, price negotiations, or promises require undeniable proof.",
    bestFor: "Billing/Cash counters, Office reception, Entrance door, Home lobby",
  },
  {
    id: "two_way",
    tag: "2-way",
    title: "2-Way Mobile Talk (Walkie-Talkie)",
    badge: "Available in Wireless & Select HD",
    icon: "🗣️",
    simpleExplanation: "Equipped with both a microphone and a speaker. You can listen live and speak directly from your mobile app, and your voice plays through the camera.",
    realLifeExample: "Instruct delivery agents (Amazon, Zomato, Courier) where to leave packages while you are away, talk to house staff, or warn off suspicious strangers.",
    bestFor: "Main gate / Front porch, Corridor, Apartment main door",
  },
  {
    id: "ptz",
    tag: "ptz",
    title: "360° Remote Pan-Tilt (PTZ)",
    badge: "Smart Wireless Only",
    icon: "🔄",
    simpleExplanation: "Motorized camera that rotates 360 degrees horizontally and 90 degrees vertically directly from your smartphone app.",
    realLifeExample: "Instead of installing 2-3 fixed cameras in a large hall or living room, a single rotating camera lets you look in any direction anytime.",
    bestFor: "Living room, Large retail shops, Warehouses, Open central hall",
  },
  {
    id: "four_g",
    tag: "4g",
    title: "4G SIM Cellular Connectivity",
    badge: "4G SIM Wireless Only",
    icon: "🛰️",
    simpleExplanation: "Works with a direct 4G SIM card (Jio / Airtel) and connects directly to cloud storage and mobile app without needing any broadband Wi-Fi router or video cables.",
    realLifeExample: "Ideal for remote farmhouses, construction sites, independent godowns, or distant gates where home broadband cannot reach.",
    bestFor: "Farmhouses, Under-construction sites, Remote plots, Outpost gates",
  },
];

interface TagGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagGuideModal({ isOpen, onClose }: TagGuideModalProps) {
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

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="w-full max-w-2xl sm:max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/80 dark:bg-zinc-900/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Feature Education Guide
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              CCTV Specifications & Real-Life Guide
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Learn what each technical feature actually means in daily practical use so you choose what fits your property.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 divide-y divide-zinc-100 dark:divide-zinc-800/60">
          {TAG_GUIDE_ITEMS.map((item) => (
            <div key={item.id} className="pt-4 first:pt-0">
              <div className="flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/70">
                <div className="text-2xl sm:text-3xl shrink-0 mt-0.5">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                      {item.title}
                    </h4>
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                      item.standardIncluded 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    }`}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Simple Explanation */}
                  <p className="text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed mt-1">
                    {item.simpleExplanation}
                  </p>

                  {/* Real Life Example Box */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">💡 Real Life:</span>
                    <span className="leading-snug">{item.realLifeExample}</span>
                  </div>

                  {/* Best recommended location */}
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Recommended for: {item.bestFor}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Dedicated Camera Resolution Guide */}
          <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800">
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/20 dark:to-zinc-900 border border-blue-200/80 dark:border-blue-900/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl sm:text-2xl">🔍</span>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                    Camera Resolution & Image Clarity Guide
                  </h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">
                    Configured via the RESOLUTION dropdown on each camera card
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed mb-3.5">
                Resolution determines how sharply you can pinch-and-zoom into faces and car number plates. You can choose different resolutions for outdoor vs indoor cameras in your setup:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">2MP (1080p Full HD)</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">Standard</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                    Standard high-definition clarity. Perfect for indoor rooms, halls, and general monitoring up to 15-20 feet.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">3MP (2K Clarity)</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">Wireless Std</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                    50% more pixels than 1080p. Standard baseline for smart Wi-Fi & 4G wireless security cameras.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">4MP (2K Quad HD)</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">High Clarity</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                    Sharp perimeter detail for wide driveways, retail storefronts, and medium-distance property gates.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-800/80 bg-blue-50/30 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-blue-900 dark:text-blue-200">5MP (3K Pro Clarity)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">Recommended for Gates</span>
                  </div>
                  <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-snug">
                    2.5x standard 1080p pixel density. Lets you pinch-to-zoom into vehicle license plates and recognize unknown faces up to 30 feet away.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky bottom-0">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            You can configure different features for each camera bucket in your setup.
          </p>
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-2 rounded-full cursor-pointer"
          >
            Got it, Return to Setup
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}