import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UnifiedLoginClient } from "@/components/auth/UnifiedLoginClient";
import { TranslatedText } from "@/components/shared/TranslatedText";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("login", await getServerLocale());
}

export default function UnifiedLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center py-6 sm:py-10 px-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto">
        {/* Navigation: Accessible Back to Home */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span><TranslatedText tKey="nav_back_home" defaultText="← Back to Home" /></span>
          </Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            <TranslatedText tKey="ul_welcome_back" defaultText="Welcome Back" />
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1.5 text-xs sm:text-sm">
            <TranslatedText tKey="ul_sign_in_sub" defaultText="Sign in to your account" />
          </p>
        </div>
        
        <UnifiedLoginClient />
      </div>
    </div>
  );
}
