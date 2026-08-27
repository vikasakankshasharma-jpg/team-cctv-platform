"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Package, AlertTriangle, Layers, ArrowDownUp } from "lucide-react";

export default function InventoryDashboard() {
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

      const res = await fetch(`/api/analytics/inventory?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch inventory metrics");
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
    
    router.push(`/reports/inventory?${query.toString()}`);
  };

  const formatCurr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const SERIAL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6b7280'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500">Stock Valuation, Serial Assets, and Movement Analysis.</p>
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
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Inventory Data...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Valuation</span>
                <DollarSignIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-2xl font-bold text-gray-900">{formatCurr(data.summary.totalValuation)}</span>
                <p className="text-xs text-gray-400 mt-1">Based on unit purchase cost</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Available Stock</span>
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.summary.totalItemsInStock.toLocaleString()}</span>
                <span className="text-sm text-gray-500 pb-1">units</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Reserved (Jobs/RMA)</span>
                <Layers className="h-5 w-5 text-orange-500" />
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900">{data.summary.totalReserved.toLocaleString()}</span>
                <span className="text-sm text-gray-500 pb-1">units</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Low Stock SKUs</span>
                <AlertTriangle className={`h-5 w-5 ${data.summary.lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <div className="mt-4">
                <span className={`text-2xl font-bold ${data.summary.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{data.summary.lowStockCount}</span>
                <p className="text-xs text-gray-400 mt-1">Below reorder threshold</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Movement Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2"><ArrowDownUp className="h-5 w-5"/> IN vs OUT Trend</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="IN" fill="#3b82f6" name="Procured (IN)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="OUT" fill="#ef4444" name="Consumed (OUT)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Serial Asset Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Serial Asset Status</h3>
               <div className="h-72 flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                          data={[
                              { name: 'In Stock', value: data.serialStatus.IN_STOCK },
                              { name: 'Reserved', value: data.serialStatus.RESERVED },
                              { name: 'Installed', value: data.serialStatus.INSTALLED },
                              { name: 'RMA', value: data.serialStatus.RMA },
                              { name: 'Retired', value: data.serialStatus.RETIRED },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        >
                          {SERIAL_COLORS.map((color, index) => (
                              <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fast Moving */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Fast Moving SKUs (By Consumption)</h3>
                  <div className="space-y-3">
                      {data.fastMoving.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <div className="text-right">
                                <span className="font-bold text-gray-900">{item.consumedQty}</span>
                                <span className="text-xs text-gray-500 block">units OUT</span>
                              </div>
                          </div>
                      ))}
                      {data.fastMoving.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No OUT movements in this period.</p>
                      )}
                  </div>
              </div>

              {/* Slow Moving / Dead Stock */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Slow Moving / Aging Stock</h3>
                  <p className="text-xs text-gray-500 mb-4">Items with &gt;0 stock but 0 consumption in period.</p>
                  <div className="space-y-3">
                      {data.slowMoving.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-md border border-red-100">
                              <span className="font-medium text-gray-700">{item.name}</span>
                              <div className="text-right">
                                <span className="font-bold text-red-600">{item.stock}</span>
                                <span className="text-xs text-gray-500 block">in stock</span>
                              </div>
                          </div>
                      ))}
                      {data.slowMoving.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No slow moving stock found.</p>
                      )}
                  </div>
              </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// Inline Icon to avoid adding more imports
function DollarSignIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
  );
}


