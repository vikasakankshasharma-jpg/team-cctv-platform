import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityLandingPage from "@/components/shared/CityLandingPage";
import { getCityData, cityDatabase } from "@/lib/city-data";

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
  const data = getCityData(citySlug);
  
  const brandPrefix = brand ? `${brand} ` : "";
  const locationText = data.name;
  
  let title = `${brandPrefix}CCTV Installation in ${locationText} | Transparent Pricing`;
  let description = `Professional ${brandPrefix}CCTV installation in ${locationText}. See exact prices, compare IP vs HD packages, and book a same-day survey across ${locationText}.`;
  
  if (intent === "quotation") {
    title = `Get ${brandPrefix}CCTV Quotation in ${locationText} | Instant Estimator`;
    description = `Compare ${brandPrefix}CCTV camera price and installation costs in ${locationText}. Get a free, transparent quotation for your home or business in under 2 minutes.`;
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
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
  
  // Basic validation to prevent extremely long invalid slugs or weird paths
  if (citySlug.length > 50 || !/^[a-zA-Z0-9\-]+$/.test(citySlug)) {
    notFound();
  }

  const data = getCityData(citySlug);

  return (
    <CityLandingPage 
      cityName={data.name}
      heroHighlight={data.heroHighlight}
      neighborhoods={data.neighborhoods}
      commercialAreas={data.commercialAreas}
      brand={brand}
      intent={intent}
    />
  );
}
