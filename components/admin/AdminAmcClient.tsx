"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, IndianRupee } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AdminAmcClient() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/amc-subscriptions")
      .then(res => res.json())
      .then(res => {
        if (res.success) setSubscriptions(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amountPaid || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> AMC Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1">Total revenue collected from AMC renewals</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Active Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {activeCount}
            </div>
            <p className="text-xs text-blue-600/70 mt-1">Currently active Annual Maintenance Contracts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AMC Subscriptions Ledger</CardTitle>
          <CardDescription>Track all customer AMC purchases and coverage dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No AMC subscriptions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  subscriptions.map((sub) => {
                    const isExpired = new Date(sub.endDate) < new Date();
                    return (
                      <TableRow key={sub.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs text-muted-foreground">{sub.customerId.slice(0,8)}...</TableCell>
                        <TableCell className="font-medium">{sub.planName}</TableCell>
                        <TableCell>{format(new Date(sub.startDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(sub.endDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right font-medium">₹{sub.amountPaid}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={isExpired ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                            {isExpired ? "EXPIRED" : "ACTIVE"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
