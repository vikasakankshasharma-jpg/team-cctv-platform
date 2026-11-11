import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityLandingPage from "@/components/shared/CityLandingPage";
import { getCityData, cityDatabase } from "@/lib/city-data";
import { getDynamicPackageCatalog } from "@/lib/dynamic-package-pricing";
import { getServerTranslations } from "@/lib/i18n/server-locale";
import { buildCitySeoMetadata } from "@/lib/i18n/seo-metadata";
import { SPEECH_LOCALE_MAP } from "@/lib/i18n/mapping";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ city: string }>;
}

function parseSeoSlug(slug: string) {
  const normalized = slug.toLowerCase().trim();
  
  if (normalized.includes("-in-")) {
    const parts = normalized.split("-in-");
    const prefix = parts[0];
    const citySlug = parts[1];
    
    let brand = "";
    if (prefix.includes("cp-plus") || prefix.includes("cpplus")) {
      brand = "CP Plus";
    } else if (prefix.includes("hikvision")) {
      brand = "Hikvision";
    }
    
    let intent = "installation";
    if (
      prefix.includes("quotation") || 
      prefix.includes("dealer") || 
      prefix.includes("cost") || 
      prefix.includes("estimate") ||
      prefix.includes("price")
    ) {
      intent = "quotation";
    }
    
    return { citySlug, brand, intent };
  }
  
  return { citySlug: normalized, brand: "", intent: "installation" };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const { citySlug, brand, intent } = parseSeoSlug(city);
  const { locale, t } = await getServerTranslations();
  const data = getCityData(citySlug, locale);
  
  const brandPrefix = brand ? `${brand} ` : "";
  const locationText = data.name;
  
  const { title, description } = buildCitySeoMetadata({
    locale,
    cityName: locationText,
    brandPrefix,
    intent,
    installDesc: t("city_hero_desc_install"),
    quoteDesc: t("city_hero_desc_quote"),
  });
  const ogLocale = (SPEECH_LOCALE_MAP[locale] || "en-IN").replace("-", "_");
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    }
  };
}

export default async function DynamicCityLandingPage({ params }: PageProps) {
  const { city } = await params;
  const { citySlug, brand, intent } = parseSeoSlug(city);
  
  // Reject invalid slugs: too short, too long, or containing invalid characters
  if (citySlug.length < 2 || citySlug.length > 100 || !/^[a-z0-9-]+$/.test(citySlug)) {
    notFound();
  }

  const { locale } = await getServerTranslations();
  const data = getCityData(citySlug, locale);
  const dynamicPackages = await getDynamicPackageCatalog();
  const residentialPrice = dynamicPackages?.home?.[4]?.cpplus?.price ?? 17999;
  const commercialPrice = dynamicPackages?.shop?.[8]?.cpplus?.price ?? 32999;

  return (
    <CityLandingPage 
      cityName={data.name}
      citySlug={citySlug}
      heroHighlight={data.heroHighlight}
      neighborhoods={data.neighborhoods}
      commercialAreas={data.commercialAreas}
      brand={brand}
      intent={intent}
      residentialStartingPrice={residentialPrice}
      commercialStartingPrice={commercialPrice}
    />
  );
}
