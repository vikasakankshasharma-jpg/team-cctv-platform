"use client";

import Link from "next/link";
import { UserCircle2, Briefcase, ArrowRight } from "lucide-react";
import { TranslatedText } from "@/components/shared/TranslatedText";

export function UnifiedLoginClient() {
  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      <div className="p-6 sm:p-8 space-y-6">
        <Link 
          href="/customer/login"
          className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg"><TranslatedText tKey="customer_portal" defaultText="Customer Portal" /></h3>
              <p className="text-sm text-gray-500 font-medium">View quotes, invoices & track installations</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link 
          href="/admin/login"
          className="group flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-gray-900 hover:bg-gray-50 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg"><TranslatedText tKey="staff_partner_portal" defaultText="Staff & Partner Portal" /></h3>
              <p className="text-sm text-gray-500 font-medium">Internal staff, installers & affiliates</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
