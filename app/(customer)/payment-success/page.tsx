import { PaymentSuccessClient } from "@/components/payment/PaymentSuccessClient";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("payment_success", await getServerLocale());
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const quoteId = (params?.quoteId || params?.quote_id) as string;
  const paymentId = (params?.paymentId || params?.payment_id) as string;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="flex-1">
        <PaymentSuccessClient quoteId={quoteId} paymentId={paymentId} />
      </div>
    </div>
  );
}
