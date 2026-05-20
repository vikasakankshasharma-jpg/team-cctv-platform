import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";
import { getWizardConfig, getSettingsConfig, getDefaultFallbackWizard } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
  description: "Design your perfect security system in minutes. Answer a few questions to get an instant, industrial-grade quotation tailored to your property.",
  alternates: {
    canonical: "https://cctvquotation.com/wizard",
  },
  openGraph: {
    title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
    description: "Design your perfect security system in minutes. Get an instant industrial-grade quotation.",
    images: ["/og-wizard.png"], // Placeholder for future OG image
    siteName: "CCTVQuotation",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
    description: "Get your free CCTV quote in 2 minutes. All India.",
  },
};

export default async function WizardPage() {
  let wizardRes;
  let settingsRes;

  try {
    const [w, s] = await Promise.all([
      getWizardConfig(),
      getSettingsConfig()
    ]);
    wizardRes = w;
    settingsRes = s;

    if (!wizardRes || !wizardRes.steps || wizardRes.steps.length === 0) {
      wizardRes = { steps: getDefaultFallbackWizard() };
    }
  } catch (error) {
    wizardRes = { steps: getDefaultFallbackWizard() };
    settingsRes = null;
  }

  return <WizardClient initialSteps={wizardRes?.steps} initialSettings={settingsRes} />;
}
