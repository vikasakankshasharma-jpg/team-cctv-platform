"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Clock, ShieldCheck, Wrench, AlertCircle } from "lucide-react";

export default function ServiceDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<any>(null);
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

      const res = await fetch(`/api/analytics/service?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch service metrics");
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
    
    router.push(`/reports/service?${query.toString()}`);
  };

  const STATUS_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280', '#ef4444'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service & AMC Dashboard</h1>
        <p className="text-sm text-gray-500">Ticket SLAs, Technician Performance, and AMC Utilization.</p>
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
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Service Data...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Avg Resolution Time</span>
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.summary.avgResolutionTimeHours.toFixed(1)}</span>
                <span className="text-sm text-gray-500 pb-1">hours</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">SLA Breach %</span>
                <AlertCircle className={`h-5 w-5 ${data.summary.slaBreachPercent > 10 ? 'text-red-500' : 'text-orange-500'}`} />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className={`text-2xl font-bold ${data.summary.slaBreachPercent > 10 ? 'text-red-600' : 'text-orange-600'}`}>
                    {data.summary.slaBreachPercent.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500 pb-1">({data.summary.ticketsBreachedSla} tickets)</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Active AMC Contracts</span>
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-900">{data.summary.activeAmcCount}</span>
                {data.summary.expiringSoonCount > 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{data.summary.expiringSoonCount} expiring in 30 days</p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Completed Jobs</span>
                <Wrench className="h-5 w-5 text-purple-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.jobStatus.COMPLETED}</span>
                <span className="text-xs text-gray-500 pb-1">/ {data.jobStatus.COMPLETED + data.jobStatus.SCHEDULED + data.jobStatus.PENDING_SCHEDULE} total</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Technician Performance */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Technician Productivity</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.technicianPerformance} layout="vertical" margin={{left: 40}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="technicianId" type="category" tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: '#f5f5f5'}} />
                      <Legend />
                      <Bar dataKey="assigned" fill="#93c5fd" name="Assigned Jobs" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="completed" fill="#3b82f6" name="Completed Jobs" radius={[0, 4, 4, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Ticket Status */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Service Ticket Status</h3>
               <div className="h-72 flex-1">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                          data={[
                              { name: 'Open', value: data.ticketStatus.OPEN },
                              { name: 'In Progress', value: data.ticketStatus.IN_PROGRESS },
                              { name: 'Resolved', value: data.ticketStatus.RESOLVED },
                              { name: 'Closed', value: data.ticketStatus.CLOSED },
                              { name: 'Escalated', value: data.ticketStatus.ESCALATED },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {STATUS_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
            
          </div>
          
          <div className="grid grid-cols-1 gap-6">
              {/* AMC Utilization */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">AMC Visit Utilization (Active Contracts)</h3>
                  <div className="flex flex-col md:flex-row gap-8 items-center justify-around w-full">
                      
                      <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Total Included Visits</p>
                          <p className="text-4xl font-bold text-gray-900">{data.amcUtilization.includedVisits}</p>
                      </div>
                      
                      <div className="text-3xl text-gray-300 font-light">-</div>
                      
                      <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Visits Consumed</p>
                          <p className="text-4xl font-bold text-blue-600">{data.amcUtilization.usedVisits}</p>
                      </div>
                      
                      <div className="text-3xl text-gray-300 font-light">=</div>
                      
                      <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Visits Remaining</p>
                          <p className="text-4xl font-bold text-green-600">{data.amcUtilization.remainingVisits}</p>
                      </div>

                  </div>
                  
                  {data.amcUtilization.usedVisits > data.amcUtilization.includedVisits && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5" />
                          <strong>Data Integrity Warning:</strong> Used visits exceed included visits across active contracts. 
                          This points to a failure in the Job Completion deduction logic.
                      </div>
                  )}
              </div>
          </div>
        </>
      ) : null}
    </div>
  );
}


