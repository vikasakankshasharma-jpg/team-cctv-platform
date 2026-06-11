import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Sparkles } from "lucide-react";
import { ProductEnrichmentClient } from "@/components/admin/ProductEnrichmentClient";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProductEnrichPage() {
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
        icon={Sparkles}
        title="AI Spec Enrichment"
        badge="AI-Powered"
        description="Automatically fill missing camera and recorder specifications using Gemini AI. Review every proposed change before saving."
        action={
          <a
            href="/admin/products"
            className="px-4 py-2 text-sm font-semibold border border-border rounded-xl bg-card hover:bg-secondary transition-colors text-foreground"
          >
            ← Back to Products
          </a>
        }
      />

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { step: "1", label: "Select", desc: "Choose cameras or recorders to analyze" },
          { step: "2", label: "Analyze", desc: "Gemini AI reads all product names" },
          { step: "3", label: "Review", desc: "See proposed changes with confidence score" },
          { step: "4", label: "Apply", desc: "Approve & save selected updates" },
        ].map(item => (
          <div key={item.step} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shrink-0">
              {item.step}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <ProductEnrichmentClient products={products} />
    </div>
  );
}
