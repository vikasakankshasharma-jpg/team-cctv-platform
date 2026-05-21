"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import type { Product, AppSettings, ConfiguratorSelection } from "@/types";
import { calculatePricing } from "@/lib/pricing-engine";
import { calculateSystemScore } from "@/lib/system-score";

interface CompareOption {
  technology: "HD" | "IP";
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
      { label: "Brand", key: "brand", getValue: (c) => c.brand || "Standard" },
      { label: "Technology", key: "technology", getValue: (c) => c.technology },
    ],
  },
  {
    title: "Image Quality",
    rows: [
      {
        label: "Resolution",
        key: "resolution",
        getValue: (c) => c.resolution_mp,
        formatValue: (v) => (v ? `${v} MP` : "-"),
        getScore: (v) => Number(v) || 0,
      },
      {
        label: "Compression",
        key: "compression",
        getValue: (c) => c.compression,
        formatValue: (v) => v || "-",
        getScore: (v) => (v === "H.265+" ? 3 : v === "H.265" ? 2 : v === "H.264" ? 1 : 0),
      },
      {
        label: "WDR",
        key: "wdr",
        getValue: (c) => c.wdr,
        formatValue: (v) =>
          v ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />,
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
        getValue: (c) => c.night_vision_type,
        formatValue: (v) =>
          v === "color"
            ? "Color Night Vision"
            : v === "starlight"
            ? "Starlight"
            : v === "dual_light"
            ? "Dual Light"
            : v === "ir"
            ? "Standard IR"
            : "-",
        getScore: (v) =>
          v === "starlight" ? 4 : v === "dual_light" ? 3 : v === "color" ? 2 : v === "ir" ? 1 : 0,
      },
      {
        label: "Range",
        key: "nv_range",
        getValue: (c) => c.night_vision_range_m,
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
        getValue: (c) => c.form_factor,
        formatValue: (v) => (v ? String(v).charAt(0).toUpperCase() + String(v).slice(1) : "-"),
      },
      {
        label: "IP Rating",
        key: "ip_rating",
        getValue: (c) => c.ip_rating || "Indoor",
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
        getValue: (c) => c.lens_mm,
        formatValue: (v) => (v ? `${v}mm` : "-"),
      },
      {
        label: "Viewing Angle",
        key: "viewing_angle",
        getValue: (c) => c.viewing_angle_deg,
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
        getValue: (c) => c.has_audio,
        formatValue: (v) =>
          v ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
      {
        label: "AI Features",
        key: "ai",
        getValue: (c) => c.ai_features,
        formatValue: (v) => (Array.isArray(v) && v.length > 0 ? v.join(", ") : "-"),
        getScore: (v) => (Array.isArray(v) ? v.length : 0),
      },
      {
        label: "SD Card Slot",
        key: "sd",
        getValue: (c) => c.has_sd_slot,
        formatValue: (v) =>
          v ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />,
        getScore: (v) => (v ? 1 : 0),
      },
      {
        label: "PoE",
        key: "poe",
        getValue: (c) => c.poe,
        formatValue: (v) =>
          v ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-red-500 mx-auto" />,
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

  // 1. Resolve cameras and system scores for the given options
  const columnData = useMemo(() => {
    // Only process up to 3 columns to stick to Good, Better, Best format
    return compareOptions.slice(0, 3).map((opt) => {
      const dummySelection: ConfiguratorSelection = {
        ...selection,
        technology: opt.technology,
        selected_camera_option: typeof opt.option === "number" ? opt.option : undefined,
        plan_type: typeof opt.option === "string" ? (opt.option as any) : "recommended",
        selected_camera_id: undefined,
      };

      const quote = calculatePricing({
        selection: dummySelection,
        products,
        addons: [],
        settings,
        cablingDone,
      });

      const cameraItem = quote.items.find((item) =>
        products.some((p) => p.id === item.product_id && p.category === "camera")
      );
      const cameraProduct = cameraItem
        ? products.find((p) => p.id === cameraItem.product_id)
        : undefined;

      const scoreResult = cameraProduct
        ? calculateSystemScore(cameraProduct, { recordingDays: selection.recording_days })
        : null;

      return {
        opt,
        cameraProduct,
        scoreResult,
      };
    });
  }, [compareOptions, selection, products, settings, cablingDone]);

  const columnHeaders = ["Good", "Better", "Best"];

  const isSameValue = (values: any[]) => {
    if (values.length === 0) return true;
    const first = JSON.stringify(values[0]);
    return values.every((v) => JSON.stringify(v) === first);
  };

  const getWinnerLabel = (scores: number[], index: number, label: string) => {
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    if (maxScore === minScore || isNaN(maxScore) || isNaN(minScore)) return null;

    if (scores[index] === maxScore) {
      const winnersCount = scores.filter((s) => s === maxScore).length;
      return winnersCount === 1 ? `Best ${label}` : `Better ${label}`;
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="flex items-center justify-end mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showDiffOnly}
            onChange={(e) => setShowDiffOnly(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">
            Show Differences Only
          </span>
        </label>
      </div>

      {/* Table Container */}
      <div className="rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="p-4 flex items-center font-black text-zinc-900 dark:text-white uppercase tracking-tight text-sm">
            Features
          </div>
          {columnData.map((col, idx) => (
            <div
              key={idx}
              className="p-4 border-l border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-between text-center"
            >
              <h3 className="font-black text-lg text-zinc-900 dark:text-white uppercase tracking-tight">
                {columnHeaders[idx] || `Option ${idx + 1}`}
              </h3>
              {col.scoreResult && (
                <div className="w-full mt-3">
                  <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-wider">
                    <span className="text-zinc-500">System Score</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      {col.scoreResult.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
                      style={{ width: `${col.scoreResult.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Table Body */}
        <div className="flex flex-col">
          {SECTIONS.map((section) => {
            // Filter rows based on "Show Differences Only"
            const visibleRows = section.rows.filter((row) => {
              if (!showDiffOnly) return true;
              const values = columnData.map((col) =>
                col.cameraProduct ? row.getValue(col.cameraProduct) : undefined
              );
              return !isSameValue(values);
            });

            if (visibleRows.length === 0) return null;

            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title} className="flex flex-col">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.title)}
                  className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  <span className="font-black text-sm text-zinc-900 dark:text-white uppercase tracking-tight">
                    {section.title}
                  </span>
                  {isCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-zinc-500" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-zinc-500" />
                  )}
                </button>

                {/* Section Rows */}
                {!isCollapsed && (
                  <div className="flex flex-col">
                    {visibleRows.map((row, rowIdx) => {
                      const values = columnData.map((col) =>
                        col.cameraProduct ? row.getValue(col.cameraProduct) : undefined
                      );
                      const scores =
                        row.getScore && values.every((v) => v !== undefined)
                          ? values.map((v) => row.getScore!(v))
                          : [];

                      const maxScore = scores.length > 0 ? Math.max(...scores) : -Infinity;
                      const minScore = scores.length > 0 ? Math.min(...scores) : Infinity;
                      const hasWinner = maxScore > minScore && maxScore !== -Infinity;

                      return (
                        <div
                          key={row.key}
                          className={`grid grid-cols-4 border-b border-zinc-200 dark:border-zinc-800 transition-colors ${
                            rowIdx % 2 === 0
                              ? "bg-white dark:bg-zinc-900"
                              : "bg-zinc-50/50 dark:bg-zinc-800/20"
                          } hover:bg-zinc-50 dark:hover:bg-zinc-800`}
                        >
                          <div className="p-3 flex items-center text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                            {row.label}
                          </div>
                          {columnData.map((col, colIdx) => {
                            const val = values[colIdx];
                            const isWinner = hasWinner && scores[colIdx] === maxScore;
                            const winnerLabel = hasWinner
                              ? getWinnerLabel(scores, colIdx, row.label)
                              : null;

                            return (
                              <div
                                key={colIdx}
                                className={`p-3 border-l border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center ${
                                  isWinner
                                    ? "bg-green-50/50 dark:bg-green-900/10"
                                    : ""
                                }`}
                              >
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {row.formatValue ? row.formatValue(val) : String(val ?? "-")}
                                </span>
                                {isWinner && winnerLabel && (
                                  <span className="mt-1 text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                                    {winnerLabel}
                                  </span>
                                )}
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
  );
}
