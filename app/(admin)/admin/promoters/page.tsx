import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Promoter } from "@/types";
import { PromotersClient } from "@/components/admin/PromotersClient";

export const dynamic = "force-dynamic";

export default async function PromotersAdminPage() {
  await requireAdmin();

  const snapshot = await adminDb.collection("promoters").orderBy("total_ex_tax_business", "desc").get();
  
  const promoters = snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<Promoter, "id">)
  }));

  const layoutsSnapshot = await adminDb.collection("comparison_card_layouts").get();
  const cardLayouts = layoutsSnapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name
  }));

  return (
    <div className="space-y-6">
      <PromotersClient initialPromoters={promoters} availableLayouts={cardLayouts} />
    </div>
  );
}
