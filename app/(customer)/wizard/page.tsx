import { WizardClientV2 } from "@/components/wizard/WizardClientV2";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
  description: "Design your perfect security system in minutes. Answer a few questions to get an instant, professional-quality quotation tailored to your property.",
};

export default async function WizardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const served = params?.served;
  const pincode = params?.pincode;
  const city = params?.city;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      {served === 'false' && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 p-3 text-center text-amber-800 dark:text-amber-200 text-sm font-medium z-10 sticky top-0">
          We are actively expanding to {pincode || 'your area'}. Prices shown are for the nearest active hub ({city || 'Jaipur'}) as a reference.
        </div>
      )}
      <div className="flex-1">
        <WizardClientV2 />
      </div>
    </div>
  );
}
