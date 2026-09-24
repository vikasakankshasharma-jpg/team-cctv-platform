"use client";

import { useState } from "react";
import { TrendingUp, Clock, CheckCircle2, IndianRupee, History, AlertTriangle, Calculator, FileText } from "lucide-react";

interface PartnerCommissionsClientProps {
  records: {
    id: string;
    lead_id: string;
    customer_name: string;
    ex_tax_amount: number;
    commission_amount: number;
    status: string;
    created_at: string;
    paid_at?: string;
  }[];
  summary: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
    tdsDeducted: number;
    netPayable: number;
    tdsRatePercent: number;
    hasValidPan: boolean;
  };
}

export function PartnerCommissionsClient({ records, summary }: PartnerCommissionsClientProps) {
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRecords = records.filter(record => {
    return statusFilter === "all" || record.status === statusFilter;
  });

  const STATS = [
    { label: "Gross Earned", value: summary.totalEarned, icon: IndianRupee, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Pending Payout", value: summary.totalPending, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Cleared to Bank", value: summary.totalPaid, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          Commission Ledger
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-2 max-w-lg">
          Detailed history of your earnings. Payouts automatically include Govt TDS deductions (Sec 194H) and are transferred to your bank account.
        </p>
      </div>

      {/* PAN Warning if applicable */}
      {!summary.hasValidPan && summary.totalEarned > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-2xl flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Missing or Invalid PAN Number</h3>
            <p className="text-sm text-red-700 mt-1">
              By law, we are forced to deduct a penal <strong>20% TDS</strong> on your commissions because you have not provided a valid PAN. Please update your profile immediately to drop the rate to 5%.
            </p>
          </div>
        </div>
      )}

      {/* The 194H Tax Breakdown Card */}
      <div className="bg-white rounded-[32px] p-6 sm:p-8 border shadow-sm relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-gray-900/5 rounded-bl-[100px] -z-10" />
         
         <div className="flex items-center gap-3 mb-6">
           <Calculator className="w-6 h-6 text-gray-400" />
           <h2 className="text-xl font-bold text-gray-900">Tax Breakdown & Net Payable</h2>
           <span className="px-3 py-1 bg-gray-100 text-gray-600 font-bold text-xs rounded-full ml-auto">Sec 194H</span>
         </div>

         <div className="flex flex-col md:flex-row md:items-center gap-6">
           {/* Step 1: Gross */}
           <div className="flex-1 space-y-1">
             <div className="text-sm font-bold text-gray-500">Gross Commission</div>
             <div className="text-3xl font-black text-gray-900">₹{summary.totalEarned.toLocaleString()}</div>
           </div>
           
           <div className="hidden md:block text-2xl font-black text-gray-300">-</div>
           
           {/* Step 2: TDS */}
           <div className="flex-1 space-y-1">
             <div className="text-sm font-bold text-red-500 flex items-center gap-2">
                TDS Deducted ({summary.tdsRatePercent}%)
                <FileText className="w-3.5 h-3.5" />
             </div>
             <div className="text-3xl font-black text-red-600">₹{summary.tdsDeducted.toLocaleString()}</div>
             <div className="text-xs text-red-400 font-medium">Deposited to Govt against your PAN</div>
           </div>
           
           <div className="hidden md:block text-2xl font-black text-gray-300">=</div>

           {/* Step 3: Net */}
           <div className="flex-1 space-y-1">
             <div className="text-sm font-bold text-emerald-500">Net Payable to Bank</div>
             <div className="text-4xl font-black text-emerald-600">₹{summary.netPayable.toLocaleString()}</div>
             <div className="text-xs text-emerald-600/70 font-medium">Your final take-home cash</div>
           </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-[24px] p-6 border shadow-sm flex items-center gap-4">
            <div className={\`w-14 h-14 rounded-2xl \${stat.bg} flex items-center justify-center shrink-0\`}>
              <stat.icon className={\`w-7 h-7 \${stat.color}\`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500">{stat.label}</p>
              <h3 className="text-2xl font-black text-gray-900">₹{stat.value.toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[24px] border shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            Payout History
          </h2>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {["all", "pending", "paid"].map(status => (
              <button 
                key={status} 
                onClick={() => setStatusFilter(status)}
                className={\`px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all \${statusFilter === status ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}\`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-bold border-b">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Order Value (Ex Tax)</th>
                <th className="px-6 py-4 whitespace-nowrap">Gross Commission</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400 font-bold text-lg">No records found</p>
                    <p className="text-gray-400 text-sm mt-1">Start sharing your referral code to earn.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {new Date(record.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">{record.customer_name}</td>
                    <td className="px-6 py-4 font-medium text-gray-600">₹{record.ex_tax_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-gray-900">₹{record.commission_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={\`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize tracking-wide \${record.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}\`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
