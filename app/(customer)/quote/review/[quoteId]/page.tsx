import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { Quote } from "@/types";
import { RevisionBanner } from "@/components/quote/RevisionBanner";
import { Suspense } from "react";
// Assuming there is a generic quote summary component, if not we will just render basic details
// import { QuoteSummary } from "@/components/quote/QuoteSummary";

interface PageProps {
  params: { quoteId: string };
  searchParams: { lead_id: string };
}

export default async function QuoteReviewPage({ params, searchParams }: PageProps) {
  const { quoteId } = params;
  const { lead_id } = searchParams;

  if (!lead_id) {
    return (
      <div className="p-8 text-center text-red-500">
        Missing lead reference. Please use the link provided in your email/SMS.
      </div>
    );
  }

  const quoteDoc = await adminDb.collection("leads").doc(lead_id).collection("quotes").doc(quoteId).get();
  
  if (!quoteDoc.exists) {
    notFound();
  }

  const quote = { id: quoteDoc.id, ...quoteDoc.data() } as Quote;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Review Your Quotation</h1>
      
      <RevisionBanner 
        version={quote.version || 1} 
        isRevision={quote.is_revision} 
        revisionNotes={quote.revision_notes} 
      />

      <div className="bg-white shadow rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Quotation Summary</h2>
        <div className="space-y-4">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Plan Type</span>
            <span className="font-medium capitalize">{quote.plan_type}</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Technology</span>
            <span className="font-medium">{quote.technology}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2">
            <span>Total Payable</span>
            <span>₹{quote.total_payable?.toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col items-center text-center">
        <h3 className="text-xl font-bold text-blue-900 mb-2">Proceed to Installation</h3>
        <p className="text-blue-700 mb-6">
          Approve this quotation and pay the advance booking amount to dispatch our installation team.
        </p>
        
        <form action={`/api/payment/create-order`} method="POST">
          <input type="hidden" name="lead_id" value={lead_id} />
          <input type="hidden" name="quote_id" value={quoteId} />
          <button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            Approve & Pay Advance
          </button>
        </form>
      </div>
    </div>
  );
}
