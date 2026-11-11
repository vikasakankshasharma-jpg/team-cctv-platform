"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { LocaleCode } from "@/lib/i18n/mapping";
import { loadLocaleDict, seedLocaleDict, type TranslationDict } from "@/lib/i18n/locales";
import { useI18nStore, writeLocaleCookie } from "@/lib/i18n/store";

interface I18nSSRContextValue {
  initialLocale: LocaleCode;
  hydrated: boolean;
}

const I18nSSRContext = createContext<I18nSSRContextValue>({
  initialLocale: "en",
  hydrated: true,
});

export function useI18nSSRContext() {
  return useContext(I18nSSRContext);
}

const VALID_LOCALES = new Set<string>([
  "en",
  "hi",
  "mr",
  "gu",
  "ta",
  "te",
  "kn",
  "bn",
  "ml",
  "pa",
  "or",
]);

function readLocaleCookie(): LocaleCode | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)team_locale=([^;]+)/);
  if (match && VALID_LOCALES.has(match[1])) {
    return match[1] as LocaleCode;
  }
  return null;
}

export function I18nProvider({
  initialLocale,
  initialDict,
  children,
}: {
  initialLocale: LocaleCode;
  initialDict?: TranslationDict;
  children: React.ReactNode;
}) {
  // Synchronously seed SSR locale dictionary before initial render & hydration
  if (initialDict) {
    seedLocaleDict(initialLocale, initialDict);
  }

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cookieLocale = readLocaleCookie();
    const state = useI18nStore.getState();

    if (cookieLocale) {
      if (state.locale !== cookieLocale) {
        useI18nStore.setState({ locale: cookieLocale });
      }
      if (cookieLocale !== "en") {
        loadLocaleDict(cookieLocale).catch(() => {});
      }
    } else if (state.locale && state.locale !== "en") {
      // Preserve legacy localStorage selection and promote it to team_locale cookie for future SSR requests
      writeLocaleCookie(state.locale);
      loadLocaleDict(state.locale).catch(() => {});
    } else {
      writeLocaleCookie(initialLocale);
    }

    setHydrated(true);
  }, [initialLocale]);

  return (
    <I18nSSRContext.Provider value={{ initialLocale, hydrated }}>
      {children}
    </I18nSSRContext.Provider>
  );
}
