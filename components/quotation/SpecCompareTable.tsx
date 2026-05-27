"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
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

type SpecRow = {
  label: string;
  key: string;
  getValue: (cam: Product) => string | boolean | number | undefined | string[];
  formatValue?: (val: any) => React.ReactNode;
  getScore?: (val: any) => number;
};

type SpecSection = {
  title: string;
  rows: SpecRow[];
};

const SECTIONS: SpecSection[] = [
  {
    title: "System Overview",
    rows: [
      { label: "Camera Model", key: "model", getValue: (c) => c.display_name },
      { label: "Brand", key: "brand", getValue: (c) => c.brand || "Premium" },
      { label: "Technology", key: "technology", getValue: (c) => c.technology },
    ],
  },
  {
    title: "Image Quality",
    rows: [
      {
        label: "Resolution",
        key: "resolution",
        getValue: (c) => c.resolution_mp ?? inferResolutionFromName(c.technical_name || c.display_name),
        formatValue: (v) => (v ? `${v} MP` : "-"),
        getScore: (v) => Number(v) || 0,
      },
      {
        label: "Compression",
        key: "compression",
        getValue: (c) => c.compression ?? (c.technical_name?.toLowerCase().includes("h265") || c.display_name?.toLowerCase().includes("h.265") ? "H.265" : "H.264"),
        formatValue: (v) => v || "-",
        getScore: (v) => (v === "H.265+" ? 3 : v === "H.265" ? 2 : v === "H.264" ? 1 : 0),
      },
      {
        label: "WDR",
        key: "wdr",
        getValue: (c) => c.wdr === true || c.technical_name?.toLowerCase().includes("wdr") || c.display_name?.toLowerCase().includes("wdr"),
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
    ],
  },
  {
    title: "Night Vision",
    rows: [
      {
        label: "Type",
        key: "nv_type",
        getValue: (c) => c.night_vision_type ?? inferNightVisionFromName(c.technical_name || c.display_name),
        formatValue: (v) =>
          v === "color" ? "Color Night Vision"
          : v === "starlight" ? "Starlight"
          : v === "dual_light" ? "Dual Light"
          : v === "ir" ? "Standard IR" : "-",
        getScore: (v) => v === "starlight" ? 4 : v === "dual_light" ? 3 : v === "color" ? 2 : v === "ir" ? 1 : 0,
      },
      {
        label: "Range",
        key: "nv_range",
        getValue: (c) => c.night_vision_range_m ?? (c.technical_name?.toLowerCase().includes("30m") ? 30 : 20),
        formatValue: (v) => (v ? `Up to ${v}m` : "-"),
        getScore: (v) => Number(v) || 0,
      },
    ],
  },
  {
    title: "Build & Durability",
    rows: [
      {
        label: "Form Factor",
        key: "form_factor",
        getValue: (c) => c.form_factor ?? (c.technical_name?.toLowerCase().includes("bullet") ? "bullet" : "dome"),
        formatValue: (v) => (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : "-"),
      },
      {
        label: "IP Rating",
        key: "ip_rating",
        getValue: (c) => c.ip_rating ?? (c.technical_name?.toLowerCase().includes("bullet") ? "IP67" : "IP66"),
        formatValue: (v) => v || "-",
        getScore: (v) => {
          const s = String(v).toUpperCase();
          if (s.includes("IP68")) return 4;
          if (s.includes("IP67")) return 3;
          if (s.includes("IP66")) return 2;
          if (s.includes("IP65")) return 1;
          return 0;
        },
      },
      {
        label: "Lens",
        key: "lens",
        getValue: (c) => c.lens_mm ?? 3.6,
        formatValue: (v) => (v ? `${v}mm` : "-"),
      },
      {
        label: "Viewing Angle",
        key: "viewing_angle",
        getValue: (c) => c.viewing_angle_deg ?? 90,
        formatValue: (v) => (v ? `${v}°` : "-"),
        getScore: (v) => Number(v) || 0,
      },
    ],
  },
  {
    title: "Smart Features",
    rows: [
      {
        label: "Built-in Audio",
        key: "audio",
        getValue: (c) => c.has_audio === true || c.technical_name?.toLowerCase().includes("mic") || c.display_name?.toLowerCase().includes("mic"),
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
      {
        label: "AI Features",
        key: "ai",
        getValue: (c) => c.ai_features ?? (c.technical_name?.toLowerCase().includes("smart") || c.technology === "IP" ? ["Motion Detection"] : []),
        formatValue: (v) => (Array.isArray(v) && v.length > 0 ? v.join(", ") : "-"),
        getScore: (v) => (Array.isArray(v) ? v.length : 0),
      },
      {
        label: "SD Card Slot",
        key: "sd",
        getValue: (c) => c.has_sd_slot === true || c.technical_name?.toLowerCase().includes("sd"),
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
      {
        label: "PoE",
        key: "poe",
        getValue: (c) => c.poe === true || c.technology === "IP",
        formatValue: (v) => v ? <Check className="w-5 h-5 text-[#0071e3] mx-auto" /> : <X className="w-5 h-5 text-[#d2d2d7] mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
    ],
  },
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

  const columnData = useMemo(() => {
    return compareOptions.slice(0, 4).map((opt) => {
      const dummySelection: ConfiguratorSelection = {
        ...selection,
        technology: opt.technology,
        selected_camera_option: typeof opt.option === "number" ? opt.option : undefined,
        plan_type: typeof opt.option === "string" ? (opt.option as any) : "recommended",
        selected_camera_id: undefined,
      };

      const quote = calculatePricing({ selection: dummySelection, products, addons: [], settings, cablingDone });
      const cameraItem = quote.items.find((item) => products.some((p) => p.id === item.product_id && p.category === "camera"));
      const cameraProduct = cameraItem ? products.find((p) => p.id === cameraItem.product_id) : undefined;
      const scoreResult = cameraProduct ? calculateSystemScore(cameraProduct, { recordingDays: selection.recording_days }) : null;

      return { opt, cameraProduct, scoreResult };
    });
  }, [compareOptions, selection, products, settings, cablingDone]);

  const columnHeaders = columnData.map((col, idx) => {
    if (idx === 0) return "Standard";
    if (idx === 1) return "Professional";
    if (idx === 2) return "Elite";
    return "Custom";
  });

  const gridColsClass = columnData.length === 1 ? "grid-cols-2" : columnData.length === 2 ? "grid-cols-3" : columnData.length === 3 ? "grid-cols-4" : "grid-cols-5";

  const isSameValue = (values: any[]) => {
    if (values.length === 0) return true;
    const first = JSON.stringify(values[0]);
    return values.every((v) => JSON.stringify(v) === first);
  };

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

      <div className="rounded-3xl bg-white dark:bg-[#1d1d1f] border border-[#d2d2d7] dark:border-[#424245] overflow-x-auto shadow-sm">
        <div className="min-w-[600px]">
        {/* Table Header */}
        <div className={`grid ${gridColsClass} border-b border-[#d2d2d7] dark:border-[#424245] bg-[#fbfbfd] dark:bg-[#1d1d1f]`}>
          <div className="p-5 flex items-center font-medium text-[#86868b] text-sm uppercase tracking-wider">
            Features
          </div>
          {columnData.map((col, idx) => (
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
              const values = columnData.map((col) => col.cameraProduct ? row.getValue(col.cameraProduct) : undefined);
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
                      const values = columnData.map((col) => col.cameraProduct ? row.getValue(col.cameraProduct) : undefined);
                      
                      return (
                        <div key={row.key} className={`grid ${gridColsClass} border-b border-[#d2d2d7] dark:border-[#424245] last:border-0 transition-colors bg-white dark:bg-[#1d1d1f] hover:bg-[#fbfbfd] dark:hover:bg-[#2d2d2f]`}>
                          <div className="p-4 flex items-center text-[13px] font-medium text-[#86868b]">
                            {row.label}
                          </div>
                          {columnData.map((col, colIdx) => {
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
    </div>
  );
}
