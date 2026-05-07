import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

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
        title="Create Quote"
        description="Generate a new quotation on behalf of a walk-in customer."
      />
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 max-w-2xl">
        <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">New Customer Setup</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          To create a new quote, you will use the standard customer wizard. The system will record the answers and generate a quotation link you can share via WhatsApp or print.
        </p>

        <Link 
          href="/" 
          target="_blank"
          className="inline-flex items-center gap-3 bg-amber-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20 group"
        >
          Launch Wizard
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
