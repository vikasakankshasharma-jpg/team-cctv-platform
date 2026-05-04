import { CompatibilityMatrix } from "@/components/admin/CompatibilityMatrix";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compatibility Matrix | TEAM CCTV Admin",
  description: "Visual map of product compatibility — which cameras work with which recorders and accessories.",
};

export const dynamic = "force-dynamic";

export default async function CompatibilityPage() {
  let products: Product[] = [];
  
  try {
    const snapshot = await adminDb.collection("products").where("is_deleted", "==", false).get();
    products = snapshot.docs.map(doc => {
      const data = doc.data() as Product;
      return {
        ...data,
        id: doc.id,
        updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
        created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
      };
    });
  } catch (error) {
    console.error("Compatibility Matrix: Failed to fetch products", error);
  }

  // Sort products to ensure consistent rendering
  products.sort((a, b) => a.category.localeCompare(b.category) || a.display_name.localeCompare(b.display_name));

  return (
    <div className="p-8 max-w-screen-2xl mx-auto">
      <CompatibilityMatrix initialProducts={products} />
    </div>
  );
}
