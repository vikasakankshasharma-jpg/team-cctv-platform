import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { CardSkeleton } from "@/components/shared/Skeleton";

export default function FranchisesLoading() {
  return (
    <div className="space-y-10">
      <PageHeader
        icon={Building2}
        title="Territory Hub"
        description="Global administration of TEAM CCTV franchise partners, territory boundaries, and financial clearinghouse."
        badge="Synchronizing Nodes..."
      />
      
      <div className="grid grid-cols-1 gap-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
