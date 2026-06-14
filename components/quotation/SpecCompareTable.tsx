"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { Product, AppSettings, ConfiguratorSelection } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { calculateSystemScore, inferResolutionFromName, inferNightVisionFromName } from "@/lib/system-score";

interface CompareOption {
  technology: string;
  option: number | string;
}

interface SpecCompareTableProps {
  compareOptions: CompareOption[];
  products: Product[];
  selection: ConfiguratorSelection;
  settings: AppSettings;
  cablingDone: boolean;
}

type ColumnData = {
  cam?: Product;
  rec?: Product;
  quote: ReturnType<typeof calculatePricing>;
  selection: ConfiguratorSelection;
};

type SpecRow = {
  label: string;
  key: string;
  getValue: (data: ColumnData) => string | boolean | number | undefined | string[];
  formatValue?: (val: any) => React.ReactNode;
  getScore?: (val: any) => number;
};

type SpecSection = {
  title: string;
  rows: SpecRow[];
};

const SECTIONS: SpecSection[] = [
  {
    title: "1. Camera Specifications",
    rows: [
      { label: "Camera Model", key: "cam_model", getValue: ({ cam }) => cam?.camera_model || cam?.technical_name || cam?.display_name },
      { label: "Brand", key: "cam_brand", getValue: ({ cam }) => cam?.brand || "Premium" },
      { label: "Technology", key: "cam_tech", getValue: ({ cam }) => cam?.technologies?.join(', ') },
      {
        label: "Resolution",
        key: "cam_res",
        getValue: ({ cam }) => cam ? cam.resolution_mp ?? inferResolutionFromName(cam.technical_name || cam.display_name) : undefined,
        formatValue: (v) => (v ? `${v} MP` : "-"),
        getScore: (v) => Number(v) || 0,
      },
      {
        label: "Night Vision",
        key: "cam_nv",
        getValue: ({ cam }) => {
          if (!cam) return;
          const type = cam.night_vision_type ?? inferNightVisionFromName(cam.technical_name || cam.display_name);
          const range = cam.night_vision_range_m ?? (cam.technical_name?.toLowerCase().includes("30m") ? 30 : 20);
          const typeLabel = type === "color" ? "Color Night Vision" : type === "starlight" ? "Starlight" : type === "dual_light" ? "Dual Light" : type === "ir" ? "Standard IR" : "-";
          return `${typeLabel} (Up to ${range}m)`;
        },
      },
      {
        label: "Built-in Audio",
        key: "cam_audio",
        getValue: ({ cam }) => cam ? cam.has_audio === true || cam.technical_name?.toLowerCase().includes("mic") || cam.display_name?.toLowerCase().includes("mic") : false,
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
      },
      {
        label: "Form Factor",
        key: "cam_form",
        getValue: ({ cam }) => cam ? cam.form_factor ?? (cam.technical_name?.toLowerCase().includes("bullet") ? "bullet" : "dome") : undefined,
        formatValue: (v) => (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : "-"),
      },
      {
        label: "Durability (IP)",
        key: "cam_ip",
        getValue: ({ cam }) => cam ? cam.ip_rating ?? (cam.technical_name?.toLowerCase().includes("bullet") ? "IP67" : "IP66") : undefined,
        formatValue: (v) => v || "-",
      },
      {
        label: "Lens",
        key: "cam_lens",
        getValue: ({ cam }) => cam?.lens_mm ?? undefined,
        formatValue: (v) => v ? `${v}mm` : "-",
      },
    ],
  },
  {
    title: "2. Recorder Specifications",
    rows: [
      { label: "Recorder Model", key: "rec_model", getValue: ({ rec, quote }) => rec?.recorder_model || rec?.technical_name || rec?.display_name || quote.items.find(i => i.product_id.includes("recorder") || i.display_name.includes("Recorder"))?.display_name },
      { label: "Brand", key: "rec_brand", getValue: ({ rec }) => rec?.brand || "Premium" },
      { label: "Type", key: "rec_type", getValue: ({ rec, cam }) => rec?.recorder_type || rec?.technologies?.join(', ') || (cam?.technologies?.includes("IP") ? "NVR" : "DVR") },
      {
        label: "Compression",
        key: "rec_compression",
        getValue: ({ rec }) => rec ? rec.compression ?? (rec.technical_name?.toLowerCase().includes("h265") || rec.display_name?.toLowerCase().includes("h.265") ? "H.265" : "H.264") : "H.265",
      },
    ],
  },
  {
    title: "3. Storage & Backup",
    rows: [
      {
        label: "Target Backup",
        key: "storage_days",
        getValue: ({ selection }) => selection.recording_days,
        formatValue: (v) => `${v} Days`
      },
      {
        label: "Hard Drive Included",
        key: "storage_drive",
        getValue: ({ quote }) => quote.items.find(i => i.product_id.includes("hdd") || i.display_name.toLowerCase().includes("hdd"))?.display_name || "Surveillance HDD",
      },
    ]
  },
  {
    title: "4. Cabling & Materials",
    rows: [
      {
        label: "Wiring Type",
        key: "cable_type",
        getValue: ({ quote }) => quote.items.find(i => i.product_id === "cabling_material")?.display_name?.split(" (~")[0] || "Standard Wiring",
      },
      {
        label: "Approx. Length",
        key: "cable_len",
        getValue: ({ selection }) => {
          const metersPerCam = selection.cable_length_meters || 20;
          return metersPerCam * selection.camera_count;
        },
        formatValue: (v) => `~${v} Meters`
      },
    ]
  },
  {
    title: "5. Services & Support",
    rows: [
      {
        label: "Professional Installation",
        key: "svc_install",
        getValue: () => true,
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
      },
      {
        label: "Post-Installation Support",
        key: "svc_amc",
        getValue: ({ quote }) => quote.addons?.find(a => a.addon_id?.includes("amc")) ? "1-Year Comprehensive AMC" : "1-Year Standard Warranty",
      },
    ]
  }
];

