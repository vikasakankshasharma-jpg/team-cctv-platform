import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Database } from "lucide-react";
import { BulkOperationsClient } from "./BulkOperationsClient";

export const dynamic = "force-dynamic";

export default async function BulkOperationsPage() {
  await requireAdmin();

  // Fetch all products for the export functionality
  const productsSnapshot = await adminDb.collection("products").get();
  
  const products = productsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      // Handle timestamp serialization
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as Product[];

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Database} 
        title="Data Management" 
        description="Export your product catalog to CSV, edit in bulk, and securely import changes back into the system."
      />

      <BulkOperationsClient products={products} />
    </div>
  );
}
