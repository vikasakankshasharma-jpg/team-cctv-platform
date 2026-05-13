import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import type { Product, AppSettings, Addon } from "@/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { Grid3x3 } from "lucide-react";
import { SETTINGS_DOC_ID } from "@/lib/firebase-client";
import { MatricesClient } from "./MatricesClient";

export const dynamic = "force-dynamic";

export default async function MatricesPage() {
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
    ...(settingsRaw as any),
    created_at: (settingsRaw.created_at as any)?.toDate?.()?.toISOString() || settingsRaw.created_at || null,
    updated_at: (settingsRaw.updated_at as any)?.toDate?.()?.toISOString() || settingsRaw.updated_at || null,
  } as unknown as AppSettings;

  // 3. Fetch addons for reference
  const addonsSnapshot = await adminDb.collection("addons").where("is_active", "==", true).get();
  const addons = addonsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  }) as Addon[];

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Grid3x3} 
        title="Quotation Matrices" 
        description="Verify dynamic pricing output across camera counts and technology options."
      />

      <MatricesClient 
        products={products}
        settings={settings}
        addons={addons}
      />
    </div>
  );
}
