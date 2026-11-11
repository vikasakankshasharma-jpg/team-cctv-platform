import { RateUsClient } from "@/components/public/RateUsClient";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("rate_us", await getServerLocale());
}

export default async function RateUsPage({ params }: { params: { leadId: string } }) {
  const leadDoc = await adminDb.collection("leads").doc(params.leadId).get();
  if (!leadDoc.exists) {
    return notFound();
  }

  const lead = leadDoc.data()!;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 text-center">
        <h2 className="text-2xl font-black text-gray-900 mb-2"><TranslatedText tKey="rate_how_did_we" defaultText="How did we do?" /></h2>
        <p className="text-gray-500 font-medium mb-8">
          <TranslatedText tKey="rate_hi" defaultText="Hi" /> {lead.name}<TranslatedText tKey="rate_greeting_post" defaultText=", thank you for choosing TEAM CCTV. Please rate your installation experience." />
        </p>
        <RateUsClient leadId={params.leadId} customerName={lead.name} />
      </div>
    </div>
  );
}
