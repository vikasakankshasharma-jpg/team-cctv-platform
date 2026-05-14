import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { TrendingUp, ArrowLeft, MapPin, IndianRupee, Phone, Mail, Building2, Calendar } from "lucide-react";
import type { Metadata } from "next";
import type { FranchiseDealer } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Franchise Details | Admin" };

export default async function FranchiseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const dealerDoc = await adminDb.collection("franchise_dealers").doc(id).get();
  if (!dealerDoc.exists) return notFound();

  const dealer = { id: dealerDoc.id, ...dealerDoc.data() } as FranchiseDealer & { id: string };

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/franchises"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Network
        </Link>
        <div className="flex items-center gap-2">
           <Link
            href={`/admin/franchises/${dealer.id}/pricing`}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
          >
            <IndianRupee className="w-4 h-4" /> Pricing Override
          </Link>
        </div>
      </div>

      <PageHeader
        icon={Building2}
        title={dealer.company_name}
        description={`Franchise details and performance metrics for ${dealer.owner_name}.`}
        badge={dealer.is_active ? "Active" : "Inactive"}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Col - Info */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] p-6 space-y-6">
             <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Contact Info</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-white">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-zinc-500" />
                    </div>
                    {dealer.mobile_number}
                  </div>
                  {dealer.email && (
                    <div className="flex items-center gap-3 text-sm font-semibold text-zinc-900 dark:text-white">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-zinc-500" />
                      </div>
                      {dealer.email}
                    </div>
                  )}
                </div>
             </div>

             <hr className="border-zinc-100 dark:border-zinc-800" />

             <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Territory</p>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      {dealer.assigned_pincodes && dealer.assigned_pincodes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                           {dealer.assigned_pincodes.map(p => (
                             <span key={p} className="text-[10px] font-bold px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400">{p}</span>
                           ))}
                        </div>
                      )}
                      {dealer.assigned_cities && dealer.assigned_cities.length > 0 && (
                         <p className="text-sm font-semibold text-zinc-900 dark:text-white">{dealer.assigned_cities.join(", ")}</p>
                      )}
                      {dealer.assigned_states && dealer.assigned_states.length > 0 && (
                         <p className="text-xs text-zinc-500">{dealer.assigned_states.join(", ")}</p>
                      )}
                    </div>
                </div>
             </div>

             <hr className="border-zinc-100 dark:border-zinc-800" />

             <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Terms</p>
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Monthly Fee</span>
                      <span className="font-bold text-zinc-900 dark:text-white">₹{fmt(dealer.franchise_fee_monthly || 0)}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-500">Commission</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{dealer.commission_percent || 0}%</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col - Performance */}
        <div className="md:col-span-2 space-y-6">
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[20px] p-5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Total Leads</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white">{dealer.total_leads_received || 0}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[20px] p-5">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Leads Won</p>
                <p className="text-3xl font-black text-emerald-600">{dealer.total_leads_won || 0}</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[20px] p-5 col-span-2 sm:col-span-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Conversion Rate</p>
                <p className="text-3xl font-black text-blue-600">
                  {dealer.total_leads_received ? Math.round(((dealer.total_leads_won || 0) / dealer.total_leads_received) * 100) : 0}%
                </p>
              </div>
           </div>

           <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[24px] p-6">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white">Financial Ledger</h3>
                    <p className="text-xs text-zinc-500 font-medium">Business generated and commission tracking</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Ex-Tax Business</p>
                    <p className="text-2xl font-black text-zinc-900 dark:text-white">₹{fmt(dealer.total_ex_tax_business || 0)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Commission Due</p>
                    <p className="text-2xl font-black text-amber-600">₹{fmt(dealer.total_commission_due || 0)}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Commission Paid</p>
                    <p className="text-2xl font-black text-emerald-600">₹{fmt(dealer.total_commission_paid || 0)}</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