export function SpecCompareTable({
  compareOptions,
  products,
  selection,
  settings,
  cablingDone,
}: SpecCompareTableProps) {
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const tableColumns = useMemo(() => {
    return compareOptions.slice(0, 4).map((opt) => {
      let plan_type: "budget" | "recommended" | "premium" = "recommended";
      if (typeof opt.option === "number") {
        if (opt.option === 1) plan_type = "budget";
        else if (opt.option === 3) plan_type = "premium";
      } else if (typeof opt.option === "string") {
        plan_type = opt.option as any;
      }

      const baseSelection: ConfiguratorSelection = {
        ...selection,
        technology: opt.technology,
        selected_camera_option: typeof opt.option === "number" ? opt.option : undefined,
        plan_type,
        selected_camera_id: typeof opt.option === "string" ? opt.option : undefined,
      };

      const quote = calculatePricing({ selection: baseSelection, products, addons: [], settings, cablingDone });
      const cameraItem = quote.items.find((item) => products.some((p) => p.id === item.product_id && p.category === "cctv_camera"));
      const cam = cameraItem ? products.find((p) => p.id === cameraItem.product_id) : undefined;
      const recorderItem = quote.items.find((item) => products.some((p) => p.id === item.product_id && p.category === "recorder"));
      const rec = recorderItem ? products.find((p) => p.id === recorderItem.product_id) : undefined;
      const scoreResult = cam ? calculateSystemScore(cam, { recordingDays: selection.recording_days }) : null;

      return { 
        opt, 
        cam, 
        rec,
        quote,
        selection: baseSelection,
        scoreResult 
      };
    });
  }, [compareOptions, selection, products, settings, cablingDone]);

  const columnHeaders = tableColumns.map((col, idx) => {
    if (idx === 0) return "Standard";
    if (idx === 1) return "Professional";
    if (idx === 2) return "Elite";
    return "Custom";
  });

  const gridColsClass = tableColumns.length === 1 ? "grid-cols-2" : tableColumns.length === 2 ? "grid-cols-3" : tableColumns.length === 3 ? "grid-cols-4" : "grid-cols-5";

  const isSameValue = (values: any[]) => {
    if (values.length === 0) return true;
    const first = JSON.stringify(values[0]);
    return values.every((v) => JSON.stringify(v) === first);
  };

  // Mobile scroll tracking for spec table
  const specScrollRef = useRef<HTMLDivElement>(null);
  const [activeSpecCol, setActiveSpecCol] = useState(0);
  const totalSpecCols = tableColumns.length;

  useEffect(() => {
    const container = specScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth - container.clientWidth;
      if (scrollWidth <= 0) return;
      const progress = scrollLeft / scrollWidth;
      const idx = Math.round(progress * (totalSpecCols - 1));
      setActiveSpecCol(Math.min(idx, totalSpecCols - 1));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [totalSpecCols]);

  const scrollSpecToCol = useCallback((index: number) => {
    const container = specScrollRef.current;
    if (!container) return;
    const scrollWidth = container.scrollWidth - container.clientWidth;
    if (scrollWidth <= 0) return;
    const targetScroll = (index / (totalSpecCols - 1)) * scrollWidth;
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [totalSpecCols]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDiffOnly}
            onChange={(e) => setShowDiffOnly(e.target.checked)}
            className="w-4 h-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]"
          />
          <span className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
            Show Differences Only
          </span>
        </label>
      </div>

      <div ref={specScrollRef} className="rounded-3xl bg-white dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#424245] overflow-x-auto shadow-sm">
        <div className="min-w-[600px]">
        {/* Table Header */}
        <div className={`grid ${gridColsClass} border-b border-[#d2d2d7] dark:border-[#424245] bg-[#fbfbfd] dark:bg-[#1d1d1f]`}>
          <div className="p-5 flex items-center font-medium text-[#86868b] text-sm uppercase tracking-wider">
            Features
          </div>
          {tableColumns.map((col, idx) => (
            <div key={idx} className="p-5 border-l border-[#d2d2d7] dark:border-[#424245] flex flex-col items-center justify-between text-center">
              <h3 className="font-semibold text-lg text-[#1d1d1f] dark:text-[#f5f5f7]">
                {columnHeaders[idx]}
              </h3>
              {col.scoreResult && (
                <div className="w-full mt-3">
                  <div className="flex justify-between text-[11px] font-semibold mb-1 uppercase tracking-wider">
                    <span className="text-[#86868b]">Score</span>
                    <span className="text-[#0071e3]">{col.scoreResult.score}/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#f5f5f7] dark:bg-[#2d2d2f] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0071e3] rounded-full" style={{ width: `${col.scoreResult.score}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {SECTIONS.map((section) => {
            const visibleRows = section.rows.filter((row) => {
              if (!showDiffOnly) return true;
              const values = tableColumns.map((col) => row.getValue(col));
              return !isSameValue(values);
            });

            if (visibleRows.length === 0) return null;
            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title} className="flex flex-col">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between p-4 bg-[#fbfbfd] dark:bg-[#1d1d1f] border-b border-[#d2d2d7] dark:border-[#424245] transition-colors hover:bg-[#f5f5f7] dark:hover:bg-[#2d2d2f]"
                >
                  <span className="font-semibold text-[15px] text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {section.title}
                  </span>
                  {isCollapsed ? <ChevronDown className="w-5 h-5 text-[#86868b]" /> : <ChevronUp className="w-5 h-5 text-[#86868b]" />}
                </button>

                {!isCollapsed && (
                  <div className="flex flex-col">
                    {visibleRows.map((row, rowIdx) => {
                      const values = tableColumns.map((col) => row.getValue(col));
                      
                      return (
                        <div key={row.key} className={`grid ${gridColsClass} border-b border-[#d2d2d7] dark:border-[#424245] last:border-0 transition-colors bg-white dark:bg-[#1d1d1f] hover:bg-[#fbfbfd] dark:hover:bg-[#2d2d2f]`}>
                          <div className="p-4 flex items-center text-[13px] font-medium text-[#86868b]">
                            {row.label}
                          </div>
                          {tableColumns.map((col, colIdx) => {
                            const val = values[colIdx];
                            return (
                              <div key={colIdx} className="p-4 border-l border-[#d2d2d7] dark:border-[#424245] flex flex-col items-center justify-center text-center">
                                <span className="text-[14px] font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                                  {row.formatValue ? row.formatValue(val) : String(val ?? "-")}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Mobile Spec Table Pagination */}
      {totalSpecCols > 1 && (
        <div className="flex sm:hidden flex-col items-center gap-2 mt-4 mx-4">
          <div className="w-full flex items-center justify-between bg-white dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#424245] rounded-2xl px-4 py-3 shadow-lg shadow-black/5">
            <button
              onClick={() => scrollSpecToCol(Math.max(0, activeSpecCol - 1))}
              disabled={activeSpecCol === 0}
              className="w-10 h-10 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3] disabled:opacity-25 transition-all active:scale-90"
              aria-label="Previous spec column"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5">
                {tableColumns.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollSpecToCol(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeSpecCol
                        ? "w-8 h-2.5 bg-[#0071e3] shadow-sm shadow-[#0071e3]/30"
                        : "w-2.5 h-2.5 bg-[#d2d2d7] dark:bg-[#424245] hover:bg-[#86868b]"
                    }`}
                    aria-label={`Go to spec column ${i + 1}`}
                  />
                ))}
              </div>
              <p className="text-[13px] font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                <span className="text-[#0071e3]">{columnHeaders[activeSpecCol]}</span>
                <span className="text-[#86868b] font-medium"> â€” {activeSpecCol + 1} of {totalSpecCols}</span>
              </p>
            </div>

            <button
              onClick={() => scrollSpecToCol(Math.min(totalSpecCols - 1, activeSpecCol + 1))}
              disabled={activeSpecCol === totalSpecCols - 1}
              className="w-10 h-10 rounded-xl bg-[#0071e3]/10 dark:bg-[#0071e3]/20 flex items-center justify-center text-[#0071e3] disabled:opacity-25 transition-all active:scale-90"
              aria-label="Next spec column"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
