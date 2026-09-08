"use client";

import { PricingResult } from "@/types";
import { Button } from "@/components/ui/button";
import { X, ArrowRightLeft, Camera } from "lucide-react";

interface CompareTrayProps {
  selectedItems: PricingResult[];
  onRemove: (item: PricingResult) => void;
  onCompareNow: () => void;
}

export function CompareTray({ selectedItems, onRemove, onCompareNow }: CompareTrayProps) {
  if (selectedItems.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#1c1c1e] border-t border-[#d2d2d7] dark:border-[#424245] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          <div className="shrink-0 text-sm font-semibold text-slate-500 hidden md:block">
            Compare ({selectedItems.length}/3):
          </div>
          
          {selectedItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-50 dark:bg-[#2d2d2f] border border-slate-200 dark:border-[#424245] rounded-lg p-2 pr-3 shrink-0 min-w-[180px]">
              <div className="w-10 h-10 bg-white dark:bg-[#1c1c1e] rounded-md flex items-center justify-center shrink-0 border border-slate-100 dark:border-zinc-800">
                <Camera className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {item.camera_device?.brand || "Budget"} {item.camera_device?.derivedResolution}
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white">
                  ₹{item.final_total.toLocaleString('en-IN')}
                </div>
              </div>
              <button 
                onClick={() => onRemove(item)}
                className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-500 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Placeholders */}
          {Array.from({ length: 3 - selectedItems.length }).map((_, idx) => (
            <div key={`empty-${idx}`} className="flex items-center gap-3 bg-slate-50/50 dark:bg-[#2d2d2f]/50 border border-dashed border-slate-300 dark:border-zinc-700 rounded-lg p-2 pr-3 shrink-0 min-w-[180px] opacity-60">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 border border-dashed border-slate-300 dark:border-zinc-700">
                <PlusIcon className="w-4 h-4 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Add Item
                </div>
                <div className="w-12 h-3 bg-slate-200 dark:bg-zinc-700 rounded mt-1"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <Button
            onClick={onCompareNow}
            disabled={selectedItems.length < 2}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 shadow-lg shadow-blue-600/20"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Compare Now
          </Button>
        </div>

      </div>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

