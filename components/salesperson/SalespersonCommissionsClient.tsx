"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Clock, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SalespersonCommissionsClientProps {
  records: any[];
  summary: {
    totalEarned: number;
    totalPending: number;
    totalPaid: number;
  };
}

export function SalespersonCommissionsClient({ records, summary }: SalespersonCommissionsClientProps) {
  const [search, setSearch] = useState("");

  const filteredRecords = records.filter(record => 
    record.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    record.lead_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Earned</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalEarned.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Pending Payout</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalPending.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-400">Total Paid</p>
              <h3 className="text-2xl font-bold text-white">₹{summary.totalPaid.toLocaleString('en-IN')}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Payout History</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input 
              placeholder="Search customer or lead ID..." 
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
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400">Customer</TableHead>
                <TableHead className="text-zinc-400">Deal Size</TableHead>
                <TableHead className="text-zinc-400">Commission</TableHead>
                <TableHead className="text-zinc-400 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    No commission records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-zinc-300">
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {record.customer_name}
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
                        {record.status === "paid" ? "Paid" : "Pending"}
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
