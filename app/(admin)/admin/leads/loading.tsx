import { Users } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { TableSkeleton } from "@/components/shared/Skeleton";

export default function LeadsLoading() {
  return (
    <div className="space-y-10">
      <PageHeader
        icon={Users}
        title="Lead Intelligence"
        description="Comprehensive analysis and management of your multi-channel lead pipeline."
        badge="Hydrating Pipeline..."
      />
      
      <TableSkeleton rows={8} />
    </div>
  );
}
