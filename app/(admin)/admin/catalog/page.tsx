import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { IndianRupee, LayoutList } from "lucide-react";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  await requireAdmin();

  // 1. Fetch all products (including inactive)
  const productsSnapshot = await adminDb.collection("products").get();
  const products = productsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as Product[];

  // 2. Fetch Pricing Rules for preview resolution
  const rulesDoc = await adminDb.collection("settings").doc("margins").get();
  const pricingRules = rulesDoc.exists ? rulesDoc.data() : { GLOBAL_DEFAULT: 20, CATEGORY: {}, BRAND: {}, ITEM: {} };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutList className="w-6 h-6" /> Catalog Management
          </h1>
          <p className="text-sm text-gray-500">Manage base costs, apply product overrides, and configure eligibility.</p>
        </div>
      </div>

      <CatalogManager 
        initialProducts={products} 
        pricingRules={pricingRules}
      />
    </div>
  );
}
