import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import PublicDeliveryClient from "./PublicDeliveryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Material Delivery Verification | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function PublicDeliveryPage({ params }: { params: { token: string } }) {
  // Look up the quote by delivery_token
  const quotesSnap = await adminDb.collection("quotes")
    .where("delivery_token", "==", params.token)
    .limit(1)
    .get();

  if (quotesSnap.empty) {
    return notFound();
  }

  const quoteDoc = quotesSnap.docs[0];
  const quoteData = quoteDoc.data();

  // Only pass safe, non-sensitive data to the client
  const safeQuote = {
    id: quoteDoc.id,
    customer_name: quoteData.customer_name || "",
    address: quoteData.address?.full_address || quoteData.requirementSnapshot?.full_address || "",
    delivery_status: quoteData.delivery_status || "PENDING",
    payment_status: quoteData.payment_status || "pending",
    delivery_method: quoteData.delivery_method || "internal_staff",
    payment_preference: quoteData.payment_preference || "online_all",
    total_payable: quoteData.pricingSnapshot?.total_payable || quoteData.total_payable || 0,
    advance_payment_amount: quoteData.advance_payment_amount || 500,
    assigned_delivery_staff: quoteData.assigned_delivery_staff || null,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 flex flex-col items-center justify-center p-4">
      <PublicDeliveryClient
        quoteId={quoteDoc.id}
        quote={safeQuote}
      />
    </div>
  );
}
