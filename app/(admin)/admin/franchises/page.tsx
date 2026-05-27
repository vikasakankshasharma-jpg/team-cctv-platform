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
          { label: "Active Nodes", value: String(franchises.length), icon: Building2, color: "text-foreground", bg: "bg-background" },
          { label: "Market Reach", value: String(activeFranchises.length), icon: CheckCircle2, color: "text-success", bg: "bg-success/5" },
          { label: "Gross Yield", value: `₹${(totalBusiness / 100000).toFixed(1)}L`, icon: IndianRupee, color: "text-primary", bg: "bg-primary/5" },
          { label: "Clearing Due", value: `₹${totalCommissionDue.toLocaleString("en-IN")}`, icon: TrendingUp, color: "text-warning", bg: "bg-warning/5" },
        ].map((kpi) => (
          <div key={kpi.label} className={`relative overflow-hidden group ${kpi.bg} border border-border rounded-2xl p-6 shadow-sm`}>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform">
               <kpi.icon className="w-20 h-20" />
            </div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</p>
            <p className={`text-2xl font-semibold ${kpi.color} tracking-tight`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Management Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
              <Building2 className="w-5 h-5 text-muted-foreground" />
           </div>
           <div>
             <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none mb-1">Network Management</p>
             <p className="text-sm font-semibold text-foreground tracking-tight">
               {franchises.length === 0 ? "Fleet Initializing..." : `${franchises.length} Registered Partners`}
             </p>
           </div>
        </div>
        <Link
          href="/admin/franchises/new"
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground text-xs font-semibold rounded-full transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" /> Initialize New Franchise
        </Link>
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-10 text-center">
          <XCircle className="w-10 h-10 text-destructive mx-auto mb-3 opacity-80" />
          <p className="text-destructive font-semibold text-sm">Protocol Failure: Data Unreachable</p>
          <p className="text-muted-foreground text-xs font-medium mt-1">Verify Firestore connectivity and security schema.</p>
        </div>
      )}

      {/* Franchise Grid */}
      {!fetchError && franchises.length === 0 && (
        <div className="text-center py-24 border-2 border-dashed border-border rounded-3xl bg-secondary/20">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">Network Expansion Ready</h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Begin the territorial onboarding process to start routing leads and tracking regional performance.
          </p>
          <Link
            href="/admin/franchises/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:bg-primary/90 transition-all shadow-sm"
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
              className={`group bg-card border border-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-sm hover:border-primary/30 ${!dealer.is_active && "opacity-60"}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 p-6 sm:p-8">
                {/* Node Identity */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${dealer.is_active ? "bg-success/10 border-success/20 text-success" : "bg-secondary border-border text-muted-foreground"}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground tracking-tight mb-0.5 group-hover:text-primary transition-colors truncate">{dealer.company_name}</p>
                    <p className="text-[11px] font-medium text-muted-foreground truncate">{dealer.owner_name} · <span className="opacity-70">ID: {dealer.id.slice(-6)}</span></p>
                  </div>
                </div>

                {/* Territory Signature */}
                <div className="flex flex-col lg:items-end gap-1.5 shrink-0">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wider whitespace-nowrap">
                         {dealer.assigned_pincodes?.length || 0} Exclusive Zones
                      </span>
                   </div>
                   <p className="text-[11px] font-medium text-muted-foreground text-right px-1">
                      {dealer.assigned_cities?.join(", ") || "Unassigned Region"}
                   </p>
                </div>

                {/* Financial Ledger Preview */}
                <div className="grid grid-cols-3 gap-6 shrink-0 px-6 border-x border-border">
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Throughput</p>
                    <p className="text-sm font-semibold text-foreground">{dealer.total_leads_received || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Yield</p>
                    <p className="text-sm font-semibold text-primary">₹{((dealer.total_ex_tax_business || 0) / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Due</p>
                    <p className="text-sm font-semibold text-warning">₹{(dealer.total_commission_due || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Control Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/franchises/${dealer.id}/pricing`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground text-[11px] font-semibold hover:bg-secondary/80 transition-all border border-border"
                  >
                    <IndianRupee className="w-3.5 h-3.5" /> Pricing
                  </Link>
                  <Link
                    href={`/admin/franchises/${dealer.id}`}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary text-muted-foreground hover:text-primary border border-border transition-all"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              {/* Regional Node Map (Pincodes) */}
              {dealer.assigned_pincodes && dealer.assigned_pincodes.length > 0 && (
                <div className="px-8 pb-6 flex flex-wrap gap-1.5 border-t border-border/50 pt-4 bg-secondary/10">
                  {dealer.assigned_pincodes.slice(0, 15).map((pin) => (
                    <span key={pin} className="text-[10px] font-medium px-2 py-0.5 bg-secondary text-muted-foreground border border-border rounded-md">
                      {pin}
                    </span>
                  ))}
                  {dealer.assigned_pincodes.length > 15 && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md">
                      +{dealer.assigned_pincodes.length - 15} more
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
