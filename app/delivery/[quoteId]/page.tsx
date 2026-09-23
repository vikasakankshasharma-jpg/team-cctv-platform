import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import DeliveryClient from "./DeliveryClient";

export default async function DeliveryPage({ params }: { params: { quoteId: string } }) {
  const quoteDoc = await adminDb.collection("quotes").doc(params.quoteId).get();
  
  if (!quoteDoc.exists) {
    return notFound();
  }
  
  const quoteData = quoteDoc.data();
  
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <DeliveryClient 
        quoteId={params.quoteId} 
        quote={quoteData as any} 
      />
    </div>
  );
}
