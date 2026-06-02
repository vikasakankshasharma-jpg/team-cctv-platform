"use client";

import { useState, useMemo } from "react";
import { Download, Calendar, TrendingUp, Users, Package, BadgeDollarSign, Filter } from "lucide-react";
import type { Lead, PricingResult, Product } from "@/types";
import { PageHeader } from "./PageHeader";
import { AnalyticsChart } from "./AnalyticsChart";
import Papa from "papaparse";

interface ReportEntry {
  lead: Lead;
  quote: PricingResult | null;
}

interface ReportsClientProps {
  data: ReportEntry[];
  products: Product[];
  promoters: { id: string; name: string; business_name?: string }[];
}

type ReportType = "sales" | "leads" | "products" | "promoters";

export function ReportsClient({ data: allData, products, promoters }: ReportsClientProps) {
  const [reportType, setReportType] = useState<ReportType>("sales");
  
  // Default date range: Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

  // Apply Date Filter
  const filteredData = useMemo(() => {
    return allData.filter(({ lead }) => {
      const createdAt = (lead.created_at as any)?.seconds
        ? new Date((lead.created_at as any).seconds * 1000)
        : new Date(lead.created_at as string);
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      return createdAt >= start && createdAt <= end;
    });
  }, [allData, startDate, endDate]);

  const wonData = useMemo(() => filteredData.filter(d => d.lead.status === "won" && d.quote), [filteredData]);

  // Aggregates for Sales
  const salesAggregates = useMemo(() => {
    const totalQuoteValue = wonData.reduce((acc, curr) => acc + curr.quote!.total_payable, 0);
    const avgQuoteValue = wonData.length > 0 ? Math.round(totalQuoteValue / wonData.length) : 0;
    const ipCount = wonData.filter(e => e.lead.technology_choice === 'IP').length;
    const hdCount = wonData.filter(e => e.lead.technology_choice === 'HD').length;

    const addonFrequency: Record<string, number> = {};
    wonData.forEach(e => {
      e.quote!.addons.forEach(addon => {
        addonFrequency[addon.display_name] = (addonFrequency[addon.display_name] || 0) + 1;
      });
    });

    const sortedAddons = Object.entries(addonFrequency).sort((a, b) => b[1] - a[1]);
    const topAddon = sortedAddons.length > 0 
      ? { name: sortedAddons[0][0], percentage: `${Math.round((sortedAddons[0][1] / wonData.length) * 100)}%` }
      : { name: "N/A", percentage: "0%" };

    const revenueTrend: Record<string, number> = {};
    wonData.forEach(e => {
      const dateStr = new Date((e.lead.created_at as any)?.seconds ? (e.lead.created_at as any).seconds * 1000 : e.lead.created_at as string).toISOString().split('T')[0];
      revenueTrend[dateStr] = (revenueTrend[dateStr] || 0) + e.quote!.total_payable;
    });

    return { totalQuoteValue, avgQuoteValue, ipCount, hdCount, topAddon, revenueTrend: Object.entries(revenueTrend).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date)) };
  }, [wonData]);

  // Aggregates for Leads
  const leadsAggregates = useMemo(() => {
    const total = filteredData.length;
    const quoted = filteredData.filter(d => d.lead.status === "quoted" || d.lead.status === "won" || d.lead.status === "lost").length;
    const won = wonData.length;
    return {
      total,
      quoted,
      won,
      conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
      quotedRate: total > 0 ? Math.round((quoted / total) * 100) : 0
    };
  }, [filteredData, wonData]);

  // Aggregates for Promoters
  const promoterAggregates = useMemo(() => {
    const pMap: Record<string, { leads: number, won: number, revenue: number, name: string }> = {};
    filteredData.forEach(d => {
      const pId = d.lead.promoter_id || "organic";
      const pName = (d.lead as any).promoter_name || "Organic Direct";
      
      if (!pMap[pId]) pMap[pId] = { leads: 0, won: 0, revenue: 0, name: pName };
      pMap[pId].leads += 1;
      
      if (d.lead.status === "won" && d.quote) {
        pMap[pId].won += 1;
        pMap[pId].revenue += d.quote.total_payable;
      }
    });
    return Object.values(pMap).sort((a, b) => b.revenue - a.revenue);
  }, [filteredData]);

  // Aggregates for Products
  const productAggregates = useMemo(() => {
    const total = products.length;
    const avgMargin = total > 0 ? Math.round(products.reduce((acc, p) => acc + (p.margin_percentage || 0), 0) / total) : 0;
    const active = products.filter(p => p.is_active).length;
    return { total, avgMargin, active };
  }, [products]);

  const exportToCSV = () => {
    let exportData: any[] = [];
    let filename = "";

    if (reportType === "sales") {
      filename = `Sales_Report_${startDate}_to_${endDate}.csv`;
      exportData = wonData.map(({ lead, quote }) => ({
        "Customer Name": lead.customer_name,
        "Mobile": lead.mobile_number,
        "Property Type": lead.property_type,
        "Tech Choice": lead.technology_choice,
        "Promoter": (lead as any).promoter_name || "ORGANIC",
        "Net Taxable (Rs)": quote!.net_taxable_amount,
        "Total Payable (Rs)": quote!.total_payable,
        "Plan": quote!.plan_type,
        "Date": new Date(((lead.created_at as any)?.seconds ? (lead.created_at as any).seconds * 1000 : lead.created_at) as string).toLocaleDateString()
      }));
    } else if (reportType === "leads") {
      filename = `Leads_Pipeline_Report_${startDate}_to_${endDate}.csv`;
      exportData = filteredData.map(({ lead }) => ({
        "Customer Name": lead.customer_name,
        "Mobile": lead.mobile_number,
        "Status": lead.status,
        "Property Type": lead.property_type,
        "Tech Choice": lead.technology_choice,
        "Source": (lead as any).promoter_name || "ORGANIC",
        "Date Created": new Date(((lead.created_at as any)?.seconds ? (lead.created_at as any).seconds * 1000 : lead.created_at) as string).toLocaleDateString()
      }));
    } else if (reportType === "products") {
      filename = `Product_Intelligence_Report_${new Date().toISOString().split('T')[0]}.csv`;
      exportData = products.map(p => ({
        "Display Name": p.display_name,
        "SKU": p.technical_name,
        "Category": p.category,
        "Technology": p.technologies?.join(', '),
        "Base Cost (Rs)": p.base_cost,
        "Margin (%)": p.margin_percentage,
        "Unit Price (Rs)": p.unit_price,
        "Active": p.is_active ? "Yes" : "No"
      }));
    } else if (reportType === "promoters") {
      filename = `Promoter_Performance_${startDate}_to_${endDate}.csv`;
      exportData = promoterAggregates.map(p => ({
        "Promoter Name": p.name,
        "Total Leads Generated": p.leads,
        "Deals Won": p.won,
        "Conversion Rate (%)": p.leads > 0 ? Math.round((p.won / p.leads) * 100) : 0,
        "Total Revenue Generated (Rs)": p.revenue
      }));
    }

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <PageHeader
        icon={Filter}
        title="Custom Intelligence Engine"
        description="Filter, analyze, and export multi-dimensional data across the entire Catalyst pipeline."
        badge={`${filteredData.length} Records in Range`}
        action={
          <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Start Date</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white border-none outline-none focus:ring-0 px-2"
                />
             </div>
             <div className="w-[1px] h-8 bg-zinc-200 dark:bg-zinc-800" />
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">End Date</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-zinc-900 dark:text-white border-none outline-none focus:ring-0 px-2"
                />
             </div>
          </div>
        }
      />

      <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
        {[
          { id: "sales", label: "Sales & Revenue", icon: TrendingUp },
          { id: "leads", label: "Leads Pipeline", icon: Users },
          { id: "products", label: "Product Intelligence", icon: Package },
          { id: "promoters", label: "Promoter Performance", icon: BadgeDollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={`flex items-center gap-2 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
              reportType === tab.id 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        
        <div className="ml-auto">
          <button
            onClick={exportToCSV}
            className="group flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 px-6 py-4 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 whitespace-nowrap"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Export {reportType} CSV
          </button>
        </div>
      </div>

      {/* DYNAMIC REPORT CONTENT */}
      {reportType === "sales" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
           {/* Same style blocks as old sales report */}
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Total Revenue Generated</p>
             <p className="text-4xl font-black text-zinc-900 dark:text-white">₹{salesAggregates.totalQuoteValue.toLocaleString('en-IN')}</p>
             <p className="text-[10px] font-bold text-blue-500 mt-2">{wonData.length} Closed Deals</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Average Deal Size</p>
             <p className="text-4xl font-black text-zinc-900 dark:text-white">₹{salesAggregates.avgQuoteValue.toLocaleString('en-IN')}</p>
             <p className="text-[10px] font-bold text-indigo-500 mt-2">IP: {salesAggregates.ipCount} | HD: {salesAggregates.hdCount}</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Top Add-on Catalyst</p>
             <p className="text-2xl font-black text-amber-600 leading-tight uppercase tracking-tighter">{salesAggregates.topAddon.name}</p>
             <p className="text-[10px] font-bold text-amber-500 mt-2">Attached to {salesAggregates.topAddon.percentage} of won deals</p>
           </div>
           <div className="md:col-span-3">
             <AnalyticsChart data={salesAggregates.revenueTrend} title="Revenue Acquisition Flow (Selected Range)" />
           </div>
        </div>
      )}

      {reportType === "leads" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Total Acquired Leads</p>
             <p className="text-5xl font-black text-zinc-900 dark:text-white">{leadsAggregates.total}</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Proceeded to Quote</p>
             <p className="text-5xl font-black text-blue-500">{leadsAggregates.quotedRate}%</p>
             <p className="text-[10px] font-bold text-blue-400 mt-2">{leadsAggregates.quoted} out of {leadsAggregates.total}</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Deals Won</p>
             <p className="text-5xl font-black text-emerald-500">{leadsAggregates.won}</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Global Conversion Rate</p>
             <p className="text-5xl font-black text-emerald-600">{leadsAggregates.conversionRate}%</p>
           </div>
        </div>
      )}

      {reportType === "products" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Total Catalog Size</p>
             <p className="text-5xl font-black text-zinc-900 dark:text-white">{productAggregates.total}</p>
             <p className="text-[10px] font-bold text-blue-500 mt-2">{productAggregates.active} Active SKUs</p>
           </div>
           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8 shadow-lg">
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-4">Average Gross Margin</p>
             <p className="text-5xl font-black text-emerald-500">{productAggregates.avgMargin}%</p>
             <p className="text-[10px] font-bold text-emerald-400 mt-2">Across all products</p>
           </div>
           <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 shadow-inner flex flex-col justify-center items-center text-center">
             <Package className="w-12 h-12 text-amber-500 mb-4" />
             <p className="text-sm font-black text-amber-600 uppercase tracking-widest">To edit products, use the Export/Import functionality in Data Management.</p>
           </div>
        </div>
      )}

      {reportType === "promoters" && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
               <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-[0.2em] font-black">
                 <tr>
                   <th className="px-8 py-6">Promoter / Source</th>
                   <th className="px-8 py-6 text-center">Total Leads</th>
                   <th className="px-8 py-6 text-center">Deals Won</th>
                   <th className="px-8 py-6 text-center">Conversion</th>
                   <th className="px-8 py-6 text-right">Revenue Generated</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 font-medium text-zinc-600 dark:text-zinc-300">
                 {promoterAggregates.map((p, idx) => (
                   <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                     <td className="px-8 py-6 font-black text-zinc-900 dark:text-white uppercase tracking-wider">{p.name}</td>
                     <td className="px-8 py-6 text-center">{p.leads}</td>
                     <td className="px-8 py-6 text-center text-blue-600 dark:text-blue-400 font-bold">{p.won}</td>
                     <td className="px-8 py-6 text-center text-emerald-600 dark:text-emerald-400 font-bold">{p.leads > 0 ? Math.round((p.won/p.leads)*100) : 0}%</td>
                     <td className="px-8 py-6 text-right font-black text-zinc-900 dark:text-white">₹{p.revenue.toLocaleString('en-IN')}</td>
                   </tr>
                 ))}
                 {promoterAggregates.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-8 py-16 text-center text-zinc-400 font-black uppercase tracking-widest">No Promoter Activity in Range</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>
      )}

    </div>
  );
}
