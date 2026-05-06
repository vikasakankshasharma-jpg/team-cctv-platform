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
  const products = productsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[];

  // 2. Fetch app settings
  const settingsDoc = await adminDb.collection("settings").doc(SETTINGS_DOC_ID).get();
  const settings = settingsDoc.data() as AppSettings;

  // 3. Fetch addons for reference in pricing engine
  const addonsSnapshot = await adminDb.collection("addons").where("is_active", "==", true).get();
  const addons = addonsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

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
