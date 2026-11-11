"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { languageNames, LocaleCode } from "@/lib/i18n/mapping";
import { Globe } from "lucide-react";

export function LanguageSwitcher({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
} = {}) {
  const { locale, t } = useTranslation();
  const fullLang = languageNames[locale as LocaleCode] || t("lang_label", "Language");
  const shortLang =
    languageNames[locale as LocaleCode]?.split(" ")[0] || t("lang_short", "Lang");

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("open-language-modal"))}
      aria-label={t("lang_label", "Language")}
      title={fullLang}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shrink-0 ${className}`}
    >
      <Globe className="w-4 h-4 text-gray-500 shrink-0" />
      {compact ? (
        <span>{shortLang}</span>
      ) : (
        <>
          <span className="hidden sm:inline">{fullLang}</span>
          <span className="sm:hidden">{shortLang}</span>
        </>
      )}
    </button>
  );
}
