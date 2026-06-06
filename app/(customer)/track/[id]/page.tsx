import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import TrackingClient from "./TrackingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Installation | TEAM CCTV",
  description: "Track your CCTV installation status securely.",
};

export const dynamic = "force-dynamic";

export default async function CustomerTrackingPage({ params }: { params: { id: string } }) {
  // We use the lead_id as the tracking identifier for simplicity
  const leadDoc = await adminDb.collection("leads").doc(params.id).get();
  
  if (!leadDoc.exists) {
    notFound();
  }
  
  const lead = { id: leadDoc.id, ...leadDoc.data() } as any;

  // Find associated job to get dispatch status
  let job = null;
  const jobsSnap = await adminDb.collection("jobs").where("lead_id", "==", params.id).limit(1).get();
  if (!jobsSnap.empty) {
    job = { id: jobsSnap.docs[0].id, ...jobsSnap.docs[0].data() };
  }

  // Find the accepted quote for hardware preview
  let quote = null;
  if (lead.last_quote_id) {
    const quoteDoc = await leadDoc.ref.collection("quotes").doc(lead.last_quote_id).get();
    if (quoteDoc.exists) {
      quote = { id: quoteDoc.id, ...quoteDoc.data() };
    }
  }

  return (
    <TrackingClient 
      lead={JSON.parse(JSON.stringify(lead))} 
      job={job ? JSON.parse(JSON.stringify(job)) : null}
      quote={quote ? JSON.parse(JSON.stringify(quote)) : null}
    />
  );
}
