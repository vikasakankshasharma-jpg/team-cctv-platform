import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { HeartPulse, AlertCircle, CheckCircle2, ShieldAlert, Package, Database, Sparkles, ChevronRight } from "lucide-react";
import { CatalogRepairButton } from "@/components/admin/CatalogRepairButton";
import Link from "next/link";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function CatalogHealthPage() {
  await requireAdmin();

  const productsSnap = await adminDb.collection("products").where("is_deleted", "==", false).get();
  const products = productsSnap.docs.map(doc => {
    const data = doc.data() as any;
    if (!Array.isArray(data.technologies)) {
      data.technologies = data.technology ? [data.technology] : ["Common"];
    }
    return { id: doc.id, ...data } as Product;
  });

  // Diagnostic Categories
  const issues = {
    missing_catalog_path: products.filter(p => !p.catalog_path),
    missing_cost: products.filter(p => !p.base_cost || p.base_cost <= 0),
    missing_margin: products.filter(p => !p.margin_percentage || p.margin_percentage <= 0),
    zero_unit_price: products.filter(p => !p.unit_price || p.unit_price <= 0),
    missing_mp: products.filter(p => p.category === "cctv_camera" && !p.resolution_mp),
    missing_compatibility: products.filter(p => (p.category === "recorder" || p.category === "accessories") && (!p.compatible_paths || p.compatible_paths.length === 0)),
    uncategorized: products.filter(p => p.category === "unidentified" || !p.category),
    missing_specifications: products.filter(p => !p.technologies || p.technologies.length === 0 || (p.technologies.length === 1 && p.technologies[0] === 'Common')),
    missing_image: products.filter(p => !p.image_url),
  };

  const attributeMap: Record<string, string> = {
    missing_catalog_path: "catalog_path",
    missing_cost: "base_cost",
    missing_margin: "margin_percentage",
    zero_unit_price: "unit_price",
    missing_mp: "resolution_mp",
    missing_compatibility: "compatible_paths",
    uncategorized: "category",
    missing_specifications: "technologies",
    missing_image: "image_url"
  };

  const totalIssues = Object.values(issues).reduce((acc, list) => acc + list.length, 0);
  const healthScore = Math.max(0, 100 - (totalIssues / (products.length || 1) * 20));

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        icon={HeartPulse} 
        title="Catalog Health Audit" 
        description="System-wide diagnostic check for inventory data integrity and pricing logic readiness."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <div className="lg:col-span-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 relative overflow-hidden shadow-md">
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-32 h-32 bg-blue-500/20 blur-[40px] rounded-full" />
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Overall Data Integrity</p>
           <div className="text-6xl font-black text-white tracking-tighter mb-4">{Math.round(healthScore)}%</div>
           <div className="flex items-center gap-2">
             <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${healthScore > 80 ? 'bg-emerald-500' : healthScore > 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${healthScore}%` }} />
             </div>
           </div>
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-4">
             {totalIssues} Critical inconsistencies detected
           </p>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Auto-Repair Paths</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Assign missing catalog paths</p>
              </div>
            </div>
            <CatalogRepairButton />
          </div>


          <Link href="/admin/products" className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Bulk Editor</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fix pricing in bulk</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </Link>

          <Link href="/admin/spec-optimizer" className="bg-white dark:bg-zinc-900 p-6 rounded-[28px] border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">Spec Optimizer</h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">AI Retroactive Fix</p>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>

      {/* Diagnostics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(issues).map(([key, list]) => (
          <div key={key} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-lg">
            <div className="p-6 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${list.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                  {list.length > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                  {key.replace(/_/g, ' ')}
                </h3>
              </div>
              <span className="text-[10px] font-black text-zinc-400">{list.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] p-4 space-y-2 custom-scrollbar">
              {list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Perfect Health</p>
                </div>
              ) : (
                list.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 group hover:border-amber-500/30 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[11px] font-black text-zinc-900 dark:text-white truncate">{p.display_name}</p>
                      </div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">{p.technical_name}</p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-red-500/10 text-red-500 text-[8.5px] font-bold uppercase tracking-wider">
                          Missing: {attributeMap[key] || "unknown_attribute"}
                        </span>
                      </div>
                    </div>
                    <Link href={`/admin/products?edit=${p.id}`} className="shrink-0 p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <ShieldAlert className="w-3 h-3 text-blue-500" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
