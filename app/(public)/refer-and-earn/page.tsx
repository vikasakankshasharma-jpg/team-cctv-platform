import type { Metadata } from "next";
import ReferAndEarnClient from "@/components/refer-and-earn/ReferAndEarnClient";

export const metadata: Metadata = {
  title: "Refer & Earn ₹500 | TEAM CCTV Affiliate Program",
  description:
    "Earn flat ₹500 for every CCTV camera installation you refer. Your friends get ₹500 off. Free, instant signup with just your phone number.",
  openGraph: {
    title: "Earn Flat ₹500 with TEAM CCTV Refer & Earn",
    description: "Get flat ₹500 per installation referred. Instant signup in 30 seconds.",
  },
};

export default function ReferAndEarnPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200">
      <ReferAndEarnClient />
    </main>
  );
}
