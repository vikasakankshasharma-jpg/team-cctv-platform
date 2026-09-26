
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, Users, Zap, Activity, ArrowRight, BarChart3, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Lead } from "@/types";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { LeadStatusBadge } from "@/components/shared/LeadStatusBadge";

export interface WeeklyBucket {
  label: string;
  total: number;
  won: number;
}

export interface SourceBreakdown {
  label: string;
  count: number;
  percent: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  customer_name: string;
  status: string;
  delivery_status?: string;
  install_status?: string;
  created_at: unknown;
  escalation_reason?: string;
}

export interface DashboardClientProps {
  trend: WeeklyBucket[];
  sources: SourceBreakdown[];
  initialRecentLeads: RecentActivity[];
  initialInternalLeads: RecentActivity[];
  internalLeadsCount: number;
  conversionRate: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 border border-zinc-200 rounded-xl shadow-xl">
        <p className="font-bold text-zinc-900 mb-1">{label}</p>
        <p className="text-blue-600 font-semibold text-sm">Total Leads: {payload[0].value}</p>
        <p className="text-emerald-600 font-semibold text-sm">Won Deals: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

function SalesTrendChart({ trend }: { trend: WeeklyBucket[] }) {
  const totalLeads = trend.reduce((s, b) => s + b.total, 0);
  const totalWon   = trend.reduce((s, b) => s + b.won, 0);

  return (
    <div className="h-full flex flex-col min-h-[300px]">
      <div className="flex-1 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11 }} />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#e4e4e7', strokeWidth: 2, strokeDasharray: '3 3' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#71717a', paddingTop: '10px' }} />
            <Area type="monotone" dataKey="total" name="Total Leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="won" name="Won Deals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardClient({ trend, sources, initialRecentLeads, initialInternalLeads, internalLeadsCount, conversionRate }: DashboardClientProps) {
  const [recentLeads, setRecentLeads] = useState<RecentActivity[]>(initialRecentLeads);
  const [internalLeads, setInternalLeads] = useState<RecentActivity[]>(initialInternalLeads);
  const [liveInternalCount, setLiveInternalCount] = useState(internalLeadsCount);

  useEffect(() => {
    // Recent Leads Listener
    const qRecent = query(collection(db, "leads"), orderBy("created_at", "desc"), limit(6));
    const unsubRecent = onSnapshot(qRecent, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const d = doc.data() as Lead;
        return {
          id: doc.id,
          customer_name: d.customer_name ?? "Unknown",
          status: d.status ?? "new",
          delivery_status: (d as any).delivery_status,
          install_status: (d as any).install_status,
          created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
        } as RecentActivity;
      });
      setRecentLeads(leads);
    });

    const qInternal = query(collection(db, "leads"), where("is_escalated", "==", true), limit(5));
    const unsubInternal = onSnapshot(qInternal, (snapshot) => {
      const leads = snapshot.docs.map(doc => {
        const d = doc.data() as Lead;
        return {
          id: doc.id,
          customer_name: d.customer_name ?? "Unknown",
          status: d.status ?? "new",
          created_at: (d.created_at as any)?.toDate?.()?.toISOString() ?? "",
        } as RecentActivity;
      });
      setInternalLeads(leads);
      if (snapshot.docs.length < 5) {
        setLiveInternalCount(snapshot.docs.length);
      }
    });

    return () => {
      unsubRecent();
      unsubInternal();
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Left Panel: Analytics */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-zinc-100 p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Sales Analytics
          </h2>
          <Link href="/admin/reports" className="text-xs font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
            View Full Report
          </Link>
        </div>
        <SalesTrendChart trend={trend} />
      </div>
      
      {/* Right Column: Actions & Feed */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        
        {/* Urgent Escalated Queue */}
        <div className={`flex flex-col bg-white rounded-3xl shadow-sm border ${liveInternalCount > 0 ? 'border-red-200' : 'border-zinc-100'} overflow-hidden`}>
          <div className={`flex items-center justify-between px-6 py-4 border-b ${liveInternalCount > 0 ? 'border-red-100 bg-red-50' : 'border-zinc-50 bg-zinc-50'}`}>
            <div className={`flex items-center gap-2 font-black tracking-tight ${liveInternalCount > 0 ? 'text-red-700' : 'text-zinc-500'}`}>
              {liveInternalCount > 0 ? <AlertTriangle className="w-5 h-5 animate-pulse text-red-500" /> : <Activity className="w-5 h-5 text-zinc-400" />}
              Urgent Action Required
            </div>
            {liveInternalCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm shadow-red-500/30">
                {liveInternalCount}
              </span>
            )}
          </div>
          
          <div className="p-4 flex flex-col gap-2">
            {internalLeads.length === 0 ? (
              <div className="py-6 text-center text-zinc-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold">No escalated issues. Great work!</p>
              </div>
            ) : (
              internalLeads.map(lead => (
                <Link key={lead.id} href="/admin/dispatch" className="flex items-center justify-between p-3 bg-white hover:bg-red-50 border border-red-100 rounded-2xl transition-colors group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-red-800">{lead.customer_name}</span>
                    <span className="text-xs font-semibold text-red-500/70">Unmapped Territory (Dispatch Required)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden flex-1">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-50 bg-zinc-50">
            <h3 className="font-black tracking-tight text-zinc-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              Live Activity
            </h3>
            <Link href="/admin/leads" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
              View All
            </Link>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {recentLeads.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-6">No recent activity</p>
            ) : (
              recentLeads.map((lead) => (
                <Link href="/admin/leads" key={lead.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 border border-transparent hover:border-zinc-100 rounded-2xl transition-colors">
                  <div className="flex flex-col max-w-[200px]">
                    <span className="text-sm font-bold text-zinc-900 truncate">{lead.customer_name}</span>
                    <span className="text-xs text-zinc-500 font-medium truncate">General Inquiry</span>
                  </div>
                  <div className="shrink-0">
                    <LeadStatusBadge lead={lead} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}


