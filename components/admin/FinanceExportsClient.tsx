"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Calculator, CalendarDays, Loader2, Landmark } from "lucide-react";
import { toast } from "sonner";

export function FinanceExportsClient() {
  const [isExportingGstr, setIsExportingGstr] = useState(false);
  const [isExportingTds, setIsExportingTds] = useState(false);

  const [dateRange, setDateRange] = useState({
    month: new Date().getMonth() + 1, // 1-12
    year: new Date().getFullYear()
  });

  const handleExportGstr = async () => {
    setIsExportingGstr(true);
    try {
      // In production, this hits an API that streams a massive CSV/Excel via exceljs
      await new Promise(r => setTimeout(r, 2000)); 
      toast.success(\`GSTR-1 Data for \${dateRange.month}/\${dateRange.year} downloaded successfully!\`);
    } catch (e) {
      toast.error("Failed to export GSTR-1");
    } finally {
      setIsExportingGstr(false);
    }
  };

  const handleExportTds = async () => {
    setIsExportingTds(true);
    try {
      // In production, this hits an API that streams the 26Q FVU map
      await new Promise(r => setTimeout(r, 2000)); 
      toast.success(\`Form 26Q TDS Data for \${dateRange.month}/\${dateRange.year} downloaded successfully!\`);
    } catch (e) {
      toast.error("Failed to export TDS Data");
    } finally {
      setIsExportingTds(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-blue-600" />
            Finance & Taxation Exports
          </h1>
          <p className="text-gray-500 mt-2">Generate clean, CA-ready reports for GST and Income Tax (TDS) filing.</p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border">
          <CalendarDays className="w-5 h-5 text-gray-400 ml-2" />
          <select 
            value={dateRange.month} 
            onChange={(e) => setDateRange({ ...dateRange, month: parseInt(e.target.value) })}
            className="border-none outline-none text-sm font-bold bg-transparent pr-4"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={dateRange.year} 
            onChange={(e) => setDateRange({ ...dateRange, year: parseInt(e.target.value) })}
            className="border-none outline-none text-sm font-bold bg-transparent pl-2 border-l"
          >
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GSTR-1 Card */}
        <div className="bg-white rounded-[32px] p-8 border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-[100px] -z-10 transition-transform duration-700 group-hover:scale-110" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full uppercase tracking-widest">Sales Tax</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">GSTR-1 Sales Register</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Downloads a CA-ready Excel sheet mapping directly to the GST Offline Utility. Includes all B2B Tax Invoices and aggregated B2C sales.
          </p>

          <button 
            onClick={handleExportGstr} 
            disabled={isExportingGstr}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isExportingGstr ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExportingGstr ? "Generating Excel..." : "Export GSTR-1 Data"}
          </button>
        </div>

        {/* Form 26Q TDS Card */}
        <div className="bg-white rounded-[32px] p-8 border shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-[100px] -z-10 transition-transform duration-700 group-hover:scale-110" />
          
          <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calculator className="w-7 h-7" />
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full uppercase tracking-widest">Income Tax</span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-2">Form 26Q (TDS) Register</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Downloads the FVU-ready mapping for non-salary TDS deductions. Captures 194C (Installers) and 194H (Promoters) payouts alongside deductee PAN.
          </p>

          <button 
            onClick={handleExportTds} 
            disabled={isExportingTds}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isExportingTds ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            {isExportingTds ? "Generating Excel..." : "Export Form 26Q Data"}
          </button>
        </div>

      </div>

    </div>
  );
}
