import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { getBaselineCatalogData } from "@/lib/baseline-quote";
import { notFound } from "next/navigation";
import { QuotationBuilderClient } from "@/components/admin/QuotationBuilderClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminQuoteBuilderPage({ params }: { params: Promise<{ leadId: string }> }) {
  const user = await requireAdmin();
  const { leadId } = await params;

  let leadData: any = null;
  try {
    const leadSnap = await adminDb.collection("leads").doc(leadId).get();
    if (leadSnap.exists) {
      leadData = leadSnap.data();
    }
  } catch (err) {
    console.warn("⚠️ Failed to load lead data:", err);
  }

  // Fetch catalog for easy selection
  let catalog: any[] = [];
  try {
    const productsSnap = await adminDb.collection("products")
      .where("is_active", "==", true)
      .get();

    catalog = productsSnap.docs
      .filter(doc => doc.data().is_deleted !== true)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.display_name,
          baseCost: data.base_cost || 0,
          unitPrice: data.unit_price || 0,
          category: data.category || "General",
        };
      });
  } catch (err) {
    console.warn("⚠️ Failed to load products in QuoteBuilder, using baseline catalog:", err);
    const baseline = await getBaselineCatalogData();
    catalog = (baseline.products || []).map(p => ({
      id: p.id,
      name: p.display_name,
      baseCost: p.base_cost || 0,
      unitPrice: p.unit_price || 0,
      category: p.category || "General",
    }));
  }

  if (catalog.length === 0) {
    const baseline = await getBaselineCatalogData();
    catalog = (baseline.products || []).map(p => ({
      id: p.id,
      name: p.display_name,
      baseCost: p.base_cost || 0,
      unitPrice: p.unit_price || 0,
      category: p.category || "General",
    }));
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={FileEdit} 
        title={`Custom Quote Builder - ${leadData?.name || "Customer"}`}
        description="Build a bespoke quotation with custom pricing, margins, and custom line items."
      />

      <QuotationBuilderClient 
        leadId={leadId}
        leadName={leadData?.name || "Customer"}
        catalog={catalog}
        userRole={user.role || "sales_staff"}
      />
    </div>
  );
}
