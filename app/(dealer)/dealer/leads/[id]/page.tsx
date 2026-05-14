import { redirect, notFound } from "next/navigation";
import { verifyDealerSession } from "@/lib/auth-dealer";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "@/lib/constants";
import { DealerLeadDetailClient } from "@/components/dealer/DealerLeadDetailClient";
import type { Lead } from "@/types";

export const dynamic = "force-dynamic";

export default async function DealerLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifyDealerSession();
  if (!session.isAuthenticated) redirect("/dealer/login");
  const dealerId = session.dealerId!;
  const { id } = await params;

  // Fetch the specific lead
  const leadDoc = await adminDb.collection(COLLECTIONS.LEADS).doc(id).get();
  if (!leadDoc.exists) return notFound();

  const leadData = leadDoc.data() as Lead;

  // Security check: ensure the lead belongs to this dealer
  if (leadData.franchise_dealer_id !== dealerId) {
    return redirect("/dealer/dashboard");
  }

  // Fetch associated quotes
  const quotesSnap = await adminDb
    .collection(COLLECTIONS.LEADS)
    .doc(id)
    .collection(SUBCOLLECTIONS.QUOTES)
    .orderBy("created_at", "desc")
    .get();

  const quotes = quotesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_at: (doc.data().created_at as any)?.toDate?.()?.toISOString() || doc.data().created_at,
  }));

  return (
    <DealerLeadDetailClient 
      lead={{ id: leadDoc.id, ...leadData, created_at: (leadData.created_at as any)?.toDate?.()?.toISOString() || leadData.created_at } as any} 
      quotes={quotes as any}
    />
  );
}
