"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { Activity, AlertTriangle, CheckCircle, Package } from "lucide-react";

interface ExecutiveMetrics {
  openTickets: number;
  pendingJobs: number;
  lowStockItems: number;
  activeAmcContracts: number;
}

export default function ExecutiveDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract filters from URL
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

      const res = await fetch(`/api/analytics/executive/live?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch metrics");
      setMetrics(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch based on URL params
  useEffect(() => {
    fetchMetrics(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFilterChange = (newFilters: ReportFilterState) => {
    const query = new URLSearchParams();
    if (newFilters.startDate) query.set("startDate", newFilters.startDate);
    if (newFilters.endDate) query.set("endDate", newFilters.endDate);
    if (newFilters.branchId) query.set("branchId", newFilters.branchId);
    
    // Update URL, which triggers the useEffect to fetch
    router.push(`/reports/executive?${query.toString()}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard (Layer 1 - Live)</h1>
        <p className="text-sm text-gray-500">Real-time operational metrics across all branches.</p>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => (
             <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Open Service Tickets</span>
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">{metrics.openTickets}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Pending Jobs</span>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">{metrics.pendingJobs}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Low Stock Alerts</span>
              <Package className="h-5 w-5 text-red-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">{metrics.lowStockItems}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Active AMC Contracts</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold text-gray-900">{metrics.activeAmcContracts}</span>
            </div>
          </div>

        </div>
      ) : null}

      {/* Note on Future KPIs */}
      <div className="mt-12 p-6 bg-gray-50 border border-dashed rounded-lg text-center">
         <p className="text-gray-500 text-sm">
            Financial KPIs (Sales, Revenue, Profitability) will be added here once the Hybrid Profitability Engine is implemented.
         </p>
      </div>

    </div>
  );
}
