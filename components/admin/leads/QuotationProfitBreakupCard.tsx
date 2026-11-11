"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  Wrench, 
  Package, 
  Cpu, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Percent, 
  DollarSign,
  ArrowRight,
  ShieldAlert,
  HardDrive,
  Camera,
  Activity
} from "lucide-react";
import { 
  QuotationProfitBreakup, 
  calculateQuotationProfitBreakup 
} from "@/lib/quotation-profit";
import { useTranslation } from "@/hooks/useTranslation";

interface QuotationProfitBreakupCardProps {
  quote: any;
  settings?: any;
  className?: string;
  defaultExpanded?: boolean;
}

export function QuotationProfitBreakupCard({
  quote,
  settings,
  className = "",
  defaultExpanded = true
}: QuotationProfitBreakupCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"categories" | "items" | "supply_only">("categories");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!quote) return null;

  // Use pre-computed margin_breakup or compute on the fly with resolved settings & context
  const pricingData = quote.pricingSnapshot || quote;
  const resolvedSettings = settings || quote.profit_settings;
  const resolvedContext = quote.profit_context;
  const breakup: QuotationProfitBreakup = 
    quote.margin_breakup || 
    pricingData.margin_breakup || 
    calculateQuotationProfitBreakup(pricingData, resolvedSettings, resolvedContext);

  const { products, services, overall, overheads, health, categories, items, supply_only_estimate } = breakup;

  // Formatting helpers
  const formatInr = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
  const formatPct = (val: number) => `${Number(val || 0).toFixed(1)}%`;

  const getCategoryLabel = (catKey: string, fallback: string) => {
    switch (catKey) {
      case "camera": return t("adm_qpb_cat_camera", "Cameras");
      case "recorder": return t("adm_qpb_cat_recorder", "Recorders (DVR / NVR)");
      case "storage": return t("adm_qpb_cat_storage", "Surveillance Storage (HDD / SD)");
      case "power": return t("adm_qpb_cat_power", "Power Supplies & PoE");
      case "cable": return t("adm_qpb_cat_cable", "Cables & Wiring");
      case "accessory": return t("adm_qpb_cat_accessory", "Accessories & Racks");
      case "service": return t("adm_qpb_cat_service", "Installation & Labor");
      case "amc": return t("adm_qpb_cat_amc", "Paid & Promo AMC Contracts");
      case "commission": return t("adm_qpb_cat_comm", "Referral & Partner Commission");
      case "other": return t("adm_qpb_cat_other", "Miscellaneous Materials");
      default: return fallback;
    }
  };

  const getHealthBadgeText = () => {
    if (health.status === "critical") return t("adm_qpb_hl_crit_b", "Critical Margin Risk");
    if (health.status === "subsidized") return t("adm_qpb_hl_sub_b", "Service Subsidized (Low Material Margin)");
    if (health.status === "low_margin") return t("adm_qpb_hl_low_b", "Low Margin Alert");
    return health.badge_text === "No Quote Data"
      ? t("adm_qpb_hl_nodata", "No Quote Data")
      : t("adm_qpb_hl_healthy", "Healthy Margin");
  };

  const getHealthDescription = () => {
    switch (health.status) {
      case "critical":
        return t("adm_qpb_hl_crit_d", "Deal is operating at or near negative margin. Any on-site rework or warranty replacement will generate a net loss.");
      case "subsidized":
        return t("adm_qpb_hl_sub_d", "Hardware is priced near distributor cost; profitability is almost entirely dependent on installation labor.");
      case "low_margin":
        return t("adm_qpb_hl_low_d", "Total blended margin ({overall}%) is below company target.", { overall: String(overall.margin_percent) });
      default:
        return health.description;
    }
  };

  const getHealthWarning = () => {
    switch (health.status) {
      case "critical":
        return t("adm_qpb_hl_crit_w", "Extreme risk: Overall margin is only {overall}% (Product: {prod}%)", {
          overall: String(overall.margin_percent),
          prod: String(products.margin_percent)
        });
      case "subsidized":
        return t("adm_qpb_hl_sub_w", "Product margin is compressed to {prod}%. If the client cancels installation, hardware profit will be razor-thin.", {
          prod: String(products.margin_percent)
        });
      case "low_margin":
        return t("adm_qpb_hl_low_w", "Target margin not met — this deal provides {overall}% overall margin.", {
          overall: String(overall.margin_percent)
        });
      default:
        return "";
    }
  };

  // Badge styling based on health status
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500/30";
      case "subsidized":
        return "bg-amber-600 hover:bg-amber-700 text-white border-amber-500/30";
      case "low_margin":
        return "bg-orange-600 hover:bg-orange-700 text-white border-orange-500/30";
      case "critical":
        return "bg-rose-600 hover:bg-rose-700 text-white border-rose-500/30 animate-pulse";
      default:
        return "bg-zinc-700 text-white";
    }
  };

  const getMarginTextColor = (pct: number) => {
    if (pct >= 20) return "text-emerald-600 dark:text-emerald-400";
    if (pct >= 12) return "text-blue-600 dark:text-blue-400";
    if (pct >= 8) return "text-amber-600 dark:text-amber-400";
    return "text-rose-600 dark:text-rose-400";
  };

  // Proportions for visual bar
  const totalRev = overall.revenue || 1;
  const productShare = Math.min(100, Math.max(0, (products.revenue / totalRev) * 100));
  const serviceShare = Math.min(100, Math.max(0, (services.revenue / totalRev) * 100));

  return (
    <Card className={`border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 ${className}`}>
      
      {/* Header */}
      <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {t("adm_qpb_title", "Quotation Profitability & Margin Breakup")}
                </CardTitle>
                <Badge className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-normal leading-snug ${getBadgeStyle(health.status)}`}>
                  {getHealthBadgeText()}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {t("adm_qpb_sub_pre", "Separate commercial margins:")}{" "}
                <strong>{t("adm_qpb_sub_prod", "Product Material")}</strong>{" "}
                {t("adm_qpb_sub_vs", "vs.")}{" "}
                <strong>{t("adm_qpb_sub_serv", "Turnkey Services")}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-semibold min-h-[2rem] h-auto py-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 whitespace-normal leading-snug"
            >
              {isExpanded ? (
                <>
                  <span>{t("adm_qpb_collapse", "Collapse")}</span>
                  <ChevronUp className="w-3.5 h-3.5 ml-1 shrink-0" />
                </>
              ) : (
                <>
                  <span>{t("adm_qpb_expand", "Expand Details")}</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-1 shrink-0" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        
        {/* Top 3 Metric Cards: Without Services vs Services Only vs Blended Total */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          
          {/* 1. WITHOUT SERVICES (Product Margin) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-zinc-900 dark:to-blue-950/10 border border-blue-200/80 dark:border-blue-900/40 relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5 leading-snug">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>{t("adm_qpb_prod_only", "Products Only (Without Services)")}</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-bold border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shrink-0">
                {t("adm_qvh_items_cnt", "{count} Items", { count: String(products.item_count) })}
              </Badge>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {formatInr(products.profit)}
              </div>
              <div className={`text-xl font-black ${getMarginTextColor(products.margin_percent)}`}>
                {formatPct(products.margin_percent)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-blue-100 dark:border-blue-900/30 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_eq_rev", "Equipment Revenue")}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatInr(products.revenue)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_pur_cost", "Purchase Cost")}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatInr(products.cost)}</span>
              </div>
            </div>

            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 font-medium mt-2 leading-snug">
              {t("adm_qpb_prod_caption", "Cameras, Recorders, Storage, Power, Racks & Cables")}
            </p>
          </div>

          {/* 2. SERVICES, PAID AMC & REFERRAL COMMISSIONS */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-zinc-900 dark:to-amber-950/10 border border-amber-200/80 dark:border-amber-900/40 relative overflow-hidden group">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 leading-snug">
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>{t("adm_qpb_serv_only", "Services, AMC & Commissions")}</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-bold border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 shrink-0">
                {t("adm_qpb_turnkey", "Turnkey")}
              </Badge>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                {formatInr(services.profit)}
              </div>
              <div className={`text-xl font-black ${getMarginTextColor(services.margin_percent)}`}>
                {formatPct(services.margin_percent)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-100 dark:border-amber-900/30 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_billed_labor", "Service Revenue")}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatInr(services.revenue)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_tech_cost", "Service & Ref. Cost")}</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{formatInr(services.cost)}</span>
              </div>
            </div>

            {((services.amc_revenue ?? 0) > 0 || (services.referral_commission_cost ?? 0) > 0) && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                {(services.amc_revenue ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    Paid AMC: +{formatInr(services.amc_revenue || 0)} (Net {formatInr(services.amc_profit || 0)})
                  </span>
                )}
                {(services.referral_commission_cost ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    Ref. Comm: -{formatInr(services.referral_commission_cost || 0)} ({services.referral_commission_source === "actual" ? "Actual" : "Est."})
                  </span>
                )}
              </div>
            )}

            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium mt-2 leading-snug">
              {t("adm_qpb_serv_caption", "Installation labor, Paid/Promo AMC, surcharges & referral commissions")}
            </p>
          </div>

          {/* 3. WITH SERVICES & TRUE NET POCKET PROFIT */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-zinc-900 dark:to-emerald-950/10 border-2 border-emerald-300 dark:border-emerald-800/60 relative overflow-hidden shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 leading-snug">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{t("adm_qpb_comb_deal", "Combined Deal (With Services)")}</span>
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase shrink-0">
                {t("adm_qpb_final_badge", "Final")}
              </Badge>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
                {formatInr(overall.profit)}
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatPct(overall.margin_percent)}
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-100 dark:border-emerald-900/30 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_net_tax", "Net Taxable")}</span>
                <span className="font-bold text-zinc-900 dark:text-white">{formatInr(overall.revenue)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase block font-semibold">{t("adm_qpb_tot_cost", "Direct & Ref. Cost")}</span>
                <span className="font-bold text-zinc-900 dark:text-white">{formatInr(overall.cost)}</span>
              </div>
            </div>

            {overheads && overheads.total_overheads > 0 && (
              <div className="mt-2 px-2 py-1.5 rounded-lg bg-emerald-600/10 dark:bg-emerald-950/50 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-1 text-[10px]">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Net Pocket Profit (after -{formatInr(overheads.total_overheads)} overheads):
                </span>
                <span className={`font-black ${overheads.net_profit >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatInr(overheads.net_profit)} ({formatPct(overheads.net_margin_percent)})
                </span>
              </div>
            )}

            <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-semibold mt-2 leading-snug">
              {t("adm_qpb_cust_pay", "Total Customer Payable: {amt} (incl. GST)", { amt: formatInr(overall.total_payable) })}
            </p>
          </div>

        </div>

        {/* Diagnostic Alert Banner (if any warning or subsidized) */}
        {health.warnings.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">{getHealthDescription()}</p>
              {getHealthWarning() ? (
                <>
                  <p className="text-amber-800 dark:text-amber-300 text-[11px]">• {getHealthWarning()}</p>
                  {health.warnings.slice(1).map((warn, i) => (
                    <p key={i} className="text-amber-800 dark:text-amber-300 text-[11px]">• {warn}</p>
                  ))}
                </>
              ) : (
                health.warnings.map((warn, i) => (
                  <p key={i} className="text-amber-800 dark:text-amber-300 text-[11px]">• {warn}</p>
                ))
              )}
            </div>
          </div>
        )}

        {/* Expanded Intelligence Section */}
        {isExpanded && (
          <div className="space-y-4 pt-2">
            
            {/* Visual Revenue Share Bar */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1.5 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                <span className="text-muted-foreground">{t("adm_qpb_turnkey_comp", "Turnkey Composition:")}</span>
                <div className="flex flex-wrap items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1 text-blue-700 dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shrink-0" />
                    {t("adm_qpb_prod_share", "Products: {pct} ({amt})", { pct: formatPct(productShare), amt: formatInr(products.revenue) })}
                  </span>
                  <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />
                    {t("adm_qpb_serv_share", "Services: {pct} ({amt})", { pct: formatPct(serviceShare), amt: formatInr(services.revenue) })}
                  </span>
                </div>
              </div>

              {/* Progress split */}
              <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300" 
                  style={{ width: `${productShare}%` }} 
                  title={t("adm_qpb_prod_share", "Products: {pct} ({amt})", { pct: formatPct(productShare), amt: formatInr(products.revenue) })}
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-300" 
                  style={{ width: `${serviceShare}%` }} 
                  title={t("adm_qpb_serv_share", "Services: {pct} ({amt})", { pct: formatPct(serviceShare), amt: formatInr(services.revenue) })}
                />
              </div>
            </div>

            {/* True Net Pocket Profit & Operating Overhead Waterfall */}
            {overheads && (
              <div className="p-3 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    True Net Pocket Profit Waterfall (After Services, Commissions &amp; Overheads)
                  </span>
                  <span className={`font-black font-mono ${overheads.net_profit >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {formatInr(overheads.net_profit)} ({formatPct(overheads.net_margin_percent)})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground block font-semibold">
                      PG MDR ({overheads.payment_gateway_is_actual ? "Actual" : overheads.payment_gateway_fee === 0 ? "Cash/UPI" : "Est."})
                    </span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatInr(overheads.payment_gateway_fee)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground block font-semibold">1st-Yr Warranty Reserve</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatInr(overheads.warranty_reserve)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground block font-semibold">Consumables &amp; Local Ops</span>
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      -{formatInr(overheads.logistics_consumables)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-zinc-700/60">
                    <span className="text-[10px] text-muted-foreground block font-semibold">
                      {overheads.installer_payout_bonus > 0 ? "Installer Bonus & Overheads" : "Total Overheads"}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      -{formatInr(overheads.total_overheads)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <Button
                size="sm"
                variant={activeTab === "categories" ? "default" : "outline"}
                onClick={() => setActiveTab("categories")}
                className="min-h-[2rem] h-auto py-1.5 text-xs font-bold rounded-lg whitespace-normal leading-snug"
              >
                <Layers className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {t("adm_qpb_tab_cat", "Category Margins")}
              </Button>
              <Button
                size="sm"
                variant={activeTab === "items" ? "default" : "outline"}
                onClick={() => setActiveTab("items")}
                className="min-h-[2rem] h-auto py-1.5 text-xs font-bold rounded-lg whitespace-normal leading-snug"
              >
                <Cpu className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {t("adm_qpb_tab_items", "Itemized BOM Profit Audit ({count})", { count: String(items.length) })}
              </Button>
              <Button
                size="sm"
                variant={activeTab === "supply_only" ? "default" : "outline"}
                onClick={() => setActiveTab("supply_only")}
                className="min-h-[2rem] h-auto py-1.5 text-xs font-bold rounded-lg whitespace-normal leading-snug"
              >
                <Package className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {t("adm_qpb_tab_sup", "\"Supply-Only\" Simulator")}
              </Button>
            </div>

            {/* Tab 1: Category Margins */}
            {activeTab === "categories" && (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">{t("adm_qpb_th_catgrp", "Category Group")}</th>
                      <th className="py-2.5 px-3">{t("adm_qpb_th_type", "Type")}</th>
                      <th className="py-2.5 px-3 text-right">{t("adm_qpb_th_items", "Items")}</th>
                      <th className="py-2.5 px-3 text-right">{t("adm_qpb_th_sell", "Selling Total")}</th>
                      <th className="py-2.5 px-3 text-right">{t("adm_qpb_th_cost", "Direct Cost")}</th>
                      <th className="py-2.5 px-3 text-right">{t("adm_qpb_th_profit", "Gross Profit (₹)")}</th>
                      <th className="py-2.5 px-3 text-right">{t("adm_qpb_th_margin", "Margin (%)")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                    {categories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {cat.category === "storage" ? (
                            <HardDrive className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                          ) : cat.category === "recorder" ? (
                            <Cpu className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                          ) : cat.category === "amc" ? (
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          ) : cat.category === "commission" ? (
                            <Percent className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          ) : cat.category === "cable" ? (
                            <Activity className="w-3.5 h-3.5 shrink-0 text-cyan-600" />
                          ) : cat.category === "accessory" ? (
                            <Package className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                          ) : cat.is_service ? (
                            <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                          )}
                          {getCategoryLabel(cat.category, cat.label)}
                        </td>
                        <td className="py-2.5 px-3">
                          {cat.category === "commission" ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-semibold">Service Deduction</span>
                          ) : cat.is_service ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold">{t("adm_qpb_b_service", "Service")}</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 font-semibold">{t("adm_qpb_b_hardware", "Hardware")}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{cat.item_count}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{formatInr(cat.revenue)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-500">{formatInr(cat.cost)}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-bold ${cat.profit < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>{formatInr(cat.profit)}</td>
                        <td className={`py-2.5 px-3 text-right font-mono font-black ${getMarginTextColor(cat.margin_percent)}`}>
                          {formatPct(cat.margin_percent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Itemized BOM Profit Audit */}
            {activeTab === "items" && (
              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-80 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b text-zinc-500 dark:text-zinc-400 uppercase text-[10px] font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3">{t("adm_qpb_th_line_item", "Line Item")}</th>
                      <th className="py-2 px-3">{t("adm_qpb_th_cat", "Category")}</th>
                      <th className="py-2 px-3 text-right">{t("adm_qpb_th_qty", "Qty")}</th>
                      <th className="py-2 px-3 text-right">{t("adm_qpb_th_uprice", "Unit Price")}</th>
                      <th className="py-2 px-3 text-right">{t("adm_qpb_th_ucost", "Unit Cost")}</th>
                      <th className="py-2 px-3 text-right">{t("adm_qpb_th_tprofit", "Total Profit")}</th>
                      <th className="py-2 px-3 text-right">{t("adm_qpb_th_margin", "Margin (%)")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                    {items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                        <td className="py-2 px-3">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{it.name}</p>
                          {it.brand && <p className="text-[10px] text-zinc-500">{t("adm_qpb_brand_pfx", "Brand: {brand}", { brand: it.brand })}</p>}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-muted-foreground whitespace-normal leading-snug">
                          {getCategoryLabel(it.category, it.category_label)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono">{it.qty}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">{formatInr(it.unit_price)}</td>
                        <td className="py-2 px-3 text-right font-mono text-zinc-500">{formatInr(it.unit_cost)}</td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${it.profit_value < 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>{formatInr(it.profit_value)}</td>
                        <td className={`py-2 px-3 text-right font-mono font-black ${getMarginTextColor(it.profit_percent)}`}>
                          {formatPct(it.profit_percent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 3: Supply-Only Simulation */}
            {activeTab === "supply_only" && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-zinc-900 border border-indigo-200/80 dark:border-indigo-900/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 shrink-0 text-indigo-600" />
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {t("adm_qpb_sup_h4", "Supply-Only Customer Alternative (Zero-Labor Simulation)")}
                    </h4>
                  </div>
                  <Badge className="bg-indigo-600 text-white text-[10px] shrink-0">{t("adm_qpb_sup_badge", "What-If Model")}</Badge>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {t("adm_qpb_sup_desc", "If the customer negotiates to use their own electrician or internal maintenance crew for installation, here is your revised commercial reality:")}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t("adm_qpb_sup_bill", "Supply-Only Bill")}</span>
                    <span className="text-base font-black text-indigo-700 dark:text-indigo-400">
                      {formatInr(supply_only_estimate.total_payable_with_gst)}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t("adm_qpb_sup_saves", "Saves customer {amt}", { amt: formatInr(supply_only_estimate.savings_for_customer) })}</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t("adm_qpb_sup_profit", "Your Equipment Profit")}</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {formatInr(supply_only_estimate.profit)}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t("adm_qpb_sup_mat_gp", "Material Gross Profit")}</p>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">{t("adm_qpb_sup_mgn_pct", "Equipment Margin (%)")}</span>
                    <span className={`text-base font-black ${getMarginTextColor(supply_only_estimate.margin_percent)}`}>
                      {formatPct(supply_only_estimate.margin_percent)}
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t("adm_qpb_sup_std_mgn", "Standalone Product Margin")}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-100/60 dark:bg-indigo-950/40 text-[11px] text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                  💡 <strong>{t("adm_qpb_sup_tip_b", "Deal Tip:")}</strong>{" "}
                  {t("adm_qpb_sup_tip", "Offering \"Supply-Only\" protects your business if the client complains about installation rates. You still retain {amt} profit with zero installation liability!", {
                    amt: formatInr(supply_only_estimate.profit)
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </CardContent>
    </Card>
  );
}
