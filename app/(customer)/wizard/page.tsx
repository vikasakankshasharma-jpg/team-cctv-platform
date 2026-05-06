import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";
import { getWizardConfig, getSettingsConfig } from "@/lib/queries";

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
  const [wizardRes, settingsRes] = await Promise.all([
    getWizardConfig(),
    getSettingsConfig()
  ]);

  return <WizardClient initialSteps={wizardRes?.steps} initialSettings={settingsRes} />;
}
