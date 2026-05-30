"use client";

import { useState } from "react";
import { CheckCircle2, Clock, XCircle, ArrowRight, Wallet, Download, Search, AlertCircle, Loader2 } from "lucide-react";
import type { PayoutRequest } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PayoutsClientProps {
  initialRequests: PayoutRequest[];
}

export function PayoutsClient({ initialRequests }: PayoutsClientProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const filteredRequests = requests.filter(req => {
    const searchStr = (req.user_name || "").toLowerCase();
    const matchesSearch = searchStr.includes(filter.toLowerCase());
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (payoutId: string) => {
    const utr = prompt("Enter Bank UTR / Transaction ID (optional):");
    if (utr === null) return; // User cancelled
    
    setProcessingId(payoutId);
    try {
      const res = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, utrNumber: utr }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to mark payout as paid");
      }

      toast.success("Payout marked as paid offline!");
      
      // Optimistic update
      setRequests(prev => prev.map(p => p.id === payoutId ? { ...p, status: "success", utr_number: utr } : p));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing</Badge>;
      case "success":
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
      case "failed":
        return <Badge variant="destructive" className="shadow-none"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              type="text"
              placeholder="Search user name..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 h-10 w-full bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium min-w-[140px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden rounded-[28px]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-800/50">
              <TableRow className="border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">User</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">Amount</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">TDS</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">Net Payable</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">Date</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12">Status</TableHead>
                <TableHead className="font-bold text-xs tracking-wider text-zinc-500 uppercase h-12 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      <Wallet className="w-8 h-8 mb-4 text-zinc-300" />
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">No payout requests found</p>
                      <p className="text-xs mt-1">Adjust filters to see results.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 transition-colors">
                    <TableCell className="py-4">
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{req.user_name}</p>
                        <p className="text-xs font-medium text-zinc-500 capitalize mt-0.5">{req.user_type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        ₹{(req.gross_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">
                          {req.tds_percent || 0}%
                        </span>
                        <span className="text-sm font-semibold text-zinc-500">
                          -₹{(req.tds_amount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(req.net_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">
                        {req.created_at ? format(new Date(req.created_at as string), "dd MMM yyyy, p") : "-"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(req.status)}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      {req.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id!)}
                          disabled={processingId === req.id}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 shadow-sm font-semibold h-8"
                        >
                          {processingId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>Mark Paid <ArrowRight className="w-3 h-3 ml-1" /></>
                          )}
                        </Button>
                      )}
                      {req.status === "success" && req.utr_number && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                          UTR: {req.utr_number}
                        </span>
                      )}
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
