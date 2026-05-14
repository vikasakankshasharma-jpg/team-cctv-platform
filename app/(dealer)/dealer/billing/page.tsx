import { redirect } from "next/navigation";
import { verifyDealerSession } from "@/lib/auth-dealer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { DealerBillingClient } from "@/components/dealer/DealerBillingClient";
import type { FranchiseDealer } from "@/types";

export const dynamic = "force-dynamic";

export default async function DealerBillingPage() {
  const session = await verifyDealerSession();
  if (!session.isAuthenticated) redirect("/dealer/login");
  const dealerId = session.dealerId!;

  const dealerDoc = await adminDb.collection(COLLECTIONS.FRANCHISE_DEALERS).doc(dealerId).get();
  const dealer = { id: dealerDoc.id, ...dealerDoc.data() } as FranchiseDealer;

  return (
    <DealerBillingClient dealer={dealer as any} />
  );
}
