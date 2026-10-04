import type { Metadata } from "next";
import PartnerOnboardingClient from "@/components/partner/PartnerOnboardingClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create B2B Partner | Admin",
};

export default function AdminCreatePromoterPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/promoters" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} className="mr-2" />
          Back to Promoters
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Create B2B Partner</h1>
        <p className="text-slate-500">Register a new Business Partner (Shopkeeper, Architect, etc). They will receive a 2% commission, and their customers get a 3% discount.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <PartnerOnboardingClient />
      </div>
    </div>
  );
}
