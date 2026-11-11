"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  History, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  CheckCircle2, 
  Clock, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  ShieldCheck, 
  FileText,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { safeFormatDate, toIsoStringSafe } from "@/lib/date-utils";
import { useTranslation } from "@/hooks/useTranslation";

export interface VersionItem {
  id: string;
  version: number;
  total_payable: number;
  price_delta: number;
  status: string;
  created_at: string;
  is_active: boolean;
  revised_by: {
    role?: string;
    name?: string;
    email?: string;
  };
  revision_notes: string;
  camera_count?: number | null;
  technology?: string;
  recording_days?: number;
  items_count?: number;
  surcharges?: Record<string, boolean>;
  items_snapshot?: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
  margin_breakup?: any;
}

interface QuoteVersionHistoryProps {
  currentQuote: any;
  versions?: VersionItem[];
  onCreateRevision?: () => void;
  onRefresh?: () => void;
}

export function QuoteVersionHistory({ 
  currentQuote, 
  versions = [], 
  onCreateRevision 
}: QuoteVersionHistoryProps) {
  const { t } = useTranslation();
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  // If versions array is empty, synthesize a baseline v1 from currentQuote
  const displayVersions: VersionItem[] = versions.length > 0 ? versions : [
    {
      id: currentQuote.quoteId || currentQuote.id,
      version: currentQuote.version || 1,
      total_payable: currentQuote.pricingSnapshot?.finalPrice || currentQuote.pricingSnapshot?.total_payable || currentQuote.total_payable || 0,
      price_delta: 0,
      status: currentQuote.status || "GENERATED",
      created_at: toIsoStringSafe(currentQuote.createdAt || currentQuote.created_at) || new Date().toISOString(),
      is_active: true,
      revised_by: { role: "system", name: currentQuote.source === "wizard" ? t("adm_qvh_src_wizard", "Customer Wizard") : "TEAM" },
      revision_notes: t("adm_qvh_init_note", "Initial quotation generated"),
      camera_count: currentQuote.requirementSnapshot?.camera_count || 4,
      technology: currentQuote.requirementSnapshot?.technology_preference || "HD",
      recording_days: currentQuote.requirementSnapshot?.recording_days || 15,
      items_count: currentQuote.configurationSnapshot?.items?.length || 0,
      surcharges: currentQuote.site_surcharge_flags || {},
      items_snapshot: []
    }
  ];

  const activeVersion = displayVersions.find(v => v.is_active) || displayVersions[displayVersions.length - 1];
  const isPaidOrCompleted = currentQuote.isPaid || currentQuote.leadStatus === "WON";

  const toggleExpand = (verNum: number) => {
    setExpandedVersion(expandedVersion === verNum ? null : verNum);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                {t("adm_qvh_title", "Quotation Version History")}
              </h3>
              <Badge variant="outline" className="text-[11px] font-semibold bg-zinc-50 dark:bg-zinc-800 whitespace-normal leading-snug">
                {displayVersions.length === 1
                  ? t("adm_qvh_ver_one", "{count} Version", { count: "1" })
                  : t("adm_qvh_ver_many", "{count} Versions", { count: String(displayVersions.length) })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {t("adm_qvh_sub", "Track what is changed by admin or team with immutable change snapshots")}
            </p>
          </div>
        </div>

        {/* Action Button: Create Revision */}
        {onCreateRevision && (
          <Button 
            size="sm" 
            onClick={onCreateRevision}
            className="min-h-[2.25rem] h-auto py-1.5 px-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 self-start sm:self-auto whitespace-normal leading-snug shrink-0"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>{t("adm_qvh_create_btn", "Create Revision (v{ver})", { ver: String((activeVersion?.version || 1) + 1) })}</span>
          </Button>
        )}
      </div>

      {/* Notice if completed */}
      {isPaidOrCompleted && (
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">{t("adm_qvh_paid_t", "Completed & Paid Quotation:")}</span>{" "}
            {t("adm_qvh_paid_d", "Direct overwriting is disabled to protect invoice and accounting records. Any adjustments create a new tracked version.")}
          </div>
        </div>
      )}

      {/* Version Timeline List */}
      <div className="space-y-3 pt-1">
        {displayVersions.slice().reverse().map((ver, idx) => {
          const isCurrentActive = ver.is_active;
          const isExpanded = expandedVersion === ver.version;
          const hasDelta = ver.price_delta !== 0;

          return (
            <div
              key={ver.id || `v-${ver.version}`}
              className={`rounded-xl border transition-all ${
                isCurrentActive 
                  ? "bg-white dark:bg-zinc-900 border-indigo-200 dark:border-indigo-800/60 shadow-xs" 
                  : "bg-zinc-50/70 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-90 hover:opacity-100"
              }`}
            >
              {/* Card Summary Row */}
              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                    isCurrentActive 
                      ? "bg-indigo-600 text-white" 
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
                  }`}>
                    v{ver.version}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">
                        {t("adm_qm_rev_ver", "Version {ver}", { ver: String(ver.version) })}
                      </span>
                      {isCurrentActive && (
                        <Badge className="bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider whitespace-normal leading-snug">
                          {t("adm_qvh_active", "✓ Current Active")}
                        </Badge>
                      )}
                      {!isCurrentActive && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground font-semibold whitespace-normal leading-snug">
                          {t("adm_qvh_superseded", "Superseded")}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0 text-zinc-400" />
                        {safeFormatDate(ver.created_at, "dd MMM yyyy, hh:mm a")}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0 text-zinc-400" />
                        {ver.revised_by?.name || ver.revised_by?.role || "Admin"}
                      </span>
                    </p>

                    {ver.revision_notes && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 italic">
                        "{ver.revision_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing & Delta */}
                <div className="flex sm:flex-col items-end justify-between w-full sm:w-auto gap-1 shrink-0">
                  <div className="text-right">
                    <p className="text-base font-black text-zinc-900 dark:text-white">
                      ₹{ver.total_payable?.toLocaleString("en-IN")}
                    </p>
                    {ver.margin_breakup && (
                      <div className="flex items-center gap-1.5 justify-end text-[10px] font-bold mt-0.5">
                        <span className="text-blue-600 dark:text-blue-400" title={t("adm_qvh_prod_margin", "Product Margin (Without Services)")}>
                          {t("adm_qvh_prod_short", "Prod: {pct}%", { pct: String(ver.margin_breakup.products?.margin_percent ?? 0) })}
                        </span>
                        <span className="text-zinc-300 dark:text-zinc-700">•</span>
                        <span className="text-emerald-600 dark:text-emerald-400" title={t("adm_qvh_deal_margin", "Total Deal Margin (With Services)")}>
                          {t("adm_qvh_tot_short", "Total: {pct}%", { pct: String(ver.margin_breakup.overall?.margin_percent ?? 0) })}
                        </span>
                      </div>
                    )}
                    {hasDelta && (
                      <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                        ver.price_delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                      }`}>
                        {ver.price_delta > 0 ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            <span>+₹{ver.price_delta.toLocaleString("en-IN")}</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            <span>-₹{Math.abs(ver.price_delta).toLocaleString("en-IN")}</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1">
                    <a
                      href={`/api/quote/${ver.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold transition-all"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </a>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleExpand(ver.version)}
                      className="min-h-[1.75rem] h-auto py-1 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground whitespace-normal leading-snug"
                    >
                      <span>{t("adm_qvh_diff", "Diff")}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expandable Diff / What Changed Panel */}
              {isExpanded && (
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-800/30 text-xs space-y-3 rounded-b-xl">
                  <div className="font-bold text-zinc-800 dark:text-zinc-200 flex flex-wrap items-center justify-between gap-2">
                    <span>{t("adm_qvh_what_changed", "What changed in Version {ver}:", { ver: String(ver.version) })}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">ID: {ver.id}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">{t("adm_qvh_cameras", "Cameras")}</span>
                      <span className="font-bold text-foreground text-xs">{t("adm_qvh_units", "{count} Units", { count: String(ver.camera_count || "—") })}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">{t("adm_drw_tech", "Technology")}</span>
                      <span className="font-bold text-foreground text-xs">{ver.technology || "HD"}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">{t("adm_qvh_rec_days", "Recording Days")}</span>
                      <span className="font-bold text-foreground text-xs">{t("adm_qm_days_suffix", "{days} Days", { days: String(ver.recording_days || 15) })}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200/70 dark:border-zinc-700/50">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">{t("adm_qvh_line_items", "Line Items")}</span>
                      <span className="font-bold text-foreground text-xs">{t("adm_qvh_items_cnt", "{count} Items", { count: String(ver.items_count || 0) })}</span>
                    </div>
                  </div>

                  {/* Version Profit & Margin Breakup Strip */}
                  {ver.margin_breakup && (
                    <div className="p-2.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">{t("adm_qvh_prod_margin", "Product Margin (Without Services)")}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {ver.margin_breakup.products?.margin_percent}% (₹{Math.round(ver.margin_breakup.products?.profit || 0).toLocaleString("en-IN")})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">{t("adm_qvh_serv_margin", "Services Margin")}</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {ver.margin_breakup.services?.margin_percent}% (₹{Math.round(ver.margin_breakup.services?.profit || 0).toLocaleString("en-IN")})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">{t("adm_qvh_deal_margin", "Total Deal Margin (With Services)")}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {ver.margin_breakup.overall?.margin_percent}% (₹{Math.round(ver.margin_breakup.overall?.profit || 0).toLocaleString("en-IN")})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Surcharges if present */}
                  {ver.surcharges && Object.values(ver.surcharges).some(Boolean) && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200 text-[11px]">
                      <span className="font-bold block mb-1">{t("adm_qvh_surcharges", "Site Difficulty Surcharges:")}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ver.surcharges.requiresLadderFee && <Badge variant="outline" className="bg-amber-100 text-amber-900 text-[10px] whitespace-normal leading-snug">{t("adm_qvh_b_ladder", "Ladder Fee")}</Badge>}
                        {ver.surcharges.requiresMarbleSurcharge && <Badge variant="outline" className="bg-amber-100 text-amber-900 text-[10px] whitespace-normal leading-snug">{t("adm_qvh_b_marble", "Marble Core Drill")}</Badge>}
                        {ver.surcharges.requiresMetalSurcharge && <Badge variant="outline" className="bg-amber-100 text-amber-900 text-[10px] whitespace-normal leading-snug">{t("adm_qvh_b_metal", "Metal Girder")}</Badge>}
                        {ver.surcharges.requiresFurnishedSurcharge && <Badge variant="outline" className="bg-amber-100 text-amber-900 text-[10px] whitespace-normal leading-snug">{t("adm_qvh_b_conc", "Concealed Routing")}</Badge>}
                        {ver.surcharges.requiresHeavyDrillingSurcharge && <Badge variant="outline" className="bg-amber-100 text-amber-900 text-[10px] whitespace-normal leading-snug">{t("adm_qvh_b_heavy", "Heavy Drilling")}</Badge>}
                      </div>
                    </div>
                  )}

                  {/* Top Items Snapshot */}
                  {ver.items_snapshot && ver.items_snapshot.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-muted-foreground font-semibold text-[10px] uppercase tracking-wider block">
                        {t("adm_qvh_equip_snap", "Equipment Breakdown Snapshot:")}
                      </span>
                      <div className="space-y-1">
                        {ver.items_snapshot.map((it, i) => (
                          <div key={i} className="flex justify-between items-center text-[11px] py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                              {it.qty}x {it.name}
                            </span>
                            <span className="font-mono text-zinc-600 dark:text-zinc-400">
                              ₹{(it.price * it.qty).toLocaleString("en-IN")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
