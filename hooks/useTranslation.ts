"use client";

import { useEffect, useSyncExternalStore } from 'react';
import { useI18nStore } from '@/lib/i18n/store';
import { useI18nSSRContext } from '@/components/shared/I18nProvider';
import {
  en,
  getCachedLocaleDict,
  loadLocaleDict,
  subscribeLocaleLoads,
  type TranslationKey,
} from '@/lib/i18n/translations';
import type { LocaleCode } from '@/lib/i18n/mapping';

export function useTranslation() {
  const ssrCtx = useI18nSSRContext();
  const storeLocale = useI18nStore((state) => state.locale);
  const setLocale = useI18nStore((state) => state.setLocale);

  // Use SSR cookie locale during initial hydration frame to eliminate FOUC & React hydration mismatch
  const locale: LocaleCode = ssrCtx.hydrated ? storeLocale : ssrCtx.initialLocale;

  const cachedDict = useSyncExternalStore(
    subscribeLocaleLoads,
    () => getCachedLocaleDict(locale),
    () => getCachedLocaleDict(locale)
  );

  useEffect(() => {
    if (!cachedDict && locale !== 'en') {
      loadLocaleDict(locale).catch(() => {});
    }
  }, [locale, cachedDict]);

  const currentDict = cachedDict as Record<string, string> | undefined;
  const enDict = en as Record<string, string>;

  const t = (
    key: TranslationKey | (string & {}),
    fallbackOrParams?: string | Record<string, string>,
    maybeParams?: Record<string, string>
  ): string => {
    const fallback = typeof fallbackOrParams === 'string' ? fallbackOrParams : undefined;
    const params =
      typeof fallbackOrParams === 'object' && fallbackOrParams !== null
        ? fallbackOrParams
        : maybeParams;

    let str = '';
    if (currentDict && currentDict[key]) {
      str = currentDict[key];
    } else if (enDict && enDict[key]) {
      str = enDict[key];
    } else {
      str = fallback || key;
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }

    return str;
  };

  return { t, locale, setLocale };
}
