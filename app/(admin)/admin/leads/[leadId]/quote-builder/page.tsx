import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { QuotationBuilderClient } from "@/components/admin/QuotationBuilderClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileEdit } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminQuoteBuilderPage({ params }: { params: Promise<{ leadId: string }> }) {
  const user = await requireAdmin();
  const { leadId } = await params;

  const leadSnap = await adminDb.collection("leads").doc(leadId).get();
  if (!leadSnap.exists) {
    notFound();
  }
  const leadData = leadSnap.data();

  // Fetch catalog for easy selection
  const productsSnap = await adminDb.collection("products")
    .where("is_active", "==", true)
    .where("is_deleted", "==", false)
    .get();

  const catalog = productsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.display_name,
      baseCost: data.base_cost || 0,
      unitPrice: data.unit_price || 0,
      category: data.category || "General",
    };
  });

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
