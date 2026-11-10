import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { getBaselineCatalogData } from "@/lib/baseline-quote";
import type { Addon } from "@/types";
import { AddonsClient } from "@/components/admin/AddonsClient";
import { PricingSubNav } from "@/components/admin/navigation/AdminSubNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add-ons & Options | Command Centre",
  description: "Configure system enhancers, storage expansions, and installation logic rules.",
};

export const dynamic = "force-dynamic";

export default async function AddonsAdminPage() {
  await requireAdmin();

  let addons: Addon[] = [];
  try {
    const snapshot = await adminDb.collection("addons").where("is_deleted", "==", false).get();
    addons = snapshot.docs.map(doc => {
      const data = doc.data() as Addon;
      return {
        ...data,
        id: doc.id,
        updated_at: (data.updated_at as any)?.toDate?.()?.toISOString() || data.updated_at || null,
        created_at: (data.created_at as any)?.toDate?.()?.toISOString() || data.created_at || null,
      };
    });
  } catch (err) {
    console.warn("⚠️ Failed to fetch addons from Firestore, falling back to cached baseline:", err);
    const catalog = await getBaselineCatalogData();
    addons = catalog.addons || [];
  }

  // Sort by name
  addons.sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""));

  return (
    <div className="space-y-6">
      <PricingSubNav />
      <AddonsClient initialAddons={addons} />
    </div>
  );
}
