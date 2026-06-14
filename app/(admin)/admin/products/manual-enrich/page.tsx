import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileEdit } from "lucide-react";
import type { Product } from "@/types";
import { ManualEnrichmentClient } from "@/components/admin/ManualEnrichmentClient";

export const dynamic = "force-dynamic";

export default async function ManualEnrichmentPage() {
  await requireAdmin();

  // Fetch all active products
  const snap = await adminDb
    .collection("products")
    .where("is_active", "==", true)
    .get();

  const products = snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as Product[];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={FileEdit}
        title="Manual Spec Editor"
        description="Fast, spreadsheet-like data entry to manually fill in missing hardware specifications."
        action={
          <a
            href="/admin/products"
            className="px-4 py-2 text-sm font-semibold border border-border rounded-xl bg-card hover:bg-secondary transition-colors text-foreground"
          >
            ← Back to Products
          </a>
        }
      />

      <ManualEnrichmentClient products={products} />
    </div>
  );
}
