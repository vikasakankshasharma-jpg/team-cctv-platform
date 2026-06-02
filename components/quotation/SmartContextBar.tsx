"use client";

import { useState } from "react";
import { useConfiguratorStore } from "@/store/configurator";
import { Camera, Calendar, HardDrive, Edit2, Cpu, Monitor, Download, Calendar as CalendarIcon, Check, Loader2, PlusCircle, Settings2 } from "lucide-react";
import { DownloadQuoteButton } from "@/components/pdf/DownloadQuoteButton";

import type { Lead, PricingResult, AppSettings } from "@/types";

interface SmartContextBarProps {
  totalPrice: number;
  customizationDiff?: number;
  baseTierName?: string;
  isCustomized?: boolean;
  onAction?: (action: "download" | "whatsapp" | "booking" | "accept") => void;
  isSaving?: boolean;
  lead?: Lead | null;
  quote?: PricingResult | null;
  settings?: AppSettings | null;
}

export function SmartContextBar({ totalPrice, customizationDiff = 0, baseTierName, isCustomized, onAction, isSaving, lead, quote, settings }: SmartContextBarProps) {
  const { selection } = useConfiguratorStore();

  let storageText = selection.recording_days > 0 ? `${selection.recording_days} Days` : "No Storage";
  let storageTextMobile = selection.recording_days > 0 ? `${selection.recording_days}d` : "None";
  
  if (quote?.items) {
    const storageItem = quote.items.find((i: any) => 
      i.display_name.toLowerCase().includes('hard disk') || 
      i.display_name.toLowerCase().includes('hdd') || 
      i.display_name.toLowerCase().includes('sd card') ||
      i.display_name.toLowerCase().includes('storage')
    );
    if (storageItem) {
      const match = storageItem.display_name.match(/(\d+(?:\.\d+)?\s*(?:TB|GB))/i);
      if (match) {
        storageText = `${match[1].toUpperCase()}`;
        storageTextMobile = match[1].toUpperCase();
      } else {
        storageText = "Custom Storage";
        storageTextMobile = "Storage";
      }
    }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 bg-[#fbfbfd]/80 dark:bg-[#1d1d1f]/80 backdrop-blur-2xl border-t border-[#d2d2d7]/50 dark:border-[#424245]/50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Core Settings Summary — hidden on mobile to prevent truncation */}
        <div className="hidden sm:flex items-center gap-5 text-[#1d1d1f] dark:text-[#f5f5f7] overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">System</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Camera className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{selection.camera_count} Cameras</span>
            </div>
          </div>
          <div className="w-px h-8 bg-[#d2d2d7] dark:bg-[#424245] shrink-0" />
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">Storage</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">{storageText}</span>
            </div>
          </div>

          {(customizationDiff !== 0 || isCustomized) && (
            <>
              <div className="w-px h-8 bg-[#d2d2d7] dark:bg-[#424245] shrink-0" />
              <div className="flex flex-col shrink-0">
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${customizationDiff > 0 ? 'text-[#0071e3]' : customizationDiff < 0 ? 'text-[#ff3b30]' : 'text-[#0071e3]'}`}>
                  {customizationDiff > 0 ? 'Upgrades' : customizationDiff < 0 ? 'Savings' : 'Modified'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {customizationDiff !== 0 ? (
                    <>
                      <PlusCircle className={`w-3.5 h-3.5 ${customizationDiff < 0 ? 'rotate-45' : ''}`} />
                      <span className="text-sm font-semibold">
                        {customizationDiff > 0 ? '+' : '-'}₹{Math.abs(customizationDiff).toLocaleString("en-IN")}
                      </span>
                    </>
                  ) : (
                    <>
                      <Settings2 className="w-3.5 h-3.5" />
                      <span className="text-sm font-semibold">Custom Built</span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile-only compact summary */}
        <div className="flex sm:hidden items-center gap-3 text-[#1d1d1f] dark:text-[#f5f5f7] w-full">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#86868b]">
            <Camera className="w-3 h-3" />
            <span>{selection.camera_count}</span>
          </div>
          <div className="w-px h-4 bg-[#d2d2d7] dark:bg-[#424245]" />
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#86868b]">
            <HardDrive className="w-3 h-3" />
            <span>{storageTextMobile}</span>
          </div>
          {customizationDiff !== 0 && (
            <>
              <div className="w-px h-4 bg-[#d2d2d7] dark:bg-[#424245]" />
              <span className={`text-[11px] font-bold ${customizationDiff > 0 ? 'text-[#0071e3]' : 'text-[#ff3b30]'}`}>
                {customizationDiff > 0 ? '+' : '-'}₹{Math.abs(customizationDiff).toLocaleString("en-IN")}
              </span>
            </>
          )}
        </div>

        {/* Live Total & Checkout Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
          <div className="flex flex-col sm:items-end shrink-0">
            <span className="text-[10px] font-semibold text-[#86868b] uppercase tracking-wider">Total Estimation</span>
            <div className="flex items-center gap-1 text-[#1d1d1f] dark:text-white">
              <span className="text-sm font-medium">₹</span>
              <span className="text-2xl font-semibold tracking-tight">{totalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {lead && quote ? (
              <DownloadQuoteButton 
                lead={lead} 
                quote={quote} 
                settings={settings || null}
                className="!px-4 !py-2.5 !text-xs !rounded-full !bg-white dark:!bg-[#2d2d2f] !text-[#1d1d1f] dark:!text-white border border-[#d2d2d7] dark:border-[#424245]"
              />
            ) : (
              <button 
                onClick={() => onAction && onAction("download")}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2d2d2f] hover:bg-[#f5f5f7] dark:hover:bg-[#3d3d3f] text-[#1d1d1f] dark:text-white border border-[#d2d2d7] dark:border-[#424245] rounded-full text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Save PDF
              </button>
            )}
            <button 
              onClick={() => onAction && onAction("booking")}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Book Site Visit</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
