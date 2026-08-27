"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { 
  createColumnHelper, 
  flexRender, 
  useReactTable, getCoreRowModel, 
  
  getExpandedRowModel
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Calculator, FileText } from "lucide-react";

interface ProfitabilityCostBreakdown {
  purchase: number;
  freight: number;
  installation: number;
  warrantyParts: number;
  warrantyLabour: number;
  amcParts: number;
  amcLabour: number;
  rmaOperational: number;
}

interface ProfitabilityResult {
  dealId: string;
  period: string;
  revenue: number;
  costs: ProfitabilityCostBreakdown;
  grossProfit: number;
  calculationVersion: string;
  calculatedAt: string;
  sourceRefs: string[];
  isLiveRecalculated?: boolean;
}

const columnHelper = createColumnHelper<ProfitabilityResult>();

export default function ProfitabilityDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<ProfitabilityResult[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialFilters: Partial<ReportFilterState> = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    branchId: searchParams.get("branchId") || undefined,
  };

  const fetchMetrics = async (filters: Partial<ReportFilterState>) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filters.startDate) query.set("startDate", filters.startDate);
      if (filters.endDate) query.set("endDate", filters.endDate);
      if (filters.branchId) query.set("branchId", filters.branchId);

      const res = await fetch(`/api/analytics/profitability?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch metrics");
      setData(json.data.deals);
      setSummary(json.data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilterChange = (newFilters: ReportFilterState) => {
    const query = new URLSearchParams();
    if (newFilters.startDate) query.set("startDate", newFilters.startDate);
    if (newFilters.endDate) query.set("endDate", newFilters.endDate);
    if (newFilters.branchId) query.set("branchId", newFilters.branchId);
    router.push(`/reports/profitability?${query.toString()}`);
  };

  const formatCurr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {row.getIsExpanded() ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      ),
    }),
    columnHelper.accessor('dealId', {
      header: 'Deal ID',
      cell: info => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    }),
    columnHelper.accessor('revenue', {
      header: 'Revenue',
      cell: info => <span className="text-green-700 font-medium">{formatCurr(info.getValue())}</span>,
    }),
    columnHelper.accessor(row => {
        const c = row.costs;
        return c.purchase + c.freight + c.installation + c.warrantyParts + c.warrantyLabour + c.amcParts + c.amcLabour + c.rmaOperational;
    }, {
      id: 'totalCost',
      header: 'Total Cost',
      cell: info => <span className="text-red-700">{formatCurr(info.getValue())}</span>,
    }),
    columnHelper.accessor('grossProfit', {
      header: 'Gross Profit',
      cell: info => {
          const val = info.getValue();
          return <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurr(val)}</span>;
      },
    }),
    columnHelper.accessor(row => row.revenue > 0 ? (row.grossProfit / row.revenue) * 100 : 0, {
      id: 'margin',
      header: 'Margin %',
      cell: info => <span className="font-medium">{info.getValue().toFixed(1)}%</span>,
    }),
    columnHelper.accessor('isLiveRecalculated', {
      header: 'Cache Status',
      cell: info => info.getValue() ? 
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">LIVE DELTA</span> : 
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">SNAPSHOT</span>,
    }),
    columnHelper.accessor('calculatedAt', {
      header: 'Calculated At',
      cell: info => <span className="text-xs text-gray-500">{new Date(info.getValue()).toLocaleString()}</span>,
    })
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profitability Dashboard (Layer 2)</h1>
        <p className="text-sm text-gray-500">Hybrid Materialized View: Nightly Snapshots + Intra-day Transaction Delta.</p>
      </div>

      <ReportFilters 
        initialFilters={initialFilters}
        onFilterChange={handleFilterChange}
        showBranch={true}
      />

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {summary && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Total Deals</span>
            <div className="text-2xl font-bold mt-1">{summary.totalDeals}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Total Revenue</span>
            <div className="text-2xl font-bold mt-1 text-green-700">{formatCurr(summary.totalRevenue)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Gross Profit</span>
            <div className="text-2xl font-bold mt-1 text-blue-700">{formatCurr(summary.totalGrossProfit)}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <span className="text-sm text-gray-500">Average Margin</span>
            <div className="text-2xl font-bold mt-1">{summary.averageMargin.toFixed(1)}%</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
           <div className="p-8 text-center text-gray-500 animate-pulse">Calculating Profitability Engine...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b text-gray-700">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="px-4 py-3 font-semibold">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y">
                {table.getRowModel().rows.map(row => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                    {row.getIsExpanded() && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={columns.length} className="px-10 py-4 border-b">
                          <div className="grid grid-cols-2 gap-8">
                             {/* Cost Breakdown */}
                             <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                   <Calculator className="h-4 w-4" /> Cost Breakdown
                                </h4>
                                <div className="space-y-1 text-sm">
                                   <div className="flex justify-between"><span>Purchase (Assets):</span> <span>{formatCurr(row.original.costs.purchase)}</span></div>
                                   <div className="flex justify-between"><span>Freight/Procurement:</span> <span>{formatCurr(row.original.costs.freight)}</span></div>
                                   <div className="flex justify-between"><span>Installation Labour:</span> <span>{formatCurr(row.original.costs.installation)}</span></div>
                                   <div className="flex justify-between text-orange-700"><span>Warranty Parts (Ledger OUT):</span> <span>{formatCurr(row.original.costs.warrantyParts)}</span></div>
                                   <div className="flex justify-between text-orange-700"><span>Warranty Labour:</span> <span>{formatCurr(row.original.costs.warrantyLabour)}</span></div>
                                   <div className="flex justify-between text-purple-700"><span>AMC Parts:</span> <span>{formatCurr(row.original.costs.amcParts)}</span></div>
                                   <div className="flex justify-between text-purple-700"><span>AMC Labour:</span> <span>{formatCurr(row.original.costs.amcLabour)}</span></div>
                                   <div className="flex justify-between text-red-700"><span>RMA Operational:</span> <span>{formatCurr(row.original.costs.rmaOperational)}</span></div>
                                </div>
                             </div>
                             
                             {/* Source References */}
                             <div>
                                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                   <FileText className="h-4 w-4" /> Source Transactions (v{row.original.calculationVersion})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                   {row.original.sourceRefs.map(ref => (
                                      <span key={ref} className="px-2 py-1 bg-white border rounded text-xs text-gray-600 font-mono shadow-sm">
                                         {ref}
                                      </span>
                                   ))}
                                </div>
                             </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {data.length === 0 && (
                   <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                         No deals found in this period.
                      </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}








