"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Loader2, 
  TrendingUp, 
  IndianRupee, 
  PieChart, 
  Activity, 
  Package, 
  Wrench, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Layers,
  HardDrive,
  Camera,
  Filter
} from "lucide-react";
import { safeFormatDate } from "@/lib/date-utils";

interface DealProfitItem {
  dealId: string;
  leadId: string;
  quoteId: string;
  customerName: string;
  customerMobile: string;
  city: string;
  status: string;
  isPaid: boolean;
  technology: string;
  planType: string;
  createdAt: string;
  period: string;

  // Turnkey Totals
  revenue: number;
  totalPayable: number;
  grossProfit: number;
  margin: number;

  // Product Margin (Without Services)
  productRevenue: number;
  productCost: number;
  productProfit: number;
  productMarginPercent: number;
  productItemCount: number;

  // Services Margin
  serviceRevenue: number;
  serviceCost: number;
  serviceProfit: number;
  serviceMarginPercent: number;
  serviceItemCount: number;

  // Overall Deal Margin (With Services)
  overallMarginPercent: number;

  // Health
  healthStatus: "healthy" | "subsidized" | "low_margin" | "critical";
  healthBadge: string;
  warnings?: string[];

  // Category breakdown
  categories?: Array<{
    category: string;
    label: string;
    is_service: boolean;
    item_count: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number;
  }>;
}

interface ProfitabilityResponse {
  summary: {
    totalDeals: number;
    totalRevenue: number;
    totalPayableWithGst: number;
    totalGrossProfit: number;
    averageMargin: number;

    totalProductRevenue: number;
    totalProductCost: number;
    totalProductProfit: number;
    avgProductMargin: number;

    totalServiceRevenue: number;
    totalServiceCost: number;
    totalServiceProfit: number;
    avgServiceMargin: number;

    healthCounts: {
      healthy: number;
      subsidized: number;
      low_margin: number;
      critical: number;
    };
  };
  deals: DealProfitItem[];
}

