import { verifySession } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Users, LayoutDashboard, CalendarCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Dashboard | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function SalespersonDashboard() {
  const session = await verifySession();
  
  // Get salesperson details to fetch stats
  let totalAssigned = 0;
  let wonLeads = 0;
  let newLeads = 0;
  
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
        .get();
        
      totalAssigned = leadsSnap.size;
      
      leadsSnap.docs.forEach(doc => {
        const status = doc.data().status;
        if (status === "won") wonLeads++;
        if (status === "new") newLeads++;
      });
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={LayoutDashboard}
        title="Welcome back"
        description="Here's what's happening with your assigned leads today."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Assigned</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{totalAssigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Won Deals</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{wonLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">New Leads</p>
              <p className="text-3xl font-black text-zinc-900 dark:text-white">{newLeads}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
