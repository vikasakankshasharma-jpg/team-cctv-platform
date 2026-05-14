import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { IndianRupee } from "lucide-react";
import type { Metadata } from "next";
import type { FranchiseDealer, FranchisePricingOverride, Product } from "@/types";
import { notFound } from "next/navigation";
import { FranchisePricingClient } from "./FranchisePricingClient";

export const metadata: Metadata = { title: "Franchise Pricing Override | Admin" };

export default async function FranchisePricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [dealerDoc, overrideSnap, productsSnap] = await Promise.all([
    adminDb.collection("franchise_dealers").doc(id).get(),
    adminDb
      .collection("franchise_pricing_overrides")
      .where("franchise_dealer_id", "==", id)
      .limit(1)
      .get(),
    adminDb
      .collection("products")
      .where("is_active", "==", true)
      .where("is_deleted", "==", false)
      .get(),
  ]);

  if (!dealerDoc.exists) return notFound();

  const dealer = { id: dealerDoc.id, ...dealerDoc.data() } as FranchiseDealer & { id: string };
  const override = overrideSnap.empty
    ? null
    : ({ id: overrideSnap.docs[0].id, ...overrideSnap.docs[0].data() } as FranchisePricingOverride & { id: string });

  const products = productsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Product),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={IndianRupee}
        title={`Pricing: ${dealer.company_name}`}
        description={`Set location-specific purchase costs and margin overrides for ${dealer.owner_name}'s territory. These values override the TEAM CCTV defaults when generating quotes for this dealer.`}
        badge={override ? "Override Active" : "Using Defaults"}
      />
      <FranchisePricingClient
        dealer={dealer}
        existingOverride={override}
        products={products}
      />
    </div>
  );
}
