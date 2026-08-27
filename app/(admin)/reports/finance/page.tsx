"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReportFilters, ReportFilterState } from "@/components/ui/report-filters";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Wallet, FileText, AlertCircle } from "lucide-react";

export default function FinanceDashboard() {
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

      const res = await fetch(`/api/analytics/finance?${query.toString()}`);
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error?.message || "Failed to fetch finance metrics");
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
    
    router.push(`/reports/finance?${query.toString()}`);
  };

  const formatCurr = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#EF4444'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="text-sm text-gray-500">Revenue, Cash Collection, and Outstanding Receivables.</p>
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
        <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-400">Loading Finance Data...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Monthly Revenue (Invoiced)</span>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">{formatCurr(data.summary.totalRevenue)}</span>
                <p className="text-xs text-gray-400 mt-1">Excludes cancelled invoices</p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Cash Collected (Receipts)</span>
                <Wallet className="h-5 w-5 text-green-500" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-green-700">{formatCurr(data.summary.totalCashCollected)}</span>
                <p className="text-xs text-gray-400 mt-1">Total posted receipts</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col justify-between border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Outstanding</span>
                <AlertCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold text-orange-700">{formatCurr(data.summary.totalOutstanding)}</span>
                <p className="text-xs text-gray-400 mt-1">Unpaid invoice balances</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Revenue vs Cash Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Revenue vs Cash Collected</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{fontSize: 12}} />
                      <YAxis yAxisId="left" tick={{fontSize: 12}} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(value: any) => formatCurr(value as number)} />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue (Invoiced)" strokeWidth={2} />
                      <Line yAxisId="left" type="monotone" dataKey="cashCollected" stroke="#22c55e" name="Cash Collected" strokeWidth={2} />
                    </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Receivables Aging */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-800 mb-6">Receivables Aging</h3>
               <div className="h-72">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                        { bucket: 'Current', amount: data.agingBuckets['current'] },
                        { bucket: '1-30 Days', amount: data.agingBuckets['1-30'] },
                        { bucket: '31-60 Days', amount: data.agingBuckets['31-60'] },
                        { bucket: '61-90 Days', amount: data.agingBuckets['61-90'] },
                        { bucket: '90+ Days', amount: data.agingBuckets['90+'] },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bucket" tick={{fontSize: 12}} />
                      <YAxis tick={{fontSize: 12}} tickFormatter={(v) => `₹${v/1000}k`} />
                      <Tooltip formatter={(value: any) => formatCurr(value as number)} cursor={{fill: '#f5f5f5'}} />
                      <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Invoice Status Breakdown */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Invoice Status Breakdown</h3>
                  <div className="h-64 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                data={[
                                    { name: 'Draft', value: data.statusBreakdown.DRAFT },
                                    { name: 'Sent', value: data.statusBreakdown.SENT },
                                    { name: 'Partial', value: data.statusBreakdown.PARTIAL },
                                    { name: 'Paid', value: data.statusBreakdown.PAID },
                                    { name: 'Overdue', value: data.statusBreakdown.OVERDUE },
                                ].filter(d => d.value > 0)}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {['#9ca3af', '#60a5fa', '#fbbf24', '#34d399', '#f87171'].map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Top Outstanding Customers */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Top Outstanding Customers</h3>
                  <div className="space-y-4">
                      {data.topOutstanding.map((customer: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-100">
                              <span className="font-medium text-gray-700">{customer.customerId}</span>
                              <span className="font-bold text-red-600">{formatCurr(customer.amount)}</span>
                          </div>
                      ))}
                      {data.topOutstanding.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No outstanding balances.</p>
                      )}
                  </div>
              </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

