"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { format, isPast, isToday } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, Users, TrendingUp, CheckCircle2 } from "lucide-react";

type LeadListRow = {
  id: string;
  customer_name: string;
  customer_mobile: string;
  source: string;
  total_payable: number;
  leadStatus: string;
  createdAt: string;
  
  // Phase 6
  intentScore?: string;
  probabilityPercent: number;
  expectedValue: number;
  nextActionDate?: string;
  nextActionType?: string;
};

export default function SalesDashboard() {
  const [leads, setLeads] = useState<LeadListRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/crm/quotes?limit=100");
      const data = await res.json();
      if (data.success) {
        setLeads(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading Sales Engine...</div>;

  const todayActions = leads.filter(l => l.nextActionDate && isToday(new Date(l.nextActionDate)));
  const overdueActions = leads.filter(l => l.nextActionDate && isPast(new Date(l.nextActionDate)) && !isToday(new Date(l.nextActionDate)) && l.leadStatus !== "WON" && l.leadStatus !== "LOST");
  const newLeads = leads.filter(l => l.leadStatus === "NEW" || !l.leadStatus);
  const wonLeads = leads.filter(l => l.leadStatus === "WON");
  const activeLeads = leads.filter(l => l.leadStatus !== "LOST" && l.leadStatus !== "WON");

  const totalRawPipeline = activeLeads.reduce((acc, lead) => acc + (lead.expectedValue || 0), 0);
  const totalWeightedPipeline = activeLeads.reduce((acc, lead) => acc + ((lead.expectedValue || 0) * (lead.probabilityPercent || 0) / 100), 0);
  const totalWonValue = wonLeads.reduce((acc, lead) => acc + (lead.expectedValue || 0), 0);
  
  const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0;
  const avgDealSize = wonLeads.length > 0 ? totalWonValue / wonLeads.length : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Engine 2.0</h1>
        <p className="text-muted-foreground mt-1">Lead intelligence, pipeline metrics, and action center.</p>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">Weighted Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₹{totalWeightedPipeline.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-blue-600 mt-1">From ₹{totalRawPipeline.toLocaleString("en-IN")} raw value</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">Total Won Value</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹{totalWonValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-green-600 mt-1">{wonLeads.length} deals closed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Avg Size: ₹{avgDealSize.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Leads</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{newLeads.length} waiting for contact</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Action Center</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overdueActions.length === 0 && todayActions.length === 0 && newLeads.length === 0 && (
                <p className="text-sm text-muted-foreground italic">You're all caught up!</p>
              )}
              
              {newLeads.slice(0, 3).map(lead => (
                <div key={lead.id} className="flex justify-between items-center p-3 border rounded-md bg-blue-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">New</Badge>
                      <span className="font-medium">{lead.customer_name}</span>
                      {lead.intentScore === "Hot" && <span className="text-xs">🔥</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">₹{lead.expectedValue?.toLocaleString("en-IN")}</p>
                  </div>
                  <Link href={`/admin/leads/${lead.id}`}>
                    <Button size="sm" variant="outline">View</Button>
                  </Link>
                </div>
              ))}

              {overdueActions.slice(0, 4).map(lead => (
                <div key={lead.id} className="flex justify-between items-center p-3 border border-red-200 rounded-md bg-red-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Overdue {lead.nextActionType}</Badge>
                      <span className="font-medium text-red-900">{lead.customer_name}</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">₹{lead.expectedValue?.toLocaleString("en-IN")} • {lead.probabilityPercent}% win chance</p>
                  </div>
                  <Link href={`/admin/leads/${lead.id}`}>
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300">Action</Button>
                  </Link>
                </div>
              ))}
              
              {todayActions.map(lead => (
                <div key={lead.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">Today's {lead.nextActionType}</Badge>
                      <span className="font-medium">{lead.customer_name}</span>
                    </div>
                  </div>
                  <Link href={`/admin/leads/${lead.id}`}>
                    <Button size="sm" variant="outline">Action</Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Wins (Deals Generated)</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {wonLeads.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No deals won yet. Get out there!</p>
               )}
               {wonLeads.slice(0, 8).map(lead => (
                  <div key={lead.id} className="flex justify-between items-center p-3 border border-green-500/20 rounded-md bg-green-500/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-500">Won</Badge>
                        <span className="font-medium">{lead.customer_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Closed successfully</p>
                    </div>
                    <div className="text-right">
                       <span className="font-bold text-green-600">₹{lead.expectedValue?.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
