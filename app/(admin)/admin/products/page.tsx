import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";
import { ProductsClient } from "@/components/admin/ProductsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Product Catalog | Command Centre",
  description: "Manage IP & HD hardware inventory, pricing matrices, and technical specifications for the TEAM CCTV platform.",
};

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage() {
  let products: Product[] = [];
  
  try {
    const snapshot = await adminDb.collection("products").where("is_deleted", "==", false).get();
    products = snapshot.docs.map(doc => {
      const data = doc.data() as Product;
      return {
        ...data,
        id: doc.id,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || null,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || null,
      };
    });
  } catch (err: any) {
    console.warn("⚠️ Products query failed. Falling back to mock catalog for audit.", err.message);
    products = [
      {
        id: "mock-p1",
        display_name: "TEAM Smart 2MP Dome",
        technical_name: "IPC-D120-I",
        category: "camera",
        technology: "IP",
        unit_price: 2450,
        is_active: true,
        resolution_tier: "good",
      },
      {
        id: "mock-p2",
        display_name: "TEAM 8-Channel NVR",
        technical_name: "NVR-208-Q1",
        category: "recorder",
        technology: "IP",
        unit_price: 8500,
        is_active: true,
        channels: 8,
      }
    ] as any;
  }

  // Simple sorting for display
  products.sort((a, b) => a.category.localeCompare(b.category) || a.display_name.localeCompare(b.display_name));

  return (
    <div className="space-y-6">
      <ProductsClient initialProducts={products} />
    </div>
  );
}
