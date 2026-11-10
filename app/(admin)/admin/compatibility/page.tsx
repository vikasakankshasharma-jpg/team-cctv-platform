import { requireAdmin } from "@/lib/auth-server";
import { CompatibilityMatrix } from "@/components/admin/CompatibilityMatrix";
import { PricingSubNav } from "@/components/admin/navigation/AdminSubNav";
import { adminDb } from "@/lib/firebase-admin";
import { getBaselineCatalogData } from "@/lib/baseline-quote";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compatibility Matrix | TEAM CCTV Admin",
  description: "Visual map of product compatibility — which cameras work with which recorders and accessories.",
};

export const dynamic = "force-dynamic";

export default async function CompatibilityPage() {
  await requireAdmin();

  let products: Product[] = [];
  
  try {
    const snapshot = await adminDb.collection("products").get();
    products = snapshot.docs
      .filter(doc => doc.data().is_deleted !== true)
      .map(doc => {
        const data = doc.data() as Product;
        return {
          ...data,
          id: doc.id,
          updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
          created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
        };
      });
  } catch (error) {
    console.warn("Compatibility Matrix: Failed to fetch products, using baseline catalog:", error);
    const catalog = await getBaselineCatalogData();
    products = catalog.products || [];
  }

  if (products.length === 0) {
    const catalog = await getBaselineCatalogData();
    products = catalog.products || [];
  }

  // Sort products to ensure consistent rendering
  products.sort((a, b) => (a.category || "").localeCompare(b.category || "") || (a.display_name || "").localeCompare(b.display_name || ""));

  return (
    <div className="space-y-6">
      <PricingSubNav />
      <CompatibilityMatrix initialProducts={products} />
    </div>
  );
}
