"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Target, Users, TrendingUp, DollarSign } from "lucide-react";

export default function SalesDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialFilters: Partial<ReportFilterState> = {
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    branchId: searchParams.get("branchId") || undefined,
    salespersonId: searchParams.get("salespersonId") || undefined,
  };

  const fetchMetrics = async (filters: Partial<ReportFilterState>) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (filters.startDate) query.set("startDate", filters.startDate);
      if (filters.endDate) query.set("endDate", filters.endDate);
      if (filters.branchId) query.set("branchId", filters.branchId);
      if (filters.salespersonId) query.set("salespersonId", filters.salespersonId);

      const res = await fetch(`/api/analytics/sales?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch sales metrics");
      setData(json.data);
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
    if (newFilters.salespersonId) query.set("salespersonId", newFilters.salespersonId);
    
    router.push(`/reports/sales?${query.toString()}`);
  };

  const formatCurr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm text-gray-500">Pipeline, Conversion Funnel, and Quote Trends.</p>
      </div>

      <ReportFilters 
        initialFilters={initialFilters}
        onFilterChange={handleFilterChange}
        showBranch={true}
        showPersonnel={true}
      />

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Sales Data...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Pipeline Value</span>
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-900">{formatCurr(data.summary.totalPipelineValue)}</span>
                <p className="text-xs text-gray-500 mt-1">From active quotes</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Average Deal Size</span>
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-900">{formatCurr(data.summary.averageDealSize)}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Quote Conversion</span>
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.summary.quoteToDealPercent.toFixed(1)}%</span>
                <span className="text-sm text-gray-500 pb-1">({data.summary.totalDeals}/{data.summary.totalQuotes})</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Leads</span>
                <Users className="h-5 w-5 text-orange-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.summary.totalLeads}</span>
                <span className="text-xs text-gray-500 pb-1">New inquiries</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Conversion Funnel / Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Monthly Generation & Conversion</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis yAxisId="left" tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="quotesGenerated" stroke="#8884d8" name="Quotes Generated" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="dealsWon" stroke="#82ca9d" name="Deals Won" strokeWidth={2} />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Simple Funnel Representation using BarChart */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Sales Funnel Volume</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { stage: 'Leads', count: data.summary.totalLeads },
                        { stage: 'Quotes', count: data.summary.totalQuotes },
                        { stage: 'Won Deals', count: data.summary.totalDeals },
                    ]} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f5f5f5'}} />
                      <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={40} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

          </div>
        </>
      ) : null}
    </div>
  );
}
