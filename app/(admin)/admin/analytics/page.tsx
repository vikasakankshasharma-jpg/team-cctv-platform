"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [rejections, setRejections] = useState<any>(null);
  const [products, setProducts] = useState<any>(null);
  const [funnel, setFunnel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ovRes, rejRes, prodRes, funRes] = await Promise.all([
          fetch("/api/analytics/overview?range=30").then(r => r.json()),
          fetch("/api/analytics/rejections").then(r => r.json()),
          fetch("/api/analytics/products").then(r => r.json()),
          fetch("/api/analytics/funnel").then(r => r.json()),
        ]);
        
        setOverview(ovRes.data);
        setRejections(rejRes.data);
        setProducts(prodRes.data);
        setFunnel(funRes.data);
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center">Loading Analytics...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quotation Intelligence Dashboard</h1>
        <Badge variant="outline" className="text-sm">Last 30 Days</Badge>
      </div>

      {/* 1. Executive Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quotes Generated</CardDescription>
            <CardTitle className="text-4xl">{overview?.totalQuotes || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pipeline Value</CardDescription>
            <CardTitle className="text-4xl text-green-600">₹{(overview?.totalPipelineValue || 0).toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Quote Value</CardDescription>
            <CardTitle className="text-4xl">₹{(overview?.avgQuoteValue || 0).toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Funnel Tracking (NEW) */}
      <Card>
        <CardHeader>
          <CardTitle>Wizard Funnel Analysis</CardTitle>
          <CardDescription>Track user drop-offs across the Smart Wizard steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-3xl font-bold">{funnel?.totalStarted || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">Started</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl relative">
              <div className="text-3xl font-bold">{funnel?.propertySelected || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">Property</div>
              <div className="absolute -top-2 -right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">-{funnel?.drops?.property || 0}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl relative">
              <div className="text-3xl font-bold">{funnel?.cameraCount || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">Camera Count</div>
              <div className="absolute -top-2 -right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">-{funnel?.drops?.cameraCount || 0}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl relative">
              <div className="text-3xl font-bold">{funnel?.recording || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">Recording</div>
              <div className="absolute -top-2 -right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">-{funnel?.drops?.recording || 0}%</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl relative">
              <div className="text-3xl font-bold">{funnel?.quoteGenerated || 0}</div>
              <div className="text-xs text-slate-500 uppercase mt-1">Generated</div>
              <div className="absolute -top-2 -right-2 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">-{funnel?.drops?.generation || 0}%</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{funnel?.completionRate || 0}%</div>
              <div className="text-xs text-blue-800 uppercase mt-1">Completion</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Conversion & Rejection Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Validation Rejections</CardTitle>
            <CardDescription>Top reasons why custom configurations were rejected</CardDescription>
          </CardHeader>
          <CardContent>
            {rejections?.breakdown && Object.keys(rejections.breakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(rejections.breakdown).map(([reason, count]: any) => (
                  <div key={reason} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">{reason}</span>
                    <Badge variant="destructive">{count} incidents</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 text-center py-4">No rejections recorded yet.</div>
            )}
            
            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-bold text-slate-500 mb-3">RECENT LOGS</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {rejections?.logs?.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="text-xs p-2 bg-slate-100 rounded text-slate-600">
                    <span className="font-semibold text-slate-800">{new Date(log.timestamp).toLocaleTimeString()}</span>: {log.message}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Product Intelligence */}
        <Card>
          <CardHeader>
            <CardTitle>Product Intelligence</CardTitle>
            <CardDescription>Based on quotes generated in this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <h4 className="font-semibold text-sm text-slate-500">Accessory Attachment Rate</h4>
                <span className="text-2xl font-bold text-blue-600">{products?.attachmentRate || 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${products?.attachmentRate || 0}%` }}></div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Percentage of quotes that included cables or connectors.</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-slate-500 mb-3">Most Recommended Products (By Qty)</h4>
              <div className="space-y-2">
                {products?.mostRecommended?.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="truncate pr-4">{p.name}</span>
                    <Badge variant="secondary">{p.count} units</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-slate-500 mb-3">Highest Grossing Products (By Value)</h4>
              <div className="space-y-2">
                {products?.highestGrossing?.slice(0, 3).map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="truncate pr-4">{p.name}</span>
                    <span className="font-medium">₹{p.totalRevenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
