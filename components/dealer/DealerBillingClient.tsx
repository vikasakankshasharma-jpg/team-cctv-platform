"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { load } from "@cashfreepayments/cashfree-js";
import type { Cashfree } from "@cashfreepayments/cashfree-js";
import { 
  CreditCard, 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import type { FranchiseDealer } from "@/types";

interface Props {
  dealer: FranchiseDealer & { id: string };
}

export function DealerBillingClient({ dealer }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cashfree, setCashfree] = useState<Cashfree | null>(null);

  useEffect(() => {
    const initCashfree = async () => {
      try {
        const cf = await load({ mode: "sandbox" });
        setCashfree(cf);
      } catch (err) {
        console.error("Failed to load Cashfree SDK", err);
      }
    };
    initCashfree();
  }, []);

  const handleSubscribe = async () => {
    if (!cashfree) {
      toast.error("Payment system not ready.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/dealer/billing/subscription", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate subscription");

      await cashfree.subscriptionsCheckout({
        subsSessionId: data.subs_session_id,
        redirectTarget: "_self" as const,
      });
    } catch (err: any) {
      toast.error(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(n);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => router.push("/dealer/dashboard")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Billing Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Franchise Subscription</h1>
                  <p className="text-sm text-zinc-500 font-medium">Manage your monthly platform access fee.</p>
                </div>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Monthly Access Fee</span>
                  <span className="text-xl font-black text-zinc-900 dark:text-white">₹{fmt(dealer.franchise_fee_monthly)}<span className="text-xs text-zinc-400 font-bold">/mo</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    dealer.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {dealer.is_active ? "Active" : "Pending Activation"}
                  </span>
                </div>
              </div>

              {!dealer.is_active && (
                <button 
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Activate Franchise Network Access
                </button>
              )}

              {dealer.is_active && (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl p-6 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1">Subscription Active</h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400/70 font-medium">Your monthly billing is automated via Cashfree. You will be notified before each renewal.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Billing History
              </h3>
              <div className="space-y-4">
                 <div className="text-center py-8 text-zinc-400 italic text-sm font-medium">
                    No past transactions found.
                 </div>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-blue-600 rounded-2xl p-8 text-white shadow-md shadow-blue-500/20 relative overflow-hidden">
              <div className="relative z-10">
                <Building2 className="w-8 h-8 opacity-40 mb-4" />
                <h4 className="text-lg font-black mb-2">Partner Benefits</h4>
                <ul className="space-y-3">
                  {[
                    "Exclusive Territory Leads",
                    "Custom Pricing Margins",
                    "Lead Routing Priority",
                    "Dedicated Account Manager"
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs font-bold opacity-90">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-300" /> {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white rounded-full blur-2xl" />
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest mb-1">Billing Support</h4>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                    Have questions about your franchise fee or commission? Contact us at billing@teamcctv.in
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
