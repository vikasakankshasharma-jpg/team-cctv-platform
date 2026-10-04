"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { languageNames, LocaleCode } from "@/lib/i18n/mapping";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale } = useTranslation();

  return (
    <button
      onClick={() => window.dispatchEvent(new Event('open-language-modal'))}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <Globe className="w-4 h-4 text-gray-500" />
      <span className="hidden sm:inline">{languageNames[locale as LocaleCode] || 'Language'}</span>
      <span className="sm:hidden">{languageNames[locale as LocaleCode]?.split(' ')[0] || 'Lang'}</span>
    </button>
  );
}
