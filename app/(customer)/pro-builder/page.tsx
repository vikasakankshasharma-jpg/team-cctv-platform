import { ProBuilderClient } from "@/components/builder/ProBuilderClient";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("pro_builder", await getServerLocale());
}

export default function ProBuilderPage() {
  return <ProBuilderClient />;
}
