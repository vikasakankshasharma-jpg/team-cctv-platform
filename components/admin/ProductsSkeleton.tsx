import { Package } from "lucide-react";
import { Skeleton, TableSkeleton } from "@/components/shared/Skeleton";

export function ProductsSkeleton() {
  return (
    <div className="space-y-12">
      {/* Skeleton Stats Bar */}
      <div className="flex flex-wrap gap-4 px-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-40 rounded-2xl" />
        ))}
      </div>
      
      {/* Skeleton Filter Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm space-y-8">
        <div className="flex items-center gap-4">
           <Skeleton className="w-12 h-12 rounded-[22px]" />
           <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
           {[...Array(5)].map((_, i) => (
             <Skeleton key={i} className="h-12 w-full rounded-2xl" />
           ))}
        </div>
      </div>

      {/* Skeleton Table */}
      <TableSkeleton rows={10} />
    </div>
  );
}
