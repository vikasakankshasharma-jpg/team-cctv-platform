import { redirect, notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";

interface PageProps {
  params: Promise<{ quoteId: string }>;
  searchParams: Promise<{ lead_id?: string }>;
}

export const dynamic = "force-dynamic";

export default async function QuoteReviewRedirectPage({ params, searchParams }: PageProps) {
  const { quoteId } = await params;
  const { lead_id } = await searchParams;

  if (lead_id) {
    redirect(`/quote/${lead_id}/review/${quoteId}`);
  }

  // Lookup quote in root quotes collection to find its associated lead_id
  const quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
  if (quoteDoc.exists) {
    const qData = quoteDoc.data();
    const resolvedLeadId = qData?.lead_id || qData?.leadId || quoteId;
    redirect(`/quote/${resolvedLeadId}/review/${quoteId}`);
  }

  // Check uppercase
  const upperDoc = await adminDb.collection("quotes").doc(quoteId.toUpperCase()).get();
  if (upperDoc.exists) {
    const qData = upperDoc.data();
    const resolvedLeadId = qData?.lead_id || qData?.leadId || quoteId.toUpperCase();
    redirect(`/quote/${resolvedLeadId}/review/${quoteId.toUpperCase()}`);
  }

  // Fallback to tracking page or 404
  notFound();
}
