"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Filter, Download } from "lucide-react";

export interface ReportFilterState {
  startDate: string;
  endDate: string;
  branchId?: string;
  salespersonId?: string;
  technicianId?: string;
}

interface ReportFiltersProps {
  initialFilters?: Partial<ReportFilterState>;
  onFilterChange: (filters: ReportFilterState) => void;
  onExport?: (filters: ReportFilterState) => void;
  showBranch?: boolean;
  showPersonnel?: boolean;
}

export function ReportFilters({ initialFilters, onFilterChange, onExport, showBranch, showPersonnel }: ReportFiltersProps) {
  // Safe Date Initialization (Timezone consistent YYYY-MM-DD)
  const getLocalDateString = (d: Date) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [filters, setFilters] = useState<ReportFilterState>({
    startDate: initialFilters?.startDate || getLocalDateString(firstDay),
    endDate: initialFilters?.endDate || getLocalDateString(today),
    branchId: initialFilters?.branchId || "",
    salespersonId: initialFilters?.salespersonId || "",
    technicianId: initialFilters?.technicianId || ""
  });

  // Sync state if URL changes externally
  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({ ...prev, ...initialFilters }));
    }
  }, [initialFilters]);

  const handleApply = () => {
    onFilterChange(filters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-wrap gap-4 items-end mb-6">
      
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Start Date</label>
        <div className="relative">
          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input 
            type="date"
            className="pl-8 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">End Date</label>
        <div className="relative">
          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input 
            type="date"
            className="pl-8 border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
          />
        </div>
      </div>

      {showBranch && (
         <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Branch</label>
            <select 
               className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
               value={filters.branchId}
               onChange={(e) => setFilters({...filters, branchId: e.target.value})}
            >
               <option value="">All Branches</option>
               <option value="MAIN">Main HQ</option>
            </select>
         </div>
      )}

      {showPersonnel && (
         <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Personnel</label>
            <select 
               className="border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
               value={filters.salespersonId || filters.technicianId}
               onChange={(e) => setFilters({...filters, salespersonId: e.target.value})}
            >
               <option value="">All Personnel</option>
            </select>
         </div>
      )}

      <div className="flex gap-2 ml-auto">
        <button 
          onClick={handleApply}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors shadow-sm"
        >
          <Filter className="h-4 w-4" />
          Apply Filters
        </button>
        
        {onExport && (
          <button 
            onClick={() => onExport(filters)}
            className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-800 px-4 py-2 border rounded-md text-sm transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        )}
      </div>
    </div>
  );
}
