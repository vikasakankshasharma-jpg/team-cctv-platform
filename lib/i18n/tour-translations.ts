// lib/i18n/tour-translations.ts
// Modular, Lazy-Loaded 11-Language Guided Tour Translation Engine

import { useEffect, useState } from "react";
import type { LocaleCode } from "./mapping";

export type TourLocale = LocaleCode;

const tourDictionaryLoaders: Record<
  TourLocale,
  () => Promise<{ default: Record<string, string> }>
> = {
  en: () => import("@/locales/tours/en.json", { with: { type: "json" } }),
  hi: () => import("@/locales/tours/hi.json", { with: { type: "json" } }),
  mr: () => import("@/locales/tours/mr.json", { with: { type: "json" } }),
  gu: () => import("@/locales/tours/gu.json", { with: { type: "json" } }),
  ta: () => import("@/locales/tours/ta.json", { with: { type: "json" } }),
  te: () => import("@/locales/tours/te.json", { with: { type: "json" } }),
  kn: () => import("@/locales/tours/kn.json", { with: { type: "json" } }),
  bn: () => import("@/locales/tours/bn.json", { with: { type: "json" } }),
  ml: () => import("@/locales/tours/ml.json", { with: { type: "json" } }),
  pa: () => import("@/locales/tours/pa.json", { with: { type: "json" } }),
  or: () => import("@/locales/tours/or.json", { with: { type: "json" } }),
};

const tourDictCache = new Map<TourLocale, Record<string, string>>();
const pendingLoads = new Map<TourLocale, Promise<Record<string, string>>>();

/**
 * Dynamically loads and caches the guided tour dictionary for the specified locale.
 * Only loads the required language bundle on demand to protect mobile bundle size.
 */
export async function loadTourDictionary(
  locale: TourLocale,
): Promise<Record<string, string>> {
  const cached = tourDictCache.get(locale);
  if (cached) {
    return cached;
  }

  const pending = pendingLoads.get(locale);
  if (pending) {
    return pending;
  }

  const loader = tourDictionaryLoaders[locale] || tourDictionaryLoaders.en;
  const loadPromise = loader()
    .then((mod) => {
      const parsed = mod as unknown as { default?: Record<string, string> };
      const dict = parsed.default || (mod as unknown as Record<string, string>);
      tourDictCache.set(locale, dict);
      pendingLoads.delete(locale);
      return dict;
    })
    .catch(async (err) => {
      // Node.js test environment fallback if dynamic import is constrained
      try {
        if (typeof window === "undefined") {
          const fs = await import("node:fs");
          const path = await import("node:path");
          const jsonPath = path.resolve(process.cwd(), `locales/tours/${locale}.json`);
          if (fs.existsSync(jsonPath)) {
            const raw = fs.readFileSync(jsonPath, "utf8");
            const parsed = JSON.parse(raw);
            tourDictCache.set(locale, parsed);
            pendingLoads.delete(locale);
            return parsed;
          }
        }
      } catch {
        // Ignore fallback error
      }

      console.warn(`⚠️ Failed to load tour dictionary for locale "${locale}":`, err);
      pendingLoads.delete(locale);
      return {};
    });

  pendingLoads.set(locale, loadPromise);
  return loadPromise;
}

/**
 * Synchronous resolver for cached tour translations.
 * Falls back to English dictionary, then undefined.
 */
export function getTourTranslation(
  locale: TourLocale,
  key: string,
): string | undefined {
  const activeDict = tourDictCache.get(locale);
  if (activeDict && activeDict[key]) {
    return activeDict[key];
  }

  const enDict = tourDictCache.get("en");
  if (enDict && enDict[key]) {
    return enDict[key];
  }

  return undefined;
}

/**
 * React hook to reactively subscribe to the tour dictionary for a locale.
 */
export function useTourDictionary(locale: TourLocale) {
  const [dict, setDict] = useState<Record<string, string> | null>(() => {
    return tourDictCache.get(locale) || null;
  });

  useEffect(() => {
    let isMounted = true;
    const cached = tourDictCache.get(locale);
    if (!cached) {
      loadTourDictionary(locale).then((loaded) => {
        if (isMounted) {
          setDict(loaded);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [locale]);

  return tourDictCache.get(locale) || dict;
}
