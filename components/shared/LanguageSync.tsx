"use client";

import { useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageSync() {
  const { locale } = useTranslation();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.setAttribute("data-locale", locale);
    }
  }, [locale]);

  return null;
}
