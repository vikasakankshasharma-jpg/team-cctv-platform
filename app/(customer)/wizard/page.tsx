import { WizardClientV2 } from "@/components/wizard/WizardClientV2";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("wizard", await getServerLocale());
}

export default async function WizardPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f5f7] dark:bg-black transition-colors duration-500">
      <div className="flex-1">
        <WizardClientV2 searchParams={params} />
      </div>
    </div>
  );
}
