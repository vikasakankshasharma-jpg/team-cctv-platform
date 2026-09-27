"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, IndianRupee, PieChart, Activity } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ProfitabilityData {
  summary: {
    totalDeals: number;
    totalRevenue: number;
    totalGrossProfit: number;
    averageMargin: number;
  };
  deals: {
    dealId: string;
    revenue: number;
    grossProfit: number;
    costs: {
      purchase: number;
      freight: number;
      installation: number;
    };
  }[];
}

export function ProfitabilityAnalyticsClient() {
  const [data, setData] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/profitability")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load profitability data");
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
  if (error || !data) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Gross Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{data.summary.totalGrossProfit.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1">Across {data.summary.totalDeals} active deals</p>
          </CardContent>
        </Card>

        <Card className="bg-black/5 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              ₹{data.summary.totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/5 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Blended Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {data.summary.averageMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Profitability Heatmap</CardTitle>
          <CardDescription>Live breakdown of costs and margins for every active deal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Deal ID</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">H/W Cost</TableHead>
                  <TableHead className="text-right">Labor Cost</TableHead>
                  <TableHead className="text-right">Gross Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.deals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No deals found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.deals.map((deal) => {
                    const margin = deal.revenue > 0 ? (deal.grossProfit / deal.revenue) * 100 : 0;
                    return (
                      <TableRow key={deal.dealId} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs">{deal.dealId.slice(0, 10).toUpperCase()}</TableCell>
                        <TableCell className="text-right font-medium">₹{deal.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-rose-500/80">₹{deal.costs.purchase.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-orange-500/80">₹{deal.costs.installation.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-black text-emerald-600">₹{deal.grossProfit.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={
                            margin >= 30 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                            margin >= 15 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                            "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }>
                            {margin.toFixed(1)}%
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
