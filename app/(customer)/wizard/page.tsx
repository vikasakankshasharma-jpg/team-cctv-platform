import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";
import { getWizardConfig, getSettingsConfig, getDefaultFallbackWizard } from "@/lib/queries";

export const metadata: Metadata = {
  title: "CCTV Setup Wizard | Custom Security Planning",
  description: "Design your perfect security system in minutes. Answer a few questions to get an instant, industrial-grade quotation tailored to your property.",
  openGraph: {
    title: "CCTV Setup Wizard | Custom Security Planning",
    description: "Design your perfect security system in minutes. Get an instant industrial-grade quotation.",
    images: ["/og-wizard.png"], // Placeholder for future OG image
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
