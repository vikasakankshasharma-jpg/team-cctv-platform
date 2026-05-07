import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { PageHeader } from "@/components/admin/PageHeader";
import { LayoutGrid } from "lucide-react";
import { CardLayoutClient } from "@/components/admin/CardLayoutClient";
import type { CardLayoutRule, Product } from "@/types";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Card Layout Builder | Admin Command Centre",
  description: "Control which 3 comparison cards are shown to customers based on technology, property type, and camera count.",
};

export default async function CardLayoutsPage() {
  await requireAdmin();

  const [layoutsSnap, productsSnap] = await Promise.all([
    adminDb.collection("comparison_card_layouts").orderBy("priority", "asc").get(),
    adminDb.collection("products").where("is_active", "==", true).where("category", "==", "camera").get(),
  ]);

  const layouts = layoutsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: d.created_at?.toDate?.()?.toISOString() || null,
      updated_at: d.updated_at?.toDate?.()?.toISOString() || null,
    } as CardLayoutRule;
  });

  const cameras = productsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Product),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutGrid}
        title="Card Layout Builder"
        description="Define which 3 comparison cards customers see based on their technology choice, property type, and camera count. Admin-controlled — no code changes needed."
        badge={`${layouts.length} Layouts`}
      />
      <CardLayoutClient initialLayouts={layouts} cameras={cameras} />
    </div>
  );
}
