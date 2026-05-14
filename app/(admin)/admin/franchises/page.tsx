import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Building2, Plus, MapPin, IndianRupee, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import type { Metadata } from "next";
import type { FranchiseDealer } from "@/types";
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

    franchises = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<FranchiseDealer, "id">),
    }));
  } catch {
    try {
      const snap = await adminDb.collection("franchise_dealers").get();
      franchises = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<FranchiseDealer, "id">),
      }));
    } catch (err) {
      console.error("[FranchisesPage] Fetch failed:", err);
      fetchError = true;
    }
  }

  const activeFranchises = franchises.filter((f) => f.is_active);
  const totalBusiness = franchises.reduce((s, f) => s + (f.total_ex_tax_business || 0), 0);
  const totalCommissionDue = franchises.reduce((s, f) => s + (f.total_commission_due || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        title="Franchise Network"
        description="Manage your TEAM CCTV franchise dealers. Each dealer gets exclusive territory (pincodes), admin-controlled pricing, and auto-routed leads."
        badge={`${activeFranchises.length} Active`}
      />

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Franchises",   value: String(franchises.length),                          color: "text-zinc-900 dark:text-white" },
          { label: "Active Territories", value: String(activeFranchises.length),                    color: "text-emerald-600" },
          { label: "Total Business",     value: `₹${(totalBusiness / 100000).toFixed(1)}L`,        color: "text-blue-600" },
          { label: "Commission Due",     value: `₹${totalCommissionDue.toLocaleString("en-IN")}`,  color: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[20px] p-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {franchises.length === 0
            ? "No franchise dealers yet. Create your first one to start routing leads."
            : `${franchises.length} dealer${franchises.length !== 1 ? "s" : ""} registered`}
        </p>
        <Link
          href="/admin/franchises/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Add Franchise Dealer
        </Link>
      </div>

      {fetchError && (
        <div className="rounded-[24px] border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-8 text-center">
          <p className="text-red-600 font-bold text-sm">Failed to load franchise data.</p>
          <p className="text-zinc-500 text-xs mt-1">Check Firestore indexes for <code>franchise_dealers</code>.</p>
        </div>
      )}

      {/* Franchise Dealer Cards */}
      {!fetchError && franchises.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[28px]">
          <Building2 className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">No Franchise Dealers</p>
          <p className="text-xs text-zinc-400 mt-2 mb-8 max-w-sm mx-auto">
            Franchise dealers receive auto-routed leads for their exclusive territory and execute installations under the TEAM CCTV brand.
          </p>
          <Link
            href="/admin/franchises/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 dark:hover:bg-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" /> Create First Franchise Dealer
          </Link>
        </div>
      )}

      {!fetchError && franchises.length > 0 && (
        <div className="space-y-3">
          {franchises.map((dealer) => (
            <div
              key={dealer.id}
              className={`bg-white dark:bg-zinc-900 border rounded-[24px] overflow-hidden transition-all ${dealer.is_active ? "border-zinc-100 dark:border-zinc-800" : "border-zinc-200 dark:border-zinc-800 opacity-60"}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                {/* Status dot + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dealer.is_active ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                  <div className="min-w-0">
                    <p className="font-black text-zinc-900 dark:text-white text-sm truncate">{dealer.company_name}</p>
                    <p className="text-xs text-zinc-400 font-medium">{dealer.owner_name} · {dealer.mobile_number}</p>
                  </div>
                </div>

                {/* Territory */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span className="font-medium">
                    {dealer.assigned_pincodes?.length
                      ? `${dealer.assigned_pincodes.length} pincodes`
                      : dealer.assigned_cities?.length
                      ? dealer.assigned_cities.join(", ")
                      : "No territory set"}
                  </span>
                </div>

                {/* Financials */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center hidden md:block">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Leads</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white">{dealer.total_leads_received || 0}</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Business</p>
                    <p className="text-sm font-black text-blue-600">₹{((dealer.total_ex_tax_business || 0) / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">Commission Due</p>
                    <p className="text-sm font-black text-amber-600">₹{(dealer.total_commission_due || 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/franchises/${dealer.id}/pricing`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                  >
                    <IndianRupee className="w-3 h-3" /> Pricing
                  </Link>
                  <Link
                    href={`/admin/franchises/${dealer.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                  >
                    <TrendingUp className="w-3 h-3" /> Details
                  </Link>
                </div>
              </div>

              {/* Territory pincodes preview */}
              {dealer.assigned_pincodes && dealer.assigned_pincodes.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                  {dealer.assigned_pincodes.slice(0, 8).map((pin) => (
                    <span key={pin} className="text-[9px] font-black px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full">
                      {pin}
                    </span>
                  ))}
                  {dealer.assigned_pincodes.length > 8 && (
                    <span className="text-[9px] font-black px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-full">
                      +{dealer.assigned_pincodes.length - 8} more
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
