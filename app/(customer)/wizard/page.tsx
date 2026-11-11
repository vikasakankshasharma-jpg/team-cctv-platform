import { WizardClientV2 } from "@/components/wizard/WizardClientV2";
import type { Metadata } from "next";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { getServerLocale, getServerTranslations } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("wizard", await getServerLocale());
}

export default async function WizardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  const served = params?.served;
  const pincode = params?.pincode;
  const city = params?.city;
  const areaLabel = String(pincode || t("qrc_your_area", "your area"));
  const cityLabel = String(city || t("bo_city_ph", "Jaipur"));

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f7] dark:bg-black transition-colors duration-500">
      {served === 'false' && (
        <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800 p-3 text-center text-amber-800 dark:text-amber-200 text-sm font-medium z-10 sticky top-0">
          <TranslatedText
            tKey="city_expanding_notice"
            defaultText={`We are actively expanding to ${areaLabel}. Prices shown are for the nearest active hub (${cityLabel}) as a reference.`}
            params={{ area: areaLabel, city: cityLabel }}
          />
        </div>
      )}
      <div className="flex-1">
        <WizardClientV2 searchParams={params} />
      </div>
    </div>
  );
}
