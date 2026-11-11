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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight"><TranslatedText tKey="ul_welcome_back" defaultText="Welcome Back" /></h1>
          <p className="text-gray-500 mt-2"><TranslatedText tKey="ul_sign_in_sub" defaultText="Sign in to your account" /></p>
        </div>
        
        <UnifiedLoginClient />
      </div>
    </div>
  );
}
