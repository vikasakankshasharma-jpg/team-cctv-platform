import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { FileText } from "lucide-react";
import type { Metadata } from "next";
import ManualQuoteBuilderClient from "@/components/salesperson/ManualQuoteBuilderClient";

export const metadata: Metadata = {
  title: "Create Quote | Sales Portal",
};

export const dynamic = "force-dynamic";

export default async function SalespersonCreateQuotePage() {
  const session = await verifySession();

  if (!session.isAuthenticated || (session.role !== "sales_staff" && session.role !== "super_admin")) {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader
        icon={FileText}
        title={<TranslatedText tKey="sls_mqb_page_title" defaultText="Manual Quote Builder" />}
        description={<TranslatedText tKey="sls_mqb_page_desc" defaultText="Build custom quotes by selecting catalog items and applying approved discounts." />}
      />
      <ManualQuoteBuilderClient />
    </div>
  );
}
