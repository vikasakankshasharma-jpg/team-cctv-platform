import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Users, LayoutDashboard, CalendarCheck, Clock, ArrowUpRight, Phone, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import type { Lead } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sales Dashboard | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function SalespersonDashboard() {
  const session = await verifySession();
  
  let totalAssigned = 0;
  let wonLeads = 0;
  let newLeads = 0;
  let activeLeads: Lead[] = [];
  
  if (session.user) {
    const spSnap = await adminDb.collection("salespeople")
      .where("firebase_uid", "==", session.user.uid)
      .limit(1)
      .get();
      
    if (!spSnap.empty) {
      const spId = spSnap.docs[0].id;
      
      // Get leads assigned to this salesperson
      const leadsSnap = await adminDb.collection("leads")
        .where("assigned_to_salesperson_id", "==", spId)
        .orderBy("created_at", "desc")
        .get();
        
      totalAssigned = leadsSnap.size;
      
      const allLeads = leadsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: (doc.data().created_at as any)?.toDate?.() ?? new Date(doc.data().created_at)
      } as Lead));

      allLeads.forEach(lead => {
        if (lead.status === "won") wonLeads++;
        if (lead.status === "new") newLeads++;
      });

      // Show top 5 leads needing attention (not won or lost)
      activeLeads = allLeads.filter(l => l.status !== "won" && l.status !== "lost").slice(0, 5);
    }
  }

  const conversionRate = totalAssigned > 0 ? Math.round((wonLeads / totalAssigned) * 100) : 0;

  const KPIS = [
    { label: "Total Assigned", value: totalAssigned, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Won Deals", value: wonLeads, icon: CalendarCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Conversion Rate", value: `${conversionRate}%`, icon: ArrowUpRight, color: conversionRate > 20 ? "text-emerald-500" : "text-amber-500", bg: conversionRate > 20 ? "bg-emerald-500/10" : "bg-amber-500/10" },
  ];


  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={LayoutDashboard}
        title="Command Centre"
        description="Monitor your active pipeline and conversion performance."
      />
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KPIS.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{kpi.label}</span>
              <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter relative z-10">{kpi.value}</div>
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 dark:from-zinc-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Active Pipeline Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase tracking-widest flex items-center gap-2">
             <ArrowUpRight className="w-5 h-5 text-blue-500" /> Active Pipeline
          </h3>
          <Link href="/salesperson/leads" className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest hover:underline">
            View All Leads
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activeLeads.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-[32px] py-20 text-center">
              <p className="text-zinc-500 font-bold italic">No active leads requiring immediate attention.</p>
            </div>
          ) : (
            activeLeads.map((lead) => (
              <div key={lead.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-[20px] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">{lead.customer_name}</h4>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                        lead.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                        lead.status === 'site_visit' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}>
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDistanceToNow(lead.created_at as Date)} ago</span>
                       <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                       <span>{lead.property_type || 'Residential'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a href={`tel:${lead.mobile_number}`} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white font-black text-[10px] uppercase tracking-widest border border-zinc-100 dark:border-zinc-800 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20 transition-all">
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                  <a href={`https://wa.me/${lead.mobile_number}`} target="_blank" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all">
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                  <Link href={`/salesperson/leads/${lead.id}`} className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-700 flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-xl">
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
