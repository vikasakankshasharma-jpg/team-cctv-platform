import { adminDb } from "@/lib/firebase-admin";
import InstallerClient from "./InstallerClient";
import { notFound } from "next/navigation";

export default async function InstallerPage({ params }: { params: { quoteId: string } }) {
  const { quoteId } = params;

  const quoteSnap = await adminDb.collection("quotes").doc(quoteId).get();
  if (!quoteSnap.exists) {
    return notFound();
  }

  const quoteData = quoteSnap.data();

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      <InstallerClient 
        quoteId={quoteId} 
        quoteData={JSON.parse(JSON.stringify(quoteData))} 
      />
    </div>
  );
}
