import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Building2, Plus, MapPin, IndianRupee, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import type { FranchiseDealer } from "@/types";
import { TerritoryAudit } from "@/components/admin/TerritoryAudit";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Franchise Network | Admin Command Centre",
  description: "Manage TEAM CCTV franchise dealers, their territories, pricing overrides, and commission tracking.",
};

export default async function FranchisesAdminPage() {
  await requireAdmin();

  let franchises: (FranchiseDealer & { id: string })[] = [];
  let fetchError = false;

  try {
    const snap = await adminDb
      .collection("franchise_dealers")
      .orderBy("created_at", "desc")
      .get();

    franchises = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() ?? data.created_at ?? null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() ?? data.updated_at ?? null,
      };
    }) as any[];
  } catch {
    try {
      const snap = await adminDb.collection("franchise_dealers").get();
      franchises = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          created_at: data.created_at?.toDate?.()?.toISOString() ?? data.created_at ?? null,
          updated_at: data.updated_at?.toDate?.()?.toISOString() ?? data.updated_at ?? null,
        };
      }) as any[];
    } catch (err) {
      console.error("[FranchisesPage] Fetch failed:", err);
      fetchError = true;
    }
  }

  const activeFranchises = franchises.filter((f) => f.is_active);
  const totalBusiness = franchises.reduce((s, f) => s + (f.total_ex_tax_business || 0), 0);
  const totalCommissionDue = franchises.reduce((s, f) => s + (f.total_commission_due || 0), 0);

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -z-10" />
        <PageHeader
          icon={Building2}
          title="Territory Hub"
          description="Global administration of TEAM CCTV franchise partners, territory boundaries, and financial clearinghouse."
          badge={`${activeFranchises.length} Market Exclusivities`}
        />
      </div>

      {/* Geo-Intelligence Matrix (Audit) */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <TerritoryAudit />
      </div>

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Nodes", value: String(franchises.length), icon: Building2, color: "text-zinc-950 dark:text-white", bg: "bg-zinc-50 dark:bg-zinc-800/40" },
          { label: "Market Reach", value: String(activeFranchises.length), icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-500/5" },
          { label: "Gross Yield", value: `₹${(totalBusiness / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-500/5" },
          { label: "Clearing Due", value: `₹${totalCommissionDue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-500/5" },
        ].map((kpi) => (
          <div key={kpi.label} className={`relative overflow-hidden group ${kpi.bg} border border-zinc-100 dark:border-zinc-800/60 rounded-[32px] p-8 shadow-xl shadow-zinc-200/40 dark:shadow-none`}>
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <kpi.icon className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">{kpi.label}</p>
            <p className={`text-3xl font-black ${kpi.color} tracking-tight`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Management Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 rounded-[32px] p-6 shadow-2xl shadow-zinc-200/50 dark:shadow-none">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 flex items-center justify-center border border-zinc-100 dark:border-zinc-800/60">
              <Building2 className="w-6 h-6 text-zinc-400" />
           </div>
           <div>
             <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Network Management</p>
             <p className="text-sm font-black text-zinc-900 dark:text-white uppercase">
               {franchises.length === 0 ? "Fleet Initializing..." : `${franchises.length} Registered Partners`}
             </p>
           </div>
        </div>
        <Link
          href="/admin/franchises/new"
          className="flex items-center justify-center gap-3 px-8 py-4 bg-zinc-950 dark:bg-blue-600 hover:scale-105 active:scale-95 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Initialize New Franchise
        </Link>
      </div>

      {fetchError && (
        <div className="rounded-[40px] border border-rose-100 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-900/10 p-12 text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4 opacity-50" />
          <p className="text-rose-600 font-black text-sm uppercase tracking-widest">Protocol Failure: Data Unreachable</p>
          <p className="text-zinc-500 text-xs font-bold mt-2 uppercase tracking-tight">Verify Firestore connectivity and security schema.</p>
        </div>
      )}

      {/* Franchise Grid */}
      {!fetchError && franchises.length === 0 && (
        <div className="text-center py-32 border-4 border-dashed border-zinc-50 dark:border-zinc-800/40 rounded-[64px]">
          <Building2 className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-6" />
          <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-2">Network Expansion Ready</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.2em] mb-10 max-w-sm mx-auto leading-relaxed">
            Begin the territorial onboarding process to start routing leads and tracking regional performance.
          </p>
          <Link
            href="/admin/franchises/new"
            className="inline-flex items-center gap-3 px-10 py-5 bg-zinc-950 dark:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-3xl hover:scale-105 transition-all shadow-2xl"
          >
            <Plus className="w-4 h-4" /> Start Onboarding Workflow
          </Link>
        </div>
      )}

      {!fetchError && franchises.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {franchises.map((dealer) => (
            <div
              key={dealer.id}
              className={`group bg-white dark:bg-zinc-900/40 backdrop-blur-xl border rounded-[40px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-none hover:border-blue-500/30 ${dealer.is_active ? "border-zinc-100 dark:border-zinc-800" : "border-zinc-100 dark:border-zinc-800/40 opacity-40"}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-8 p-8 sm:p-10">
                {/* Node Identity */}
                <div className="flex items-center gap-5 flex-1 min-w-0">
                  <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 border-2 transition-colors ${dealer.is_active ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-500" : "bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 text-zinc-400"}`}>
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black text-zinc-950 dark:text-white tracking-tight uppercase leading-none mb-2 group-hover:text-blue-600 transition-colors">{dealer.company_name}</p>
                    <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{dealer.owner_name} · <span className="text-zinc-500">ID: {dealer.id.slice(-6)}</span></p>
                  </div>
                </div>

                {/* Territory Signature */}
                <div className="flex flex-col lg:items-end gap-2 shrink-0">
                   <div className="flex items-center gap-2 px-4 py-2 bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100/60 dark:border-blue-500/10 rounded-2xl">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest whitespace-nowrap">
                         {dealer.assigned_pincodes?.length || 0} Exclusive Zones
                      </span>
                   </div>
                   <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right px-2">
                      {dealer.assigned_cities?.join(", ") || "Unassigned Region"}
                   </p>
                </div>

                {/* Financial Ledger Preview */}
                <div className="grid grid-cols-3 gap-8 shrink-0 px-8 border-x border-zinc-50 dark:border-zinc-800/60">
                  <div className="text-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Throughput</p>
                    <p className="text-base font-black text-zinc-950 dark:text-white">{dealer.total_leads_received || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Yield</p>
                    <p className="text-base font-black text-blue-600 dark:text-blue-500">₹{((dealer.total_ex_tax_business || 0) / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">Due</p>
                    <p className="text-base font-black text-amber-600 dark:text-amber-500">₹{(dealer.total_commission_due || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/admin/franchises/${dealer.id}/pricing`}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Pricing
                  </Link>
                  <Link
                    href={`/admin/franchises/${dealer.id}`}
                    className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 border border-zinc-100 dark:border-zinc-700 transition-all shadow-inner"
                  >
                    <TrendingUp className="w-5 h-5" />
                  </Link>
                </div>
              </div>
              
              {/* Regional Node Map (Pincodes) */}
              {dealer.assigned_pincodes && dealer.assigned_pincodes.length > 0 && (
                <div className="px-10 pb-8 flex flex-wrap gap-2">
                  {dealer.assigned_pincodes.slice(0, 15).map((pin) => (
                    <span key={pin} className="text-[8px] font-black px-3 py-1 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-500 border border-zinc-100 dark:border-zinc-800/60 rounded-lg uppercase tracking-widest">
                      {pin}
                    </span>
                  ))}
                  {dealer.assigned_pincodes.length > 15 && (
                    <span className="text-[8px] font-black px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 rounded-lg uppercase tracking-widest">
                      +{dealer.assigned_pincodes.length - 15} Additional Nodes
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
