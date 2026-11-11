"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { INDIC_GOOGLE_FONTS, LocaleCode } from "@/lib/i18n/mapping";
import { writeLocaleCookie } from "@/lib/i18n/store";

export function LanguageSync() {
  const { locale } = useTranslation();

  useEffect(() => {
    if (typeof document === "undefined") return;
    writeLocaleCookie(locale);
    document.documentElement.lang = locale;
    document.documentElement.setAttribute("data-locale", locale);

    const fontMeta = INDIC_GOOGLE_FONTS[locale as LocaleCode];
    const linkId = "indic-google-font-stylesheet";
    const existing = document.getElementById(linkId) as HTMLLinkElement | null;

    if (fontMeta) {
      const href = `https://fonts.googleapis.com/css2?family=${fontMeta.family}&display=swap`;
      document.documentElement.style.setProperty("--font-indic-sans", fontMeta.cssFamily);
      if (existing) {
        if (existing.href !== href) existing.href = href;
      } else {
        const link = document.createElement("link");
        link.id = linkId;
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    } else {
      document.documentElement.style.removeProperty("--font-indic-sans");
      if (existing) existing.remove();
    }
  }, [locale]);

  return null;
}
