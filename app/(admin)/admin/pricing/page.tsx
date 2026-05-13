import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product, AppSettings } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { IndianRupee } from "lucide-react";
import PricingBoard from "@/components/admin/PricingBoard";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  await requireAdmin();

  // 1. Fetch all products
  const productsSnapshot = await adminDb.collection("products").where("is_active", "==", true).get();
  const products = productsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as Product[];

  // 2. Fetch app settings
  const settingsDoc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
  const settingsRaw = settingsDoc.data() || {};
  const settings = {
    ...settingsRaw,
    created_at: (settingsRaw.created_at as any)?.toDate?.()?.toISOString() || settingsRaw.created_at || null,
    updated_at: (settingsRaw.updated_at as any)?.toDate?.()?.toISOString() || settingsRaw.updated_at || null,
  } as AppSettings;

  // 3. Fetch addons for reference in pricing engine
  const addonsSnapshot = await adminDb.collection("addons").where("is_active", "==", true).get();
  const addons = addonsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as any[];

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={IndianRupee} 
        title="Live Pricing Board" 
        description="Edit SKU prices inline and see the impact on standard quotations instantly."
      />

      <PricingBoard 
        initialProducts={products} 
        settings={settings}
        addons={addons}
      />
    </div>
  );
}
