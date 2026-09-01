import { PaymentSuccessClient } from "@/components/payment/PaymentSuccessClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful | CCTVQuotation by TEAM",
  description: "Your CCTV installation payment has been confirmed. Download your tax invoice.",
};

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const quoteId = params?.quoteId as string;
  const paymentId = params?.paymentId as string;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1">
        <PaymentSuccessClient quoteId={quoteId} paymentId={paymentId} />
      </div>
    </div>
  );
}
