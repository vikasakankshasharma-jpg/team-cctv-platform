import { requireAdmin } from "@/lib/auth-server";
import { getBaselineCatalogData } from "@/lib/baseline-quote";
import { PageHeader } from "@/components/admin/PageHeader";
import { Grid3x3 } from "lucide-react";
import { MatricesClient } from "./MatricesClient";
import { PricingSubNav } from "@/components/admin/navigation/AdminSubNav";

export const dynamic = "force-dynamic";

export default async function MatricesPage() {
  await requireAdmin();

  // Load catalog and settings via in-memory cached provider with offline fallback
  const catalog = await getBaselineCatalogData();

  return (
    <div className="space-y-6">
      <PricingSubNav />
      <PageHeader 
        icon={Grid3x3} 
        title="Quotation Matrices" 
        description="Verify dynamic pricing output across camera counts and technology options."
      />

      <MatricesClient 
        products={catalog.products}
        settings={catalog.settings}
        addons={catalog.addons}
      />
    </div>
  );
}
