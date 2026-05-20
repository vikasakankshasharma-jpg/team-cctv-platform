import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Promoter } from "@/types";
import { PromotersClient } from "@/components/admin/PromotersClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promoter Network | Admin Command Centre",
  description: "Manage your referral partner network, commissions, and performance.",
};

export default async function PromotersAdminPage() {
  await requireAdmin();

  let promoters: (Promoter & { id: string })[] = [];
  let cardLayouts: { id: string; name: string }[] = [];
  let fetchError = false;

  try {
    // Try ordered fetch first (requires composite index)
    let snapshot;
    try {
      snapshot = await adminDb
        .collection("promoters")
        .orderBy("total_ex_tax_business", "desc")
        .get();
    } catch {
      // Fallback: unordered fetch if index is missing
      snapshot = await adminDb.collection("promoters").get();
    }

    promoters = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() ?? data.created_at ?? null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() ?? data.updated_at ?? null,
      };
    }) as any[];

    const layoutsSnapshot = await adminDb.collection("comparison_card_layouts").get();
    cardLayouts = layoutsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name as string,
    }));
  } catch (err) {
    console.error("[PromotersAdminPage] Failed to fetch data:", err);
    fetchError = true;
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="Promoter Network"
          description="Manage your referral partner network and commissions."
        />
        <div className="rounded-[24px] border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-10 text-center">
          <p className="text-red-600 dark:text-red-400 font-bold text-sm">
            Failed to load promoter data. This may be a Firestore index issue.
          </p>
          <p className="text-zinc-500 text-xs mt-2">
            Check the Firebase Console → Firestore → Indexes and ensure a composite index on
            <code className="mx-1 px-1 bg-zinc-100 dark:bg-zinc-800 rounded">promoters</code>
            exists for <code className="px-1 bg-zinc-100 dark:bg-zinc-800 rounded">total_ex_tax_business DESC</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PromotersClient initialPromoters={promoters} availableLayouts={cardLayouts} />
    </div>
  );
}
