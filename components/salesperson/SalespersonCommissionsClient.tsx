"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, CheckCircle2, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";

const downloadCSV = (data: any[], filename: string) => {
  const headers = ['Date', 'Lead/Customer', 'Amount (INR)', 'Status', 'Type'];
  const rows = data.map(item => [
    new Date(item.created_at?.seconds ? item.created_at.seconds * 1000 : item.created_at).toLocaleDateString('en-IN'),
    item.lead_name || item.customer_name || 'N/A',
    item.commission_amount || item.amount || 0,
    item.status || 'pending',
    item.type || item.commission_type || 'standard'
  ]);
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

interface SalespersonCommissionsClientProps {
  records: any[];
  summary: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
  };
}

export function SalespersonCommissionsClient({ records, summary }: SalespersonCommissionsClientProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredRecords = records.filter(record => 
    record.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    record.lead_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => downloadCSV(records, `commissions_${new Date().toISOString().slice(0,7)}.csv`)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all">
          <Download className="w-4 h-4 shrink-0" /> {t("prt_dl_stmt", "Download Statement")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">{t("prt_kpi_earned", "Total Earned")}</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalEarned.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">{t("prt_kpi_pending", "Pending Payout")}</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalPending.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">{t("prt_kpi_paid", "Total Paid")}</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalPaid.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t("prt_payout_hist", "Payout History")}</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder={t("sls_comm_search_ph", "Search customer or lead ID...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-zinc-950 border-zinc-800 text-white w-full"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-950/50">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{t("prt_col_date", "Date")}</TableHead>
                <TableHead className="text-zinc-400">{t("prt_col_customer", "Customer")}</TableHead>
                <TableHead className="text-zinc-400">{t("sls_col_deal_size", "Deal Size")}</TableHead>
                <TableHead className="text-zinc-400">{t("sls_col_commission", "Commission")}</TableHead>
                <TableHead className="text-zinc-400 text-right">{t("prt_col_status", "Status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell colSpan={5} className="text-center py-4 md:py-8 text-zinc-500">
                    {t("sls_no_comm_found", "No commission records found.")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300">
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {record.customer_name || t("sls_unknown_cust", "Unknown Customer")}
                      <div className="text-xs text-zinc-500 mt-0.5 max-w-[120px] truncate" title={record.lead_id}>
                        {record.lead_id}
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-300">
                      ₹{record.ex_tax_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-emerald-400 font-medium">
                      +₹{record.commission_amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={record.status === "paid" ? "default" : "secondary"}
                        className={
                          record.status === "paid" 
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                            : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                        }
                      >
                        {record.status === "paid" ? t("prt_status_paid", "Paid") : t("prt_status_pending", "Pending")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
