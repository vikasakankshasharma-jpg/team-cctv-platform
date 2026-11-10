import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-server";
import { MarketingClient } from "@/components/admin/MarketingClient";
import { GrowthSubNav } from "@/components/admin/navigation/AdminSubNav";

export const metadata: Metadata = {
  title: "Marketing Hub | Admin",
  description: "Manage EDM templates for partners",
};

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <GrowthSubNav />
      <MarketingClient />
    </div>
  );
}
