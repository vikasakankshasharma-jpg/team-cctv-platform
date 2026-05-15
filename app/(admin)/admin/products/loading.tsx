import { Box } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";

export default function ProductsLoading() {
  return (
    <div className="space-y-10">
      <PageHeader
        icon={Box}
        title="Master Catalog"
        description="Curate the hardware ecosystem and manage real-time inventory specifications."
        badge="Indexing Catalog..."
      />
      
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="h-10 w-64 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
        <div className="h-10 w-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-start space-x-4 shadow-sm">
            <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse" />
              <div className="flex space-x-2 pt-2">
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
