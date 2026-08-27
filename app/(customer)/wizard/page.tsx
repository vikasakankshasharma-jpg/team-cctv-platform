import { WizardClientV2 } from "@/components/wizard/WizardClientV2";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
  description: "Design your perfect security system in minutes. Answer a few questions to get an instant, professional-quality quotation tailored to your property.",
  alternates: {
    canonical: "https://cctvquotation.com/wizard",
  },
  openGraph: {
    title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
    description: "Design your perfect security system in minutes. Get an instant professional-quality quotation.",
    images: ["/og-wizard.png"], // Placeholder for future OG image
    siteName: "CCTVQuotation",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
    description: "Get your free CCTV quote in 2 minutes. All India.",
    images: ["https://cctvquotation.com/og-wizard.png"],
  },
};

export default function WizardPage() {
  return <WizardClientV2 />;
}
