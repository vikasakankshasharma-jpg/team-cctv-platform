import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { getBaselineCatalogData } from "@/lib/baseline-quote";
import type { Product } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { CatalogSubNav } from "@/components/admin/navigation/AdminSubNav";
import { Database } from "lucide-react";
import { BulkOperationsClient } from "./BulkOperationsClient";

export const dynamic = "force-dynamic";

export default async function BulkOperationsPage() {
  await requireAdmin();

  let products: Product[] = [];
  try {
    const productsSnapshot = await adminDb.collection("products").get();
    products = productsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
        updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
      };
    }) as Product[];
  } catch (err) {
    console.warn("⚠️ Failed to load products in BulkOperationsPage, using baseline catalog:", err);
    const catalog = await getBaselineCatalogData();
    products = catalog.products || [];
  }

  if (products.length === 0) {
    const catalog = await getBaselineCatalogData();
    products = catalog.products || [];
  }

  return (
    <div className="space-y-6">
      <CatalogSubNav />
      <PageHeader 
        icon={Database} 
        title="Data Management" 
        description="Export your product catalog to CSV, edit in bulk, and securely import changes back into the system."
      />

      <BulkOperationsClient products={products} />
    </div>
  );
}
