import type { Metadata } from "next";
import { LocalizedLegalDocument } from "@/components/shared/LocalizedLegalDocument";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const base = buildPageMetadata("privacy_policy", locale, {
    alternates: { canonical: "https://cctvquotation.com/privacy-policy" },
  });
  return {
    ...base,
    twitter: {
      card: "summary",
      title: String(base.title || ""),
      description: String(base.description || ""),
    },
  };
}

export default async function PrivacyPolicyPage() {
  const initialLocale = await getServerLocale();

  return (
    <LocalizedLegalDocument
      type="privacy"
      initialLocale={initialLocale}
      meta={{
        lastUpdated: "20 May 2026",
        companyName: "TEAM CCTV (Proprietor: Vikash Akansha Sharma)",
        domain: "cctvquotation.com",
        phone: "+91 73576 12865",
        email: "hello@cctvquotation.com",
        address: "Malviya Nagar, Jaipur, Rajasthan — 302017",
      }}
    />
  );
}