export function ProfitabilityAnalyticsClient() {
  const [data, setData] = useState<ProfitabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "won" | "quoted">("all");
  const [healthFilter, setHealthFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, healthFilter, techFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (healthFilter !== "all") params.set("health", healthFilter);
      if (techFilter !== "all") params.set("technology", techFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/analytics/profitability?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || json.error || "Failed to load profitability metrics");
      }
    } catch (e: any) {
      setError(e.message || "Network error loading metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  // Client-side search filtering fallback for instant responsiveness
  const filteredDeals = useMemo(() => {
    if (!data?.deals) return [];
    if (!searchQuery.trim()) return data.deals;
    const q = searchQuery.toLowerCase();
    return data.deals.filter(d => 
      d.customerName.toLowerCase().includes(q) ||
      d.customerMobile.includes(q) ||
      d.dealId.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q)
    );
  }, [data?.deals, searchQuery]);

  const toggleExpand = (dealId: string) => {
    setExpandedDealId(prev => prev === dealId ? null : dealId);
  };

  const formatInr = (val: number) => `₹${Math.round(val || 0).toLocaleString("en-IN")}`;
  const formatPct = (val: number) => `${Number(val || 0).toFixed(1)}%`;

  const getMarginTextColor = (pct: number) => {
    if (pct >= 20) return "text-emerald-600 dark:text-emerald-400 font-bold";
    if (pct >= 12) return "text-blue-600 dark:text-blue-400 font-bold";
    if (pct >= 8) return "text-amber-600 dark:text-amber-400 font-bold";
    return "text-rose-600 dark:text-rose-400 font-bold";
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">Healthy</Badge>;
      case "subsidized":
        return <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold">Subsidized</Badge>;
      case "low_margin":
        return <Badge className="bg-orange-600 text-white text-[10px] uppercase font-bold">Low Margin</Badge>;
      case "critical":
        return <Badge className="bg-rose-600 text-white text-[10px] uppercase font-bold animate-pulse">Critical</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">Normal</Badge>;
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!filteredDeals || filteredDeals.length === 0) return;

    const headers = [
      "Deal/Lead ID",
      "Customer Name",
      "Mobile",
      "City",
      "Technology",
      "Status",
      "Date",
      "Total Revenue (Ex-Tax)",
      "Total Payable (Inc-GST)",
      "Product Revenue",
      "Product Cost",
      "Product Profit",
      "Product Margin % (Without Services)",
      "Services Revenue",
      "Services Cost",
      "Services Profit",
      "Services Margin %",
      "Gross Profit (With Services)",
      "Blended Margin %",
      "Health Diagnosis"
    ];

    const rows = filteredDeals.map(d => [
      `"${d.dealId}"`,
      `"${d.customerName}"`,
      `"${d.customerMobile}"`,
      `"${d.city}"`,
      `"${d.technology}"`,
      `"${d.status}"`,
      `"${d.createdAt.slice(0, 10)}"`,
      d.revenue,
      d.totalPayable,
      d.productRevenue,
      d.productCost,
      d.productProfit,
      d.productMarginPercent,
      d.serviceRevenue,
      d.serviceCost,
      d.serviceProfit,
      d.serviceMarginPercent,
      d.grossProfit,
      d.margin,
      `"${d.healthBadge}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TEAM_CCTV_Profitability_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
        <p className="text-sm font-semibold text-muted-foreground">Calculating quotation profitability across leads...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 text-rose-700">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
        <p className="font-bold">Error loading profitability metrics: {error}</p>
        <Button onClick={fetchData} variant="outline" className="mt-4 border-rose-300">Retry</Button>
      </div>
    );
  }

  const summary = data?.summary || {
    totalDeals: 0,
    totalRevenue: 0,
    totalPayableWithGst: 0,
    totalGrossProfit: 0,
    averageMargin: 0,
    totalProductRevenue: 0,
    totalProductCost: 0,
    totalProductProfit: 0,
    avgProductMargin: 0,
    totalServiceRevenue: 0,
    totalServiceCost: 0,
    totalServiceProfit: 0,
    avgServiceMargin: 0,
    healthCounts: { healthy: 0, subsidized: 0, low_margin: 0, critical: 0 }
  };

  const totalRev = summary.totalRevenue || 1;
  const productShare = Math.min(100, Math.max(0, (summary.totalProductRevenue / totalRev) * 100));
  const serviceShare = Math.min(100, Math.max(0, (summary.totalServiceRevenue / totalRev) * 100));

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* ── Top 4 Executive KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Product Profit (Without Services) */}
        <Card className="bg-gradient-to-br from-blue-50/80 via-white to-blue-50/40 dark:from-blue-950/25 dark:via-zinc-900 dark:to-blue-950/10 border-blue-200/80 dark:border-blue-900/50 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                Product Profit (No Services)
              </span>
              <Badge variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-700 text-[10px] font-bold">
                {summary.avgProductMargin.toFixed(1)}% Avg
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-black text-blue-950 dark:text-blue-100">
              {formatInr(summary.totalProductProfit)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex justify-between font-medium">
              <span>Rev: {formatInr(summary.totalProductRevenue)}</span>
              <span>Cost: {formatInr(summary.totalProductCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Services / Labor Profit */}
        <Card className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 dark:from-amber-950/25 dark:via-zinc-900 dark:to-amber-950/10 border-amber-200/80 dark:border-amber-900/50 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                Labor & Services Profit
              </span>
              <Badge variant="outline" className="border-amber-200 dark:border-amber-800 text-amber-700 text-[10px] font-bold">
                {summary.avgServiceMargin.toFixed(1)}% Avg
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-black text-amber-950 dark:text-amber-100">
              {formatInr(summary.totalServiceProfit)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex justify-between font-medium">
              <span>Billed: {formatInr(summary.totalServiceRevenue)}</span>
              <span>Cost: {formatInr(summary.totalServiceCost)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Blended Deal Profit (With Services) */}
        <Card className="bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 dark:from-emerald-950/25 dark:via-zinc-900 dark:to-emerald-950/10 border-2 border-emerald-300 dark:border-emerald-800/60 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4" />
                Total Gross Profit
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase">
                {summary.averageMargin.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-black text-emerald-950 dark:text-emerald-100">
              {formatInr(summary.totalGrossProfit)}
            </div>
            <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-400 font-semibold">
              Turnkey Deal Profit (With Services)
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Total Revenue Across Deals */}
        <Card className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 dark:from-purple-950/25 dark:via-zinc-900 dark:to-purple-950/10 border-purple-200/80 dark:border-purple-900/50 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Turnkey Revenue
              </span>
              <Badge variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-700 text-[10px] font-bold">
                {summary.totalDeals} Deals
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl lg:text-3xl font-black text-purple-950 dark:text-purple-100">
              {formatInr(summary.totalRevenue)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground font-medium">
              Payable w/ GST: {formatInr(summary.totalPayableWithGst)}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Revenue Mix Composition Bar ──────────────────────────────────────── */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-zinc-500" />
            Company Revenue Mix:
          </span>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Hardware Equipment: {formatPct(productShare)} ({formatInr(summary.totalProductRevenue)})
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              Installation & Services: {formatPct(serviceShare)} ({formatInr(summary.totalServiceRevenue)})
            </span>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 flex overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300" 
            style={{ width: `${productShare}%` }} 
            title={`Equipment: ${formatPct(productShare)}`}
          />
          <div 
            className="bg-amber-500 h-full transition-all duration-300" 
            style={{ width: `${serviceShare}%` }} 
            title={`Services: ${formatPct(serviceShare)}`}
          />
        </div>
      </div>

      {/* ── Main Deal Breakdown Table Card ───────────────────────────────────── */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Deal Profitability Heatmap</span>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {filteredDeals.length} Quotations
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Live breakdown of Product Margins (Without Services) vs Turnkey Deal Margins (With Services)
              </CardDescription>
            </div>

            {/* Quick Export & Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="h-8 text-xs font-bold border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV Sheet
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="pt-3 flex flex-wrap items-center gap-2.5 text-xs">
            
            {/* Status Pills */}
            <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === "all" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All Leads
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("won")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === "won" ? "bg-emerald-600 text-white" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Won & Paid
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("quoted")}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                  statusFilter === "quoted" ? "bg-blue-600 text-white" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                In Pipeline
              </button>
            </div>

            {/* Health Filter */}
            <select
              value={healthFilter}
              onChange={e => setHealthFilter(e.target.value)}
              className="h-8 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Health (Healthy & Risk)</option>
              <option value="healthy">Healthy (≥18% Material)</option>
              <option value="subsidized">Subsidized by Labor (Low Hardware)</option>
              <option value="low_margin">Low Margin Alert (&lt;15%)</option>
              <option value="critical">Critical Risk Deals</option>
            </select>

            {/* Technology Filter */}
            <select
              value={techFilter}
              onChange={e => setTechFilter(e.target.value)}
              className="h-8 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Technologies</option>
              <option value="HD">HD Analog Only</option>
              <option value="IP">IP Network Only</option>
              <option value="Wireless">Wireless / WiFi Only</option>
            </select>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search customer, phone, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs w-full"
              />
            </form>

          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-800/60 text-[10px] uppercase font-bold text-zinc-500">
                <TableRow>
                  <TableHead className="py-2.5 px-3">Lead / Quote Details</TableHead>
                  <TableHead className="py-2.5 px-3">Status</TableHead>
                  <TableHead className="py-2.5 px-3 text-right">Revenue (Ex-Tax)</TableHead>
                  <TableHead className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">
                    Product Margin (No Services)
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400">
                    Service Margin
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">
                    Deal Margin (With Services)
                  </TableHead>
                  <TableHead className="py-2.5 px-3 text-center">Health</TableHead>
                  <TableHead className="py-2.5 px-3 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-medium">
                {filteredDeals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <p className="font-bold text-sm">No quotations found matching your filters.</p>
                      <p className="text-xs mt-1">Try resetting the status, technology, or search filters above.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeals.map(deal => {
                    const isExpanded = expandedDealId === deal.dealId;

                    return (
                      <React.Fragment key={deal.dealId}>
                        <TableRow className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                          
                          {/* Deal / Customer Info */}
                          <TableCell className="py-3 px-3">
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{deal.customerName}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {deal.technology}
                                </span>
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {deal.customerMobile ? `${deal.customerMobile} • ` : ""}{deal.city} • ID: <span className="font-mono">{deal.dealId.slice(0, 10)}</span>
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-0.2">
                                {safeFormatDate(deal.createdAt, "dd MMM yyyy, hh:mm a")}
                              </p>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell className="py-3 px-3">
                            <Badge className={`text-[10px] font-bold uppercase ${
                              deal.isPaid || deal.status === "WON" 
                                ? "bg-emerald-600 text-white" 
                                : deal.status === "SITE_VISIT" 
                                ? "bg-purple-600 text-white" 
                                : "bg-blue-600 text-white"
                            }`}>
                              {deal.status}
                            </Badge>
                          </TableCell>

                          {/* Revenue */}
                          <TableCell className="py-3 px-3 text-right font-mono">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{formatInr(deal.revenue)}</span>
                            <span className="text-[10px] text-muted-foreground">w/ GST: {formatInr(deal.totalPayable)}</span>
                          </TableCell>

                          {/* Product Margin (Without Services) */}
                          <TableCell className="py-3 px-3 text-right font-mono">
                            <div className={getMarginTextColor(deal.productMarginPercent)}>
                              {formatPct(deal.productMarginPercent)}
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-normal">
                              Profit: {formatInr(deal.productProfit)}
                            </span>
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              Cost: {formatInr(deal.productCost)}
                            </span>
                          </TableCell>

                          {/* Services Margin */}
                          <TableCell className="py-3 px-3 text-right font-mono">
                            <div className={getMarginTextColor(deal.serviceMarginPercent)}>
                              {formatPct(deal.serviceMarginPercent)}
                            </div>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block font-normal">
                              Profit: {formatInr(deal.serviceProfit)}
                            </span>
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              Cost: {formatInr(deal.serviceCost)}
                            </span>
                          </TableCell>

                          {/* Blended Deal Margin (With Services) */}
                          <TableCell className="py-3 px-3 text-right font-mono">
                            <div className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {formatPct(deal.overallMarginPercent || deal.margin)}
                            </div>
                            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 block">
                              Profit: {formatInr(deal.grossProfit)}
                            </span>
                          </TableCell>

                          {/* Health Badge */}
                          <TableCell className="py-3 px-3 text-center">
                            {getHealthBadge(deal.healthStatus)}
                          </TableCell>

                          {/* Actions: View Lead & Expand */}
                          <TableCell className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleExpand(deal.dealId)}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                title="View Category Margins"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </Button>

                              <Link href={`/admin/leads/${deal.leadId || deal.dealId}`}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs font-bold border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>

                        </TableRow>

                        {/* Expandable Category Drill-Down Row */}
                        {isExpanded && deal.categories && deal.categories.length > 0 && (
                          <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/60">
                            <TableCell colSpan={8} className="p-3">
                              <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60 space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-zinc-200 border-b pb-1.5">
                                  <span>Category Margin Breakdown for {deal.customerName} (Quote: {deal.quoteId}):</span>
                                  <span className="text-muted-foreground font-mono font-normal text-[11px]">
                                    Net Taxable: {formatInr(deal.revenue)} • Gross Profit: {formatInr(deal.grossProfit)}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                                  {deal.categories.map((cat, cIdx) => (
                                    <div key={cIdx} className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 text-center">
                                      <span className="text-[10px] text-muted-foreground uppercase font-bold block truncate" title={cat.label}>
                                        {cat.label.split(" ")[0]}
                                      </span>
                                      <span className={`text-xs font-black block mt-0.5 ${getMarginTextColor(cat.margin_percent)}`}>
                                        {formatPct(cat.margin_percent)}
                                      </span>
                                      <span className="text-[10px] text-zinc-500 block">
                                        Profit: {formatInr(cat.profit)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
