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

  let layouts: CardLayoutRule[] = [];
  let cameras: Product[] = [];
  let fetchError = false;

  try {
    let layoutsSnap;
    try {
      layoutsSnap = await adminDb
        .collection("comparison_card_layouts")
        .orderBy("priority", "asc")
        .get();
    } catch {
      // Fallback: unordered if index missing
      layoutsSnap = await adminDb.collection("comparison_card_layouts").get();
    }

    const productsSnap = await adminDb
      .collection("products")
      .where("is_active", "==", true)
      .where("category", "==", "camera")
      .get();

    layouts = layoutsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        created_at: d.created_at?.toDate?.()?.toISOString() || null,
        updated_at: d.updated_at?.toDate?.()?.toISOString() || null,
      } as CardLayoutRule;
    });

    cameras = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }));
  } catch (err) {
    console.error("[CardLayoutsPage] Fetch failed:", err);
    fetchError = true;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={LayoutGrid}
        title="Card Layout Builder"
        description="Define which 3 comparison cards customers see based on their technology choice, property type, and camera count. Admin-controlled — no code changes needed."
        badge={fetchError ? "Error" : `${layouts.length} Layouts`}
      />
      {fetchError ? (
        <div className="rounded-[24px] border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-10 text-center">
          <p className="text-red-600 dark:text-red-400 font-bold text-sm">
            Failed to load card layout data. Check Firestore indexes for
            <code className="mx-1 px-1 bg-zinc-100 dark:bg-zinc-800 rounded">comparison_card_layouts</code>.
          </p>
        </div>
      ) : (
        <CardLayoutClient initialLayouts={layouts} cameras={cameras} />
      )}
    </div>
  );
}
