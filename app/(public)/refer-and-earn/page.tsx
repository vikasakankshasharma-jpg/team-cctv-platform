import type { Metadata } from "next";
import ReferAndEarnClient from "@/components/refer-and-earn/ReferAndEarnClient";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("refer_and_earn", await getServerLocale());
}

export default function ReferAndEarnPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <ReferAndEarnClient />
    </main>
  );
}
